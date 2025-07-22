// supabase/functions/custom-ai-agent/index.ts
// Cache-busting comment: 2025-07-13T10:00:00Z
import { serve } from "http/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, FunctionDeclarationSchemaType } from "@google/generative-ai";

// --- CLIENTS SETUP ---
const supabaseUrl = Deno.env.get("SUPABASE_URL");
if (!supabaseUrl) throw new Error("SUPABASE_URL is not set");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
if (!supabaseAnonKey) throw new Error("SUPABASE_ANON_KEY is not set");
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
if (!geminiApiKey) throw new Error("GEMINI_API_KEY is not set");
const genAI = new GoogleGenerativeAI(geminiApiKey);

const perplexityApiKey = Deno.env.get("PPLX_API_KEY");
const stabilityApiKey = Deno.env.get("STABILITY_API_KEY");

// --- SAFETY SETTINGS ---
const safetySettings = [ { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE }, { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE }, { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE }, { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE } ];

// --- SYSTEM INSTRUCTIONS ---
const classicSystemInstruction = {
  role: "system",
  parts: [{ text: `
    You are 'Classic AI', an expert business analyst for 'Classic Offset'. You must follow these rules strictly.
    
    RULE 1 (ID HANDLING): When a user asks to perform an action on a customer (e.g., send a reminder), you must first find the correct customer_id (UUID) using the 'getCustomerDetails' tool if you don't already have it.

    RULE 2 (TOOL USE): Use your specialized data tools for questions about internal business data. Use 'performWebSearch' for general knowledge.
    
    RULE 3 (BE SPECIFIC): Use the most specific tool available.
    
    RULE 4 (CONTEXT): Remember and reuse IDs from previous turns correctly.
    
    RULE 5 (FORMATTING): Format responses as professional Markdown.
    
    RULE 6 (LANGUAGE): Respond in Tamil if the user asks in Tamil.
  ` }]
};


// --- TOOLS DEFINITION (Simplified) ---
const classicTools = [{ functionDeclarations: [
    {
        name: "getDashboardMetrics",
        description: "Retrieves a summary of key business metrics.",
        parameters: { "type": FunctionDeclarationSchemaType.OBJECT, "properties": {} }
    },
    {
        name: "performWebSearch",
        description: "For general knowledge or real-time info.",
        parameters: { "type": FunctionDeclarationSchemaType.OBJECT, "properties": { "query": { "type": FunctionDeclarationSchemaType.STRING } }, required: ["query"] }
    },
    {
        name: "sendWhatsAppPaymentReminder",
        description: "Sends a WhatsApp payment reminder to a customer who has a pending balance.",
        parameters: {
            "type": FunctionDeclarationSchemaType.OBJECT,
            "properties": {
                "customer_id": { "type": FunctionDeclarationSchemaType.STRING, "description": "The UUID of the customer to whom the reminder will be sent. You must find this using 'getCustomerDetails' if you don't have it." }
            },
            "required": ["customer_id"]
        }
    },
    { name: "getCustomerDetails", description: "Get customer details by name, including their UUID.", parameters: { "type": FunctionDeclarationSchemaType.OBJECT, "properties": { "customer_name": { "type": FunctionDeclarationSchemaType.STRING } }, "required": ["customer_name"] } },
    { name: "getOrdersForCustomer", description: "Get all orders for a customer by ID.", parameters: { "type": FunctionDeclarationSchemaType.OBJECT, "properties": { "customer_id": { "type": FunctionDeclarationSchemaType.STRING } }, "required": ["customer_id"] } },
    { name: "getPaymentsForCustomer", description: "Get all payments for a customer by ID.", parameters: { "type": FunctionDeclarationSchemaType.OBJECT, "properties": { "customer_id": { "type": FunctionDeclarationSchemaType.STRING } }, "required": ["customer_id"] } },
    { name: "getFinancialSummary", description: "Get financial summary for a month (YYYY-MM-DD).", parameters: { "type": FunctionDeclarationSchemaType.OBJECT, "properties": { "month": { "type": FunctionDeclarationSchemaType.STRING } }, "required": ["month"] } }, 
    { name: "getRecentDuePayments", description: "Get recent due payments.", parameters: { "type": FunctionDeclarationSchemaType.OBJECT, "properties": {} } }, 
    { name: "getLowStockMaterials", description: "Get low stock materials.", parameters: { "type": FunctionDeclarationSchemaType.OBJECT, "properties": {} } }, 
    { name: "getTopSpendingCustomers", description: "Get top spending customers.", parameters: { "type": FunctionDeclarationSchemaType.OBJECT, "properties": { "limit": { "type": FunctionDeclarationSchemaType.NUMBER } }, "required": ["limit"] } }, 
    { name: "getBestSellingProducts", description: "Get best selling products.", parameters: { "type": FunctionDeclarationSchemaType.OBJECT, "properties": { "limit": { "type": FunctionDeclarationSchemaType.NUMBER } }, "required": ["limit"] } }, 
    { name: "createNewCustomer", description: "Create a new customer.", parameters: { "type": FunctionDeclarationSchemaType.OBJECT, "properties": { "name": { "type": FunctionDeclarationSchemaType.STRING }, "phone": { "type": FunctionDeclarationSchemaType.STRING }, "address": { "type": FunctionDeclarationSchemaType.STRING } }, "required": ["name", "phone"] } }, 
    { name: "logNewExpense", description: "Log a new expense.", parameters: { "type": FunctionDeclarationSchemaType.OBJECT, "properties": { "expense_type": { "type": FunctionDeclarationSchemaType.STRING }, "amount": { "type": FunctionDeclarationSchemaType.NUMBER }, "paid_to": { "type": FunctionDeclarationSchemaType.STRING } }, "required": ["expense_type", "amount", "paid_to"] } } 
] }];

async function performPerplexitySearch(query: string): Promise<string> {
    if (!perplexityApiKey) return "Error: PPLX_API_KEY not configured.";
    const requestBody = { model: 'sonar', messages: [ { role: 'system', content: "You are a web search API. Provide a direct, factual, and concise answer." }, { role: 'user', content: query } ] };
    try {
        const response = await fetch("https://api.perplexity.ai/chat/completions", { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${perplexityApiKey}` }, body: JSON.stringify(requestBody) });
        if (!response.ok) { const errorText = await response.text(); return `Perplexity API Error (${response.status}): ${errorText}`; }
        const data = await response.json();
        return data.choices[0]?.message?.content || "No information found.";
    } catch (error) { return `Failed to connect to Perplexity API: ${error.message}`; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  try {
    const { history } = await req.json();
    if (!history) return new Response(JSON.stringify({ error: "History is required." }), { status: 400 });

    const userToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!userToken) return new Response(JSON.stringify({ error: "Authorization required." }), { status: 401 });
    const { data: { user } } = await supabase.auth.getUser(userToken);
    if (!user) return new Response(JSON.stringify({ error: "Invalid user token." }), { status: 401 });

    const latestUserMessage = history[history.length - 1]?.parts[0]?.text;
    if (!latestUserMessage) return new Response(JSON.stringify({ error: "User message is missing." }), { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", tools: classicTools, systemInstruction: classicSystemInstruction, safetySettings });
    const chat = model.startChat({ history: history.slice(0, -1) });
    let result = await chat.sendMessage(latestUserMessage);

    for (let i = 0; i < 5; i++) {
        const functionCalls = result.response.functionCalls();
        if (!functionCalls || functionCalls.length === 0) break;
        const call = functionCalls[0];
        let toolResponseContent;

        console.log(`[LOG] AI wants to call: ${call.name} with args: ${JSON.stringify(call.args)}`);

        try {
            if (call.name === "getDashboardMetrics") {
                const { data, error } = await supabase.rpc('get_dashboard_metrics');
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data);
            }
            else if (call.name === "performWebSearch") {
                toolResponseContent = await performPerplexitySearch(call.args.query as string);
            }
            else if (call.name === "sendWhatsAppPaymentReminder") {
                const { data, error } = await supabase.rpc('send_whatsapp_payment_reminder', {
                    p_customer_id: call.args.customer_id as string
                });
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data);
            }
            else if (call.name === "getCustomerDetails") {
                const { data, error } = await supabase.from("customers").select().ilike("name", `%${call.args.customer_name as string}%`);
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            }
            else if (call.name === "getOrdersForCustomer") {
                const { data, error } = await supabase.from("orders").select().eq("customer_id", call.args.customer_id as string);
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            }
            else if (call.name === "getPaymentsForCustomer") {
                const { data, error } = await supabase.from("payments").select().eq("customer_id", call.args.customer_id as string);
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            }
            else if (call.name === "getFinancialSummary") {
                const { data, error } = await supabase.rpc('get_financial_summary', { p_month: call.args.month as string });
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            }
            else if (call.name === "getRecentDuePayments") {
                const { data, error } = await supabase.rpc('get_recent_due_payments');
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            }
            else if (call.name === "getLowStockMaterials") {
                const { data, error } = await supabase.rpc('get_low_stock_materials');
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            }
            else if (call.name === "getTopSpendingCustomers") {
                const { data, error } = await supabase.rpc('get_top_spending_customers', { p_limit: call.args.limit as number });
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            }
            else if (call.name === "getBestSellingProducts") {
                const { data, error } = await supabase.rpc('get_best_selling_products', { p_limit: call.args.limit as number });
                toolResponseContent = error ? `DB Error: ${error.message}` : JSON.stringify(data || 'Not found');
            }
            else if (call.name === "createNewCustomer") {
                const { name, phone, address } = call.args as { name: string; phone: string; address: string };
                const { data, error } = await supabase.from('customers').insert([{ name, phone, address }]).select();
                toolResponseContent = error ? `DB Error: ${error.message}` : `Successfully created new customer: ${JSON.stringify(data)}`;
            }
            else if (call.name === "logNewExpense") {
                const { expense_type, amount, paid_to } = call.args as { expense_type: string; amount: number; paid_to: string };
                const { data, error } = await supabase.from('expenses').insert([{ date: new Date(), expense_type, amount, paid_to }]).select();
                toolResponseContent = error ? `DB Error: ${error.message}` : `Successfully logged new expense: ${JSON.stringify(data)}`;
            } else {
                 toolResponseContent = `Unknown function call: ${call.name}`;
            }
        } catch(e) {
            console.error(`[ERROR] Tool ${call.name} failed:`, e.message);
            toolResponseContent = `Error: The function '${call.name}' failed.`;
        }

        result = await chat.sendMessage(JSON.stringify({ functionResponse: { name: call.name, response: { content: toolResponseContent } } }));
    }

    return new Response(JSON.stringify({ response: result.response.text() }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (error) {
    console.error("Main server error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
});
