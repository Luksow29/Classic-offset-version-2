export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          billing_address: string | null
          birthday: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          id: string
          joined_date: string | null
          last_interaction: string | null
          name: string
          phone: string | null
          secondary_phone: string | null
          shipping_address: string | null
          tags: string[] | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          billing_address?: string | null
          birthday?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          joined_date?: string | null
          last_interaction?: string | null
          name: string
          phone?: string | null
          secondary_phone?: string | null
          shipping_address?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          billing_address?: string | null
          birthday?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          joined_date?: string | null
          last_interaction?: string | null
          name?: string
          phone?: string | null
          secondary_phone?: string | null
          shipping_address?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          app_user_id: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          job_role: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          app_user_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          job_role?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          app_user_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          job_role?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_app_user_id_fkey"
            columns: ["app_user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          expense_type: string
          id: number
          notes: string | null
          paid_to: string
          payment_method: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          expense_type: string
          id?: number
          notes?: string | null
          paid_to: string
          payment_method?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          expense_type?: string
          id?: number
          notes?: string | null
          paid_to?: string
          payment_method?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      features: {
        Row: {
          created_at: string | null
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          category: string | null
          description: string | null
          filename: string
          id: string
          title: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          filename: string
          id?: string
          title?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          filename?: string
          id?: string
          title?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempt_count: number | null
          attempted_at: string | null
          id: string
          ip_address: string
          locked_until: string | null
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          attempt_count?: number | null
          attempted_at?: string | null
          id?: string
          ip_address: string
          locked_until?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          attempt_count?: number | null
          attempted_at?: string | null
          id?: string
          ip_address?: string
          locked_until?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      material_audit_log: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          id: string
          ip_address: unknown | null
          material_id: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          ip_address?: unknown | null
          material_id?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          ip_address?: unknown | null
          material_id?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_audit_log_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_audit_log_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      material_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      material_stock_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_resolved: boolean | null
          material_id: string
          message: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          material_id: string
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          material_id?: string
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_stock_alerts_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_stock_alerts_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      material_transactions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          material_id: string
          notes: string | null
          quantity: number
          reference_number: string | null
          total_cost: number | null
          transaction_date: string | null
          transaction_type: string
          unit_cost: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          material_id: string
          notes?: string | null
          quantity: number
          reference_number?: string | null
          total_cost?: number | null
          transaction_date?: string | null
          transaction_type: string
          unit_cost?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          material_id?: string
          notes?: string | null
          quantity?: number
          reference_number?: string | null
          total_cost?: number | null
          transaction_date?: string | null
          transaction_type?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_transactions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_transactions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category_id: string | null
          cost_per_unit: number | null
          created_at: string | null
          created_by: string | null
          current_quantity: number | null
          description: string | null
          id: string
          is_active: boolean | null
          last_purchase_date: string | null
          material_name: string
          minimum_stock_level: number | null
          purchase_date: string | null
          storage_location: string | null
          supplier_id: string | null
          unit_of_measurement: string
          updated_at: string | null
          updated_by: string | null
          version: number | null
        }
        Insert: {
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          created_by?: string | null
          current_quantity?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_purchase_date?: string | null
          material_name: string
          minimum_stock_level?: number | null
          purchase_date?: string | null
          storage_location?: string | null
          supplier_id?: string | null
          unit_of_measurement?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Update: {
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          created_by?: string | null
          current_quantity?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_purchase_date?: string | null
          material_name?: string
          minimum_stock_level?: number | null
          purchase_date?: string | null
          storage_location?: string | null
          supplier_id?: string | null
          unit_of_measurement?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: number
          is_read: boolean | null
          link_to: string | null
          message: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          link_to?: string | null
          message?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          link_to?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_requests: {
        Row: {
          created_at: string
          customer_id: string
          id: number
          rejection_reason: string | null
          request_data: Json
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: number
          rejection_reason?: string | null
          request_data: Json
          status?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: number
          rejection_reason?: string | null
          request_data?: Json
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_log: {
        Row: {
          id: string
          order_id: number | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          order_id?: number | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          order_id?: number | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "all_order_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_status_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payment_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_status_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payment_summary_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_status_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary_with_dues"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_status_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "payment_summary_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_status_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "unfinished_order_status"
            referencedColumns: ["order_id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_received: number | null
          balance_amount: number | null
          created_at: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          date: string
          deleted_at: string | null
          delivery_date: string | null
          design_needed: boolean
          designer_id: string | null
          id: number
          is_deleted: boolean | null
          notes: string | null
          order_type: string
          payment_method: string | null
          product_id: number | null
          quantity: number
          rate: number | null
          total_amount: number
          user_id: string | null
        }
        Insert: {
          amount_received?: number | null
          balance_amount?: number | null
          created_at?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          date: string
          deleted_at?: string | null
          delivery_date?: string | null
          design_needed: boolean
          designer_id?: string | null
          id?: number
          is_deleted?: boolean | null
          notes?: string | null
          order_type: string
          payment_method?: string | null
          product_id?: number | null
          quantity: number
          rate?: number | null
          total_amount?: number
          user_id?: string | null
        }
        Update: {
          amount_received?: number | null
          balance_amount?: number | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          date?: string
          deleted_at?: string | null
          delivery_date?: string | null
          design_needed?: boolean
          designer_id?: string | null
          id?: number
          is_deleted?: boolean | null
          notes?: string | null
          order_type?: string
          payment_method?: string | null
          product_id?: number | null
          quantity?: number
          rate?: number | null
          total_amount?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_designer_id"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          id: number
          new_data: Json | null
          notes: string | null
          old_data: Json | null
          old_values: Json | null
          payment_id: string
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          id?: number
          new_data?: Json | null
          notes?: string | null
          old_data?: Json | null
          old_values?: Json | null
          payment_id: string
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: number
          new_data?: Json | null
          notes?: string | null
          old_data?: Json | null
          old_values?: Json | null
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payment_history_payment_id"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paid: number
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          due_date: string | null
          id: string
          notes: string | null
          order_id: number | null
          payment_date: string | null
          payment_method: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          order_id?: number | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          order_id?: number | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "all_order_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payment_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payment_summary_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary_with_dues"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "payment_summary_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "unfinished_order_status"
            referencedColumns: ["order_id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: number
          name: string
          unit_price: number
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          unit_price: number
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          unit_price?: number
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          id: string
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      security_audit: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: string | null
          id: string
          last_updated_at: string | null
          section_name: string
        }
        Insert: {
          content?: string | null
          id?: string
          last_updated_at?: string | null
          section_name: string
        }
        Update: {
          content?: string | null
          id?: string
          last_updated_at?: string | null
          section_name?: string
        }
        Relationships: []
      }
      staff_logs: {
        Row: {
          created_at: string | null
          date: string
          employee_id: string | null
          id: number
          notes: string | null
          role: string | null
          time_in: string | null
          time_out: string | null
          work_done: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          employee_id?: string | null
          id?: number
          notes?: string | null
          role?: string | null
          time_in?: string | null
          time_out?: string | null
          work_done?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          employee_id?: string | null
          id?: number
          notes?: string | null
          role?: string | null
          time_in?: string | null
          time_out?: string | null
          work_done?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      stock: {
        Row: {
          balance: number | null
          category: string | null
          id: number
          item_name: string
          last_updated: string | null
          minimum_stock_level: number | null
          quantity_in: number
          quantity_used: number
        }
        Insert: {
          balance?: number | null
          category?: string | null
          id?: number
          item_name: string
          last_updated?: string | null
          minimum_stock_level?: number | null
          quantity_in?: number
          quantity_used?: number
        }
        Update: {
          balance?: number | null
          category?: string | null
          id?: number
          item_name?: string
          last_updated?: string | null
          minimum_stock_level?: number | null
          quantity_in?: number
          quantity_used?: number
        }
        Relationships: []
      }
      stock_usage_log: {
        Row: {
          id: number
          notes: string | null
          stock_id: number | null
          used_at: string | null
          used_for: string | null
          used_quantity: number
        }
        Insert: {
          id?: number
          notes?: string | null
          stock_id?: number | null
          used_at?: string | null
          used_for?: string | null
          used_quantity: number
        }
        Update: {
          id?: number
          notes?: string | null
          stock_id?: number | null
          used_at?: string | null
          used_for?: string | null
          used_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_usage_log_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stock"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          client_name: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          message: string
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          client_name: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          message: string
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          client_name?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          message?: string
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          color_scheme: string | null
          created_at: string | null
          currency: string | null
          date_format: string | null
          font_size: string | null
          high_contrast: boolean | null
          id: string
          language_preference: string | null
          notification_preferences: Json | null
          reduced_motion: boolean | null
          security_preferences: Json | null
          theme_preference: string | null
          time_format: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color_scheme?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          font_size?: string | null
          high_contrast?: boolean | null
          id?: string
          language_preference?: string | null
          notification_preferences?: Json | null
          reduced_motion?: boolean | null
          security_preferences?: Json | null
          theme_preference?: string | null
          time_format?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color_scheme?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          font_size?: string | null
          high_contrast?: boolean | null
          id?: string
          language_preference?: string | null
          notification_preferences?: Json | null
          reduced_motion?: boolean | null
          security_preferences?: Json | null
          theme_preference?: string | null
          time_format?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_status: {
        Row: {
          id: number
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: number
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: number
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          bio: string | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          role: string | null
        }
        Insert: {
          address?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          role?: string | null
        }
        Update: {
          address?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          last_interaction: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          last_interaction?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          last_interaction?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_log: {
        Row: {
          customer_id: string | null
          customer_name: string | null
          id: number
          message: string
          phone: string
          sent_at: string | null
          sent_by: string | null
          template_name: string | null
        }
        Insert: {
          customer_id?: string | null
          customer_name?: string | null
          id?: number
          message: string
          phone: string
          sent_at?: string | null
          sent_by?: string | null
          template_name?: string | null
        }
        Update: {
          customer_id?: string | null
          customer_name?: string | null
          id?: number
          message?: string
          phone?: string
          sent_at?: string | null
          sent_by?: string | null
          template_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          body: string
          category: string
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      all_order_summary: {
        Row: {
          amount_paid: number | null
          balance_due: number | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_date: string | null
          order_date: string | null
          order_id: number | null
          order_type: string | null
          status: string | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_summary: {
        Row: {
          address: string | null
          balance_due: number | null
          email: string | null
          id: string | null
          joined_date: string | null
          last_order_date: string | null
          name: string | null
          phone: string | null
          total_orders: number | null
          total_paid: number | null
        }
        Insert: {
          address?: string | null
          balance_due?: never
          email?: string | null
          id?: string | null
          joined_date?: string | null
          last_order_date?: never
          name?: string | null
          phone?: string | null
          total_orders?: never
          total_paid?: never
        }
        Update: {
          address?: string | null
          balance_due?: never
          email?: string | null
          id?: string | null
          joined_date?: string | null
          last_order_date?: never
          name?: string | null
          phone?: string | null
          total_orders?: never
          total_paid?: never
        }
        Relationships: []
      }
      latest_order_status: {
        Row: {
          order_id: number | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "all_order_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_status_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payment_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_status_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payment_summary_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_status_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary_with_dues"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_status_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "payment_summary_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_status_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "unfinished_order_status"
            referencedColumns: ["order_id"]
          },
        ]
      }
      materials_with_details: {
        Row: {
          category_id: string | null
          category_name: string | null
          cost_per_unit: number | null
          created_at: string | null
          current_quantity: number | null
          description: string | null
          id: string | null
          is_active: boolean | null
          last_purchase_date: string | null
          material_name: string | null
          minimum_stock_level: number | null
          purchase_date: string | null
          stock_status: string | null
          storage_location: string | null
          supplier_contact: string | null
          supplier_id: string | null
          supplier_name: string | null
          supplier_phone: string | null
          total_value: number | null
          unit_of_measurement: string | null
          updated_at: string | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payment_summary: {
        Row: {
          amount_paid: number | null
          balance: number | null
          customer_id: string | null
          order_id: number | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payment_summary_view: {
        Row: {
          amount_paid: number | null
          balance_amount: number | null
          customer_name: string | null
          order_id: number | null
          total_amount: number | null
        }
        Relationships: []
      }
      order_summary_with_dues: {
        Row: {
          amount_paid: number | null
          balance_due: number | null
          customer_id: string | null
          customer_name: string | null
          date: string | null
          delivery_date: string | null
          due_status: string | null
          order_id: number | null
          status: string | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_summary_view: {
        Row: {
          customer: string | null
          due_amount: number | null
          due_date: string | null
          order_id: number | null
          paid_amount: number | null
          status: string | null
          total_amount: number | null
        }
        Relationships: []
      }
      unfinished_order_status: {
        Row: {
          customer_name: string | null
          delivery_date: string | null
          order_id: number | null
          status: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_order_request: {
        Args: { request_id: number }
        Returns: {
          id: number
        }[]
      }
      check_login_attempts: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      get_best_selling_products: {
        Args: { p_limit: number }
        Returns: Json
      }
      get_comprehensive_business_snapshot: {
        Args: { start_date?: string; end_date?: string }
        Returns: Json
      }
      get_customer_breakdown: {
        Args: { p_start_date: string; p_end_date: string }
        Returns: {
          customer_type: string
          customer_count: number
        }[]
      }
      get_customers_report: {
        Args: { search_term?: string; since_date?: string }
        Returns: {
          customer_id: string
          name: string
          phone: string
          email: string
          created_at: string
        }[]
      }
      get_daily_order_counts: {
        Args: { days_to_check?: number }
        Returns: {
          day: string
          order_count: number
        }[]
      }
      get_daily_revenue: {
        Args: { start_date: string; end_date: string }
        Returns: {
          date: string
          revenue: number
        }[]
      }
      get_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_revenue: number
          total_paid: number
          total_expenses: number
          balance_due: number
          total_orders_count: number
          total_customers_count: number
          orders_fully_paid_count: number
          orders_partial_count: number
          orders_due_count: number
          orders_overdue_count: number
          stock_alerts_count: number
        }[]
      }
      get_due_summary_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          customer_name: string
          order_id: number
          balance_due: number
          delivery_date: string
        }[]
      }
      get_employee_order_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          designer_name: string
          completed_orders: number
          inprogress_orders: number
        }[]
      }
      get_employee_performance: {
        Args: { p_employee_name: string }
        Returns: Json
      }
      get_financial_report_for_period: {
        Args: { start_date: string; end_date: string }
        Returns: {
          total_revenue: number
          total_expenses: number
          net_profit: number
        }[]
      }
      get_financial_summary: {
        Args: { p_month: string }
        Returns: {
          total_orders: number
          total_revenue: number
          total_paid: number
          total_expenses: number
          balance_due: number
        }[]
      }
      get_invoice_list: {
        Args: {
          p_start_date?: string
          p_end_date?: string
          p_customer_name?: string
          p_order_id?: number
        }
        Returns: {
          order_id: number
          order_date: string
          customer_name: string
          total_amount: number
          balance_due: number
          status: string
        }[]
      }
      get_low_stock_materials: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_monthly_order_counts: {
        Args: { num_months: number }
        Returns: {
          date: string
          count: number
        }[]
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_new_customer_count: {
        Args: { start_date: string; end_date: string }
        Returns: number
      }
      get_order_details_with_status: {
        Args: { p_order_id: number }
        Returns: Json
      }
      get_orders_report: {
        Args: { start_date: string; end_date: string; order_status?: string }
        Returns: {
          order_id: number
          customer_name: string
          order_type: string
          quantity: number
          total_amount: number
          status: string
          order_date: string
        }[]
      }
      get_orders_with_status_history: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_payment_details_report: {
        Args:
          | { customer_name_filter: string }
          | { customer_name_filter: string; order_id_filter: number }
        Returns: {
          payment_date: string
          description: string
          amount: number
          payment_method: string
          order_id: number
          customer_name: string
        }[]
      }
      get_payments_report: {
        Args: { start_date: string; end_date: string }
        Returns: {
          payment_id: number
          order_id: number
          customer_name: string
          amount_paid: number
          payment_method: string
          status: string
          payment_date: string
        }[]
      }
      get_profit_loss_report: {
        Args: { start_date: string; end_date: string }
        Returns: {
          total_revenue: number
          total_expenses: number
          net_profit: number
        }[]
      }
      get_recent_due_payments: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_recent_pending_orders: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          customer_name: string
          date: string
          status: string
        }[]
      }
      get_top_spending_customers: {
        Args: { p_limit: number }
        Returns: Json
      }
      get_user_notifications: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          user_id: string
          created_at: string
          is_read: boolean
          title: string
          message: string
          link_to: string
        }[]
      }
      global_search: {
        Args: { search_term: string }
        Returns: {
          type: string
          id: string
          title: string
          description: string
          link: string
        }[]
      }
      increment_quantity_used: {
        Args: { stock_id_input: number; additional_used: number }
        Returns: undefined
      }
      is_owner_or_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      list_new_customers_by_date: {
        Args: { start_date: string; end_date: string }
        Returns: {
          id: string
          name: string
          phone: string
          address: string
          created_at: string
        }[]
      }
      log_activity: {
        Args: {
          p_user_id: string
          p_action_type: string
          p_target_id?: string
          p_details?: Json
          p_ip_address?: string
        }
        Returns: string
      }
      log_user_activity: {
        Args: {
          p_user_id: string
          p_action_type: string
          p_details?: Json
          p_ip_address?: string
        }
        Returns: string
      }
      reject_order_request: {
        Args: { request_id: number; reason: string }
        Returns: undefined
      }
      sync_user_profile: {
        Args: {
          user_id: string
          user_name: string
          user_phone: string
          user_address: string
        }
        Returns: undefined
      }
      user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      user_role: "owner" | "admin" | "manager" | "staff"
      user_status_type: "active" | "inactive" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["owner", "admin", "manager", "staff"],
      user_status_type: ["active", "inactive", "suspended"],
    },
  },
} as const
