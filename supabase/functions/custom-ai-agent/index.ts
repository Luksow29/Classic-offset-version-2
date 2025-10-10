// supabase/functions/custom-ai-agent/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

// Import configurations from JSON files
import classicTools from './tools.json' with {
  type: 'json'
};
import classicSystemInstruction from './system-instruction.json' with {
  type: 'json'
};

// --- CLIENTS & API KEYS ---
const supabaseUrl = Deno.env.get("SUPABASE_URL");
if (!supabaseUrl) throw new Error("SUPABASE_URL is not set");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

// Use the Admin client to bypass RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
if (!geminiApiKey) throw new Error("GEMINI_API_KEY is not set");
const genAI = new GoogleGenerativeAI(geminiApiKey);

// --- CORS HEADERS ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// --- TOOL IMPLEMENTATION ---
async function doWebSearch(query) {
  const { data, error } = await supabaseAdmin.functions.invoke('web-search', {
    body: {
      query
    }
  });
  if (error) throw error;
  return data.response || data.error;
}

async function handleToolCall(functionCall) {
  const { name, args } = functionCall;
  console.log(`[LOG] Manager AI calling tool: ${name} with args: ${JSON.stringify(args)}`);
  
  try {
    switch(name){
      case "perform_web_search":
        {
          return await doWebSearch(args.query);
        }
      case "generate_whatsapp_link":
        {
          const phone = args.phone.replace(/\D/g, ''); // Remove non-digit characters
          const text = encodeURIComponent(args.text);
          return `https://wa.me/${phone}?text=${text}`;
        }
      case "getCurrentDate":
        {
          try {
            const response = await fetch("http://worldtimeapi.org/api/timezone/Etc/UTC");
            if (!response.ok) {
              throw new Error(`Time API failed with status: ${response.status}`);
            }
            const data = await response.json();
            const currentDate = data.utc_datetime.slice(0, 10); // Extract YYYY-MM-DD
            return `இன்றைய தேதி: ${currentDate}`;
          } catch (e) {
            console.error("Error fetching current date from API, falling back to web search:", e);
            // Fallback to web search
            return await doWebSearch("current date YYYY-MM-DD");
          }
        }
      case "get_daily_briefing":
        {
          const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
          const ordersPromise = supabaseAdmin.from('orders').select('*', {
            count: 'exact',
            head: true
          }).eq('date', today);
          const revenuePromise = supabaseAdmin.from('orders').select('total_amount').eq('date', today);
          const customersPromise = supabaseAdmin.from('customers').select('*', {
            count: 'exact',
            head: true
          }).eq('joined_date', today);
          const materialsPromise = supabaseAdmin.from('materials').select('material_name, current_quantity, minimum_stock_level, unit_of_measurement');
          
          const [{ count: newOrdersCount, error: ordersError }, { data: revenueData, error: revenueError }, { count: newCustomersCount, error: customersError }, { data: allMaterials, error: stockError }] = await Promise.all([
            ordersPromise,
            revenuePromise,
            customersPromise,
            materialsPromise
          ]);
          
          if (ordersError) throw new Error(`Fetching orders: ${ordersError.message}`);
          if (revenueError) throw new Error(`Fetching revenue: ${revenueError.message}`);
          if (customersError) throw new Error(`Fetching customers: ${customersError.message}`);
          if (stockError) throw new Error(`Fetching stock: ${stockError.message}`);
          
          const totalRevenue = (revenueData || []).reduce((sum, order)=>sum + (order.total_amount || 0), 0);
          const lowStockData = (allMaterials || []).filter((material)=>material.current_quantity < material.minimum_stock_level);
          
          let briefing = `### இன்றைய சுருக்கம்\n\n`;
          briefing += `*   **புதிய ஆர்டர்கள்**: ${newOrdersCount || 0}\n`;
          briefing += `*   **இன்றைய வருமானம்**: ₹${totalRevenue.toFixed(2)}\n`;
          briefing += `*   **புதிய வாடிக்கையாளர்கள்**: ${newCustomersCount || 0}\n`;
          
          if (lowStockData.length > 0) {
            briefing += `*   **குறைந்த ஸ்டாக் எச்சரிக்கைகள்**:\n`;
            lowStockData.forEach((item)=>{
              briefing += `    *   ${item.material_name} - ${item.current_quantity} ${item.unit_of_measurement} மட்டுமே உள்ளது.\n`;
            });
          } else {
            briefing += `*   **ஸ்டாக் நிலை**: அனைத்தும் போதுமான அளவில் உள்ளது.\n`;
          }
          return briefing;
        }
      case "getCustomerDetails":
        {
          const { data, error } = await supabaseAdmin.from("customers").select('id, name, phone, email').ilike("name", `%${args.customer_name}%`);
          if (error) return `DB பிழை: ${error.message}`;
          if (!data || data.length === 0) return `"${args.customer_name}" என்ற பெயரில் வாடிக்கையாளர் இல்லை.`;
          if (data.length > 1) return `"${args.customer_name}" என்ற பெயரில் பலர் உள்ளனர்: ${data.map((c)=>c.name).join(', ')}. ஒருவரைத் தேர்ந்தெடுக்கவும்.`;
          return JSON.stringify(data[0]);
        }
      case "createNewCustomer":
        {
          const { data, error } = await supabaseAdmin.from('customers').insert([
            args
          ]).select();
          return error ? `DB Error: ${error.message}` : `வெற்றிகரமாகப் புதிய வாடிக்கையாளர் உருவாக்கப்பட்டது: ${JSON.stringify(data)}`;
        }
      case "getOrdersForCustomer":
        {
          const { data, error } = await supabaseAdmin.from("orders").select("id, date, order_type, total_amount, balance_amount").eq("customer_id", args.customer_id);
          if (error) return `DB Error: ${error.message}`;
          return data && data.length > 0 ? JSON.stringify(data) : 'இந்த வாடிக்கையாளருக்கு ஆர்டர்கள் எதுவும் இல்லை.';
        }
      case "getPaymentsForCustomer":
        {
          const { data, error } = await supabaseAdmin.from("payments").select().eq("customer_id", args.customer_id);
          if (error) return `DB Error: ${error.message}`;
          return data && data.length > 0 ? JSON.stringify(data) : 'இந்த வாடிக்கையாளருக்கு பணம் செலுத்தியதற்கான பதிவுகள் எதுவும் இல்லை.';
        }
      case "logNewExpense":
        {
          const { data, error } = await supabaseAdmin.from('expenses').insert([
            {
              date: new Date().toISOString(),
              ...args
            }
          ]).select();
          return error ? `DB Error: ${error.message}` : `செலவு வெற்றிகரமாகப் பதிவு செய்யப்பட்டது: ${JSON.stringify(data)}`;
        }
      // RPC Calls
      case "getFinancialSummary":
      case "getRecentDuePayments":
      case "getLowStockMaterials":
      case "getTopSpendingCustomersByMonth":
      case "getTopSpendingCustomersOverall":
      case "getAllCustomers":
      case "getProductDetails":
      case "getAllProducts":
      case "createNewProduct":
      case "createNewOrder":
      case "get_all_due_payments_summary":
        {
          // Map tool name to the actual SQL function name if they differ.
          const functionNameMap = {
            getTopSpendingCustomersOverall: 'get_top_spending_customers_overall',
            getAllCustomers: 'get_all_customers',
            getProductDetails: 'get_product_details',
            getAllProducts: 'get_all_products',
            createNewProduct: 'create_new_product',
            createNewOrder: 'create_new_order'
          };
          const sqlFunctionName = functionNameMap[name] || name;
          let rpc_params = {};
          if (name === 'getTopSpendingCustomersByMonth') {
            rpc_params = {
              p_month: args.month,
              p_limit: args.limit || 5
            };
          } else if (name === 'getFinancialSummary') {
            rpc_params = {
              p_month: args.month
            };
          } else if (name === 'getTopSpendingCustomersOverall') {
            rpc_params = {
              p_limit: args.limit || 5
            };
          } else if (name === 'getProductDetails') {
            rpc_params = {
              p_product_name: args.product_name
            };
          } else if (name === 'createNewProduct') {
            rpc_params = {
              p_name: args.name,
              p_unit_price: args.unit_price,
              p_description: args.description,
              p_category: args.category
            };
          } else if (name === 'createNewOrder') {
            rpc_params = {
              p_customer_id: args.customer_id,
              p_product_id: args.product_id,
              p_quantity: args.quantity,
              p_total_amount: args.total_amount,
              p_design_needed: args.design_needed,
              p_notes: args.notes
            };
          }
          const { data, error } = await supabaseAdmin.rpc(sqlFunctionName, rpc_params);
          if (error) return `DB Error: ${error.message}. (SQL function '${sqlFunctionName}' உள்ளதா என சரிபார்க்கவும்)`;
          // For RPC calls that might return empty arrays, also provide a clear message.
          if (Array.isArray(data) && data.length === 0) {
            return `The query for '${sqlFunctionName}' returned no results.`;
          }
          return JSON.stringify(data);
        }
      default:
        return `தெரியாத கருவி: ${name}`;
    }
  } catch (e) {
    return `கருவியை இயக்கும்போது பிழை: ${e.message}`;
  }
}

// --- MAIN SERVER LOGIC ---
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200
    });
  }
  
  try {
    const { history } = await req.json();
    if (!history) throw new Error("History is required.");
    
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash",
      systemInstruction: classicSystemInstruction,
      tools: classicTools
    });    const chat = model.startChat({
      history: history.slice(0, -1)
    });
    
    let result = await chat.sendMessage(history.at(-1).parts);
    
    for(let i = 0; i < 5; i++){
      const call = result.response.functionCalls()?.[0];
      if (!call) break;
      
      const toolResponseContent = await handleToolCall(call);
      result = await chat.sendMessage(JSON.stringify({
        functionResponse: {
          name: call.name,
          response: {
            content: toolResponseContent
          }
        }
      }));
    }
    
    return new Response(JSON.stringify({
      response: result.response.text()
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Main server error:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
