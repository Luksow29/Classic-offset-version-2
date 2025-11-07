// supabase/functions/lm-studio-proxy/index.ts
// Secure proxy that lets Netlify (or any remote client) talk to LM Studio

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const lmStudioBaseUrl = Deno.env.get("LM_STUDIO_BASE_URL");
if (!lmStudioBaseUrl) {
  throw new Error("LM_STUDIO_BASE_URL is not configured");
}
const lmStudioApiKey = Deno.env.get("LM_STUDIO_API_KEY") ?? "";

interface ProxyRequestBody {
  path?: string;
  method?: string;
  payload?: unknown;
  stream?: boolean;
}

async function forwardRequest(body: ProxyRequestBody) {
  const path = body.path || "/v1/chat/completions";
  const method = (body.method || "POST").toUpperCase();
  const stream = Boolean(body.stream);
  const targetUrl = `${lmStudioBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (lmStudioApiKey) {
    headers["Authorization"] = `Bearer ${lmStudioApiKey}`;
  }

  const upstream = await fetch(targetUrl, {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify(body.payload ?? {}),
  });

  if (stream) {
    const readable = upstream.body;
    if (!readable) {
      throw new Error("Upstream stream not available");
    }
    const streamHeaders = {
      ...corsHeaders,
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Content-Type": upstream.headers.get("content-type") ?? "text/event-stream",
      "Transfer-Encoding": "chunked",
    };
    return new Response(readable, { status: upstream.status, headers: streamHeaders });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/json";
  const text = await upstream.text();
  const responseHeaders = {
    ...corsHeaders,
    "Content-Type": contentType,
  };

  if (!upstream.ok) {
    return new Response(text || upstream.statusText, { status: upstream.status, headers: responseHeaders });
  }

  return new Response(text, { status: 200, headers: responseHeaders });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Only POST is supported" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body: ProxyRequestBody = await req.json();
    return await forwardRequest(body);
  } catch (error) {
    console.error("[lm-studio-proxy] error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
});
