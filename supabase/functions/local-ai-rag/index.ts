// supabase/functions/local-ai-rag/index.ts
// Pure Data Service - No AI Processing, Just Database Operations
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CORS HEADERS ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// --- SUPABASE CLIENT ---
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

async function resolveCustomerId(params: { customer_id?: number; customer_name?: string }): Promise<number | null> {
  if (params.customer_id) return params.customer_id;
  if (!params.customer_name) return null;

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id')
    .ilike('name', `%${params.customer_name}%`)
    .limit(1);

  if (error) throw error;
  return data && data.length > 0 ? data[0].id : null;
}

// --- PURE DATA OPERATIONS ---
type OperationParams = Record<string, unknown> & {
  customer_id?: number;
  customer_name?: string;
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
  month?: string | number;
  limit?: number;
  product_name?: string;
  unit_price?: number;
  category?: string;
  product_id?: number;
  quantity?: number;
  total_amount?: number;
  design_needed?: boolean;
  notes?: string;
  expense_type?: string;
  amount?: number;
  paid_to?: string;
  description?: string;
};

async function handleDataOperation(operation: string, params: OperationParams = {}) {
  console.log(`[DATA SERVICE] Operation: ${operation}`, params);
  
  try {
    switch(operation) {
      // Customer Operations
      case "getAllCustomers":
        {
          const { data, error } = await supabaseAdmin.from("customers").select('id, name, phone, email, address, joined_date');
          if (error) throw error;
          return { success: true, data, count: data?.length || 0 };
        }
      
      case "getCustomerDetails":
        {
          const { data, error } = await supabaseAdmin.from("customers").select('id, name, phone, email, address, joined_date').ilike("name", `%${params.customer_name}%`);
          if (error) throw error;
          return { success: true, data, count: data?.length || 0 };
        }
      
      case "createNewCustomer":
        {
          const { data, error } = await supabaseAdmin.from('customers').insert([{
            name: params.name,
            phone: params.phone,
            address: params.address || null,
            email: params.email || null,
            joined_date: new Date().toISOString().slice(0, 10)
          }]).select();
          if (error) throw error;
          return { success: true, data, message: "Customer created successfully" };
        }
      
      case "getCustomerOrders":
        {
          const customerId = await resolveCustomerId(params);
          if (!customerId) {
            return { success: false, message: "Customer not found" };
          }
          const { data, error } = await supabaseAdmin
            .from("orders")
            .select("id, date, order_type, total_amount, balance_amount, status")
            .eq("customer_id", customerId);
          if (error) throw error;
          return { success: true, data, count: data?.length || 0 };
        }
      
      case "getCustomerPayments":
        {
          const customerId = await resolveCustomerId(params);
          if (!customerId) {
            return { success: false, message: "Customer not found" };
          }
          const { data, error } = await supabaseAdmin
            .from("payments")
            .select("*")
            .eq("customer_id", customerId);
          if (error) throw error;
          return { success: true, data, count: data?.length || 0 };
        }

      // Financial Operations
      case "getFinancialSummary":
        {
          const { data, error } = await supabaseAdmin.rpc('getFinancialSummary', {
            p_month: params.month
          });
          if (error) throw error;
          return { success: true, data };
        }
      
      case "getDailyBriefing":
        {
          const today = new Date().toISOString().slice(0, 10);
          
          // Get today's orders
          const { data: todayOrders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select('total_amount, status')
            .eq('date', today);
          
          // Get today's customers
          const { count: newCustomersCount, error: customersError } = await supabaseAdmin
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('joined_date', today);
          
          // Get low stock materials
          const { data: materials, error: stockError } = await supabaseAdmin
            .from('materials')
            .select('material_name, current_quantity, minimum_stock_level, unit_of_measurement')
            .lt('current_quantity', 'minimum_stock_level');
          
          if (ordersError || customersError || stockError) {
            throw new Error(`Data fetch error: ${ordersError?.message || customersError?.message || stockError?.message}`);
          }
          
          const totalRevenue = todayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
          const orderCount = todayOrders?.length || 0;
          
          return {
            success: true,
            data: {
              date: today,
              newOrders: orderCount,
              totalRevenue: totalRevenue,
              newCustomers: newCustomersCount || 0,
              lowStockItems: materials || [],
              lowStockCount: materials?.length || 0
            }
          };
        }
      
      case "getTopCustomers":
        {
          const { data, error } = await supabaseAdmin.rpc('get_top_spending_customers_overall', {
            p_limit: params.limit || 5
          });
          if (error) throw error;
          return { success: true, data };
        }
      
      case "getTopCustomersByMonth":
        {
          const { data, error } = await supabaseAdmin.rpc('getTopSpendingCustomersByMonth', {
            p_month: params.month,
            p_limit: params.limit || 5
          });
          if (error) throw error;
          return { success: true, data };
        }
      
      case "getDuePayments":
        {
          const { data, error } = await supabaseAdmin.rpc('getRecentDuePayments');
          if (error) throw error;
          return { success: true, data };
        }
      
      case "getDuePaymentsSummary":
        {
          const { data, error } = await supabaseAdmin.rpc('get_all_due_payments_summary');
          if (error) throw error;
          return { success: true, data };
        }

      // Product Operations
      case "getAllProducts":
        {
          const { data, error } = await supabaseAdmin.from("products").select('id, name, unit_price, description, category');
          if (error) throw error;
          return { success: true, data, count: data?.length || 0 };
        }
      
      case "getProductDetails":
        {
          const { data, error } = await supabaseAdmin.from("products").select('id, name, unit_price, description, category').ilike("name", `%${params.product_name}%`);
          if (error) throw error;
          return { success: true, data, count: data?.length || 0 };
        }
      
      case "createNewProduct":
        {
          const { data, error } = await supabaseAdmin.from('products').insert([{
            name: params.name,
            unit_price: params.unit_price,
            description: params.description || null,
            category: params.category || null
          }]).select();
          if (error) throw error;
          return { success: true, data, message: "Product created successfully" };
        }

      // Order Operations
      case "createNewOrder":
        {
          const { data, error } = await supabaseAdmin.from('orders').insert([{
            customer_id: params.customer_id,
            product_id: params.product_id,
            quantity: params.quantity,
            total_amount: params.total_amount,
            design_needed: params.design_needed || false,
            notes: params.notes || null,
            date: new Date().toISOString().slice(0, 10),
            status: 'Pending',
            balance_amount: params.total_amount // Initially full amount is due
          }]).select();
          if (error) throw error;
          return { success: true, data, message: "Order created successfully" };
        }
      
      case "getRecentOrders":
        {
          const { data, error } = await supabaseAdmin
            .from('orders')
            .select('id, date, order_type, total_amount, status, customers(name)')
            .order('date', { ascending: false })
            .limit(params.limit || 10);
          if (error) throw error;
          return { success: true, data, count: data?.length || 0 };
        }

      // Expense Operations
      case "logNewExpense":
        {
          const { data, error } = await supabaseAdmin.from('expenses').insert([{
            date: new Date().toISOString().slice(0, 10),
            expense_type: params.expense_type,
            amount: params.amount,
            paid_to: params.paid_to,
            description: params.description || null
          }]).select();
          if (error) throw error;
          return { success: true, data, message: "Expense logged successfully" };
        }

      // Stock Operations
      case "getLowStockMaterials":
        {
          const { data, error } = await supabaseAdmin.rpc('getLowStockMaterials');
          if (error) throw error;
          return { success: true, data };
        }
      
      case "getAllMaterials":
        {
          const { data, error } = await supabaseAdmin.from('materials').select('*');
          if (error) throw error;
          return { success: true, data, count: data?.length || 0 };
        }

      // Utility Operations
      case "getCurrentDate":
        {
          const currentDate = new Date().toISOString().slice(0, 10);
          return { success: true, data: { date: currentDate, formatted: currentDate } };
        }

      default:
        return { success: false, error: `Unknown operation: ${operation}` };
    }
  } catch (error) {
    console.error(`[DATA SERVICE ERROR] ${operation}:`, error);
    return { success: false, error: error.message };
  }
}

// --- MAIN HANDLER ---
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { operation, params } = await req.json();
    
    if (!operation) {
      return new Response(
        JSON.stringify({ success: false, error: 'Operation parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await handleDataOperation(operation, params);
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('[DATA SERVICE] Handler error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
