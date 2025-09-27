export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      business_insights: {
        Row: {
          actionable: boolean | null
          data: Json | null
          description: string
          expires_at: string | null
          generated_at: string | null
          id: string
          impact: string | null
          insight_type: string
          title: string
        }
        Insert: {
          actionable?: boolean | null
          data?: Json | null
          description: string
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          impact?: string | null
          insight_type: string
          title: string
        }
        Update: {
          actionable?: boolean | null
          data?: Json | null
          description?: string
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          impact?: string | null
          insight_type?: string
          title?: string
        }
        Relationships: []
      }
      communication_log: {
        Row: {
          channel: string
          created_at: string
          customer_id: string
          customer_name: string | null
          email: string | null
          id: string
          message: string | null
          metadata: Json | null
          phone: string | null
          sent_by: string | null
          template_name: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          customer_id: string
          customer_name?: string | null
          email?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          phone?: string | null
          sent_by?: string | null
          template_name?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          customer_id?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          phone?: string | null
          sent_by?: string | null
          template_name?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          history: Json | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          history?: Json | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          history?: Json | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customer_follow_ups: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          description: string | null
          due_date: string
          id: string
          priority: string | null
          status: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          due_date: string
          id?: string
          priority?: string | null
          status?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_follow_ups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_follow_ups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_follow_ups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_follow_ups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_interactions: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          description: string
          id: string
          next_action: string | null
          outcome: string | null
          subject: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description: string
          id?: string
          next_action?: string | null
          outcome?: string | null
          subject: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string
          id?: string
          next_action?: string | null
          outcome?: string | null
          subject?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segments: {
        Row: {
          created_at: string | null
          criteria: Json | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          billing_address: string | null
          birthday: string | null
          communication_preference: string | null
          company_name: string | null
          created_at: string | null
          customer_since: string | null
          customer_type: string | null
          email: string | null
          follow_up_date: string | null
          id: string
          joined_date: string | null
          last_interaction: string | null
          last_interaction_date: string | null
          loyalty_points: number | null
          loyalty_tier_id: string | null
          name: string
          notes: string | null
          phone: string | null
          referral_code: string | null
          secondary_phone: string | null
          shipping_address: string | null
          tags: string[] | null
          tier_upgraded_at: string | null
          total_lifetime_value: number | null
          total_orders: number | null
          total_points_earned: number | null
          total_points_spent: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          billing_address?: string | null
          birthday?: string | null
          communication_preference?: string | null
          company_name?: string | null
          created_at?: string | null
          customer_since?: string | null
          customer_type?: string | null
          email?: string | null
          follow_up_date?: string | null
          id?: string
          joined_date?: string | null
          last_interaction?: string | null
          last_interaction_date?: string | null
          loyalty_points?: number | null
          loyalty_tier_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          referral_code?: string | null
          secondary_phone?: string | null
          shipping_address?: string | null
          tags?: string[] | null
          tier_upgraded_at?: string | null
          total_lifetime_value?: number | null
          total_orders?: number | null
          total_points_earned?: number | null
          total_points_spent?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          billing_address?: string | null
          birthday?: string | null
          communication_preference?: string | null
          company_name?: string | null
          created_at?: string | null
          customer_since?: string | null
          customer_type?: string | null
          email?: string | null
          follow_up_date?: string | null
          id?: string
          joined_date?: string | null
          last_interaction?: string | null
          last_interaction_date?: string | null
          loyalty_points?: number | null
          loyalty_tier_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          referral_code?: string | null
          secondary_phone?: string | null
          shipping_address?: string | null
          tags?: string[] | null
          tier_upgraded_at?: string | null
          total_lifetime_value?: number | null
          total_orders?: number | null
          total_points_earned?: number | null
          total_points_spent?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_loyalty_tier_id_fkey"
            columns: ["loyalty_tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
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
      inventory_adjustments: {
        Row: {
          adjusted_by: string | null
          adjustment_type: string
          created_at: string | null
          id: string
          material_id: string | null
          quantity: number
          reason: string | null
        }
        Insert: {
          adjusted_by?: string | null
          adjustment_type: string
          created_at?: string | null
          id?: string
          material_id?: string | null
          quantity: number
          reason?: string | null
        }
        Update: {
          adjusted_by?: string | null
          adjustment_type?: string
          created_at?: string | null
          id?: string
          material_id?: string | null
          quantity?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials_with_details"
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
      loyalty_customers: {
        Row: {
          created_at: string | null
          current_points: number | null
          customer_id: string | null
          id: string
          points_earned: number | null
          points_redeemed: number | null
          tier: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_points?: number | null
          customer_id?: string | null
          id?: string
          points_earned?: number | null
          points_redeemed?: number | null
          tier?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_points?: number | null
          customer_id?: string | null
          id?: string
          points_earned?: number | null
          points_redeemed?: number | null
          tier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_customers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_customers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_customers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_customers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "loyalty_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_points: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          description: string
          expiry_date: string | null
          id: string
          points_earned: number | null
          points_spent: number | null
          reference_id: string | null
          reference_type: string
          transaction_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description: string
          expiry_date?: string | null
          id?: string
          points_earned?: number | null
          points_spent?: number | null
          reference_id?: string | null
          reference_type: string
          transaction_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string
          expiry_date?: string | null
          id?: string
          points_earned?: number | null
          points_spent?: number | null
          reference_id?: string | null
          reference_type?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_redemptions: {
        Row: {
          created_at: string | null
          customer_id: string | null
          expires_at: string | null
          id: string
          notes: string | null
          order_id: number | null
          points_spent: number
          redeemed_at: string | null
          redemption_code: string | null
          reward_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          order_id?: number | null
          points_spent: number
          redeemed_at?: string | null
          redemption_code?: string | null
          reward_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          order_id?: number | null
          points_spent?: number
          redeemed_at?: string | null
          redemption_code?: string | null
          reward_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "all_order_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payment_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payment_summary_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payments_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary_with_dues"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "payment_summary_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "unfinished_order_status"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_referrals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          first_order_completed: boolean | null
          id: string
          referral_code: string | null
          referred_customer_id: string | null
          referred_points: number | null
          referrer_id: string | null
          referrer_points: number | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          first_order_completed?: boolean | null
          id?: string
          referral_code?: string | null
          referred_customer_id?: string | null
          referred_points?: number | null
          referrer_id?: string | null
          referrer_points?: number | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          first_order_completed?: boolean | null
          id?: string
          referral_code?: string | null
          referred_customer_id?: string | null
          referred_points?: number | null
          referrer_id?: string | null
          referrer_points?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_referrals_referred_customer_id_fkey"
            columns: ["referred_customer_id"]
            isOneToOne: false
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_referrals_referred_customer_id_fkey"
            columns: ["referred_customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_referrals_referred_customer_id_fkey"
            columns: ["referred_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_referrals_referred_customer_id_fkey"
            columns: ["referred_customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          id: string
          min_tier_required: number | null
          name: string
          points_required: number
          reward_type: string | null
          reward_value: number | null
          stock_quantity: number | null
          terms_conditions: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          min_tier_required?: number | null
          name: string
          points_required: number
          reward_type?: string | null
          reward_value?: number | null
          stock_quantity?: number | null
          terms_conditions?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          min_tier_required?: number | null
          name?: string
          points_required?: number
          reward_type?: string | null
          reward_value?: number | null
          stock_quantity?: number | null
          terms_conditions?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      loyalty_tiers: {
        Row: {
          benefits: Json | null
          created_at: string | null
          discount_percentage: number | null
          id: string
          min_points: number
          tier_color: string | null
          tier_level: number
          tier_name: string
        }
        Insert: {
          benefits?: Json | null
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          min_points: number
          tier_color?: string | null
          tier_level: number
          tier_name: string
        }
        Update: {
          benefits?: Json | null
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          min_points?: number
          tier_color?: string | null
          tier_level?: number
          tier_name?: string
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string | null
          customer_id: string | null
          description: string | null
          id: string
          order_id: number | null
          points: number
          type: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          order_id?: number | null
          points: number
          type: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          order_id?: number | null
          points?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "all_order_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payment_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payment_summary_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payments_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary_with_dues"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "payment_summary_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "unfinished_order_status"
            referencedColumns: ["order_id"]
          },
        ]
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
          category: string | null
          category_id: string | null
          cost_per_unit: number | null
          created_at: string | null
          created_by: string | null
          current_quantity: number | null
          current_stock: number | null
          description: string | null
          id: string
          is_active: boolean | null
          last_purchase_date: string | null
          last_restocked: string | null
          material_name: string
          minimum_stock_level: number | null
          price_per_unit: number | null
          purchase_date: string | null
          reorder_point: number | null
          storage_location: string | null
          supplier: string | null
          supplier_id: string | null
          unit: string | null
          unit_of_measurement: string
          updated_at: string | null
          updated_by: string | null
          version: number | null
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          created_by?: string | null
          current_quantity?: number | null
          current_stock?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_purchase_date?: string | null
          last_restocked?: string | null
          material_name: string
          minimum_stock_level?: number | null
          price_per_unit?: number | null
          purchase_date?: string | null
          reorder_point?: number | null
          storage_location?: string | null
          supplier?: string | null
          supplier_id?: string | null
          unit?: string | null
          unit_of_measurement?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Update: {
          category?: string | null
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          created_by?: string | null
          current_quantity?: number | null
          current_stock?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_purchase_date?: string | null
          last_restocked?: string | null
          material_name?: string
          minimum_stock_level?: number | null
          price_per_unit?: number | null
          purchase_date?: string | null
          reorder_point?: number | null
          storage_location?: string | null
          supplier?: string | null
          supplier_id?: string | null
          unit?: string | null
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
      notification_preferences: {
        Row: {
          channels: string[] | null
          created_at: string | null
          enabled: boolean | null
          id: string
          notification_type: string
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          channels?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          notification_type: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          user_type: string
        }
        Update: {
          channels?: string[] | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          notification_type?: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: []
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
      order_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_read: boolean | null
          message_type: string
          read_at: string | null
          sender_id: string
          sender_type: string
          thread_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string
          read_at?: string | null
          sender_id: string
          sender_type: string
          thread_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string
          read_at?: string | null
          sender_id?: string
          sender_type?: string
          thread_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "order_chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      order_chat_threads: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          last_message_at: string | null
          order_id: number
          priority: string
          status: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          last_message_at?: string | null
          order_id: number
          priority?: string
          status?: string
          subject?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          last_message_at?: string | null
          order_id?: number
          priority?: string
          status?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_chat_threads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "all_order_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_chat_threads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payment_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_chat_threads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payment_summary_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_chat_threads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payments_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_chat_threads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary_with_dues"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_chat_threads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_chat_threads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "payment_summary_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_chat_threads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "unfinished_order_status"
            referencedColumns: ["order_id"]
          },
        ]
      }
      order_materials: {
        Row: {
          created_at: string | null
          id: string
          material_id: string | null
          order_id: number | null
          quantity_used: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          material_id?: string | null
          order_id?: number | null
          quantity_used: number
        }
        Update: {
          created_at?: string | null
          id?: string
          material_id?: string | null
          order_id?: number | null
          quantity_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_materials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "all_order_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_materials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payment_summary"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_materials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payment_summary_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_materials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_payments_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_materials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary_with_dues"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_materials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_materials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "payment_summary_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_materials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "unfinished_order_status"
            referencedColumns: ["order_id"]
          },
        ]
      }
      order_messages: {
        Row: {
          content: string | null
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          order_id: number
          read_at: string | null
          read_by_recipient: boolean | null
          reply_to_message_id: string | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          order_id: number
          read_at?: string | null
          read_by_recipient?: boolean | null
          reply_to_message_id?: string | null
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          order_id?: number
          read_at?: string | null
          read_by_recipient?: boolean | null
          reply_to_message_id?: string | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: []
      }
      order_requests: {
        Row: {
          admin_total_amount: number | null
          created_at: string
          customer_id: string
          id: number
          pricing_status: string | null
          quote_response_at: string | null
          quote_sent_at: string | null
          rejection_reason: string | null
          request_data: Json
          service_charges: Json | null
          status: string
          user_id: string
        }
        Insert: {
          admin_total_amount?: number | null
          created_at?: string
          customer_id: string
          id?: number
          pricing_status?: string | null
          quote_response_at?: string | null
          quote_sent_at?: string | null
          rejection_reason?: string | null
          request_data: Json
          service_charges?: Json | null
          status?: string
          user_id?: string
        }
        Update: {
          admin_total_amount?: number | null
          created_at?: string
          customer_id?: string
          id?: number
          pricing_status?: string | null
          quote_response_at?: string | null
          quote_sent_at?: string | null
          rejection_reason?: string | null
          request_data?: Json
          service_charges?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "order_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
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
            referencedRelation: "order_payments_view"
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
          service_charge_amount: number | null
          service_charge_description: string | null
          service_charge_type: string | null
          service_charge_value: number | null
          subtotal: number | null
          total_amount: number
          updated_at: string | null
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
          service_charge_amount?: number | null
          service_charge_description?: string | null
          service_charge_type?: string | null
          service_charge_value?: number | null
          subtotal?: number | null
          total_amount?: number
          updated_at?: string | null
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
          service_charge_amount?: number | null
          service_charge_description?: string | null
          service_charge_type?: string | null
          service_charge_value?: number | null
          subtotal?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "fk_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
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
        Relationships: []
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
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
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
            referencedRelation: "order_payments_view"
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
          image_url: string | null
          name: string
          unit_price: number
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          name: string
          unit_price: number
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          name?: string
          unit_price?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          browser_info: Json | null
          created_at: string | null
          endpoint: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_used: string | null
          p256dh_key: string
          user_id: string
          user_type: string
        }
        Insert: {
          auth_key: string
          browser_info?: Json | null
          created_at?: string | null
          endpoint: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          p256dh_key: string
          user_id: string
          user_type: string
        }
        Update: {
          auth_key?: string
          browser_info?: Json | null
          created_at?: string | null
          endpoint?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          p256dh_key?: string
          user_id?: string
          user_type?: string
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
      support_messages: {
        Row: {
          attachment_name: string | null
          attachment_size: number | null
          attachment_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          message_type: string | null
          read_at: string | null
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          message_type?: string | null
          read_at?: string | null
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          message_type?: string | null
          read_at?: string | null
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          customer_id: string
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          id: string
          last_message_at: string | null
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          unread_admin_count: number | null
          unread_customer_count: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          customer_id: string
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          id?: string
          last_message_at?: string | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          unread_admin_count?: number | null
          unread_customer_count?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          customer_id?: string
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          id?: string
          last_message_at?: string | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          unread_admin_count?: number | null
          unread_customer_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
            referencedColumns: ["id"]
          },
        ]
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
      user_sessions: {
        Row: {
          created_at: string | null
          device: string | null
          expires_at: string | null
          id: string
          session_id: string
          terminated: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device?: string | null
          expires_at?: string | null
          id?: string
          session_id: string
          terminated?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device?: string | null
          expires_at?: string | null
          id?: string
          session_id?: string
          terminated?: boolean | null
          user_id?: string | null
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
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "whatsapp_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "loyalty_analytics"
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
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "whatsapp_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
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
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "fk_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_analytics: {
        Row: {
          customer_type: string | null
          email: string | null
          id: string | null
          last_interaction_date: string | null
          last_order_date: string | null
          name: string | null
          pending_follow_ups: number | null
          total_interactions: number | null
          total_lifetime_value: number | null
          total_orders: number | null
          total_spent: number | null
        }
        Relationships: []
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
            referencedRelation: "order_payments_view"
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
      loyalty_analytics: {
        Row: {
          discount_percentage: number | null
          email: string | null
          id: string | null
          loyalty_points: number | null
          name: string | null
          referral_code: string | null
          referrals_made: number | null
          referred_by_count: number | null
          tier_level: number | null
          tier_name: string | null
          tier_upgraded_at: string | null
          total_orders: number | null
          total_points_earned: number | null
          total_points_spent: number | null
          total_redemptions: number | null
          total_spent: number | null
        }
        Relationships: []
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
      order_activity_timeline: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          actor_type: string | null
          event_id: string | null
          event_type: string | null
          message: string | null
          metadata: Json | null
          occurred_at: string | null
          order_id: number | null
          title: string | null
        }
        Relationships: []
      }
      order_payment_summary: {
        Row: {
          amount_received: number | null
          balance_amount: number | null
          customer_id: string | null
          customer_name: string | null
          delivery_date: string | null
          final_total: number | null
          is_overdue: boolean | null
          order_id: number | null
          payment_status: string | null
          service_charge_amount: number | null
          service_charge_description: string | null
          service_charge_type: string | null
          service_charge_value: number | null
          subtotal: number | null
        }
        Insert: {
          amount_received?: number | null
          balance_amount?: number | null
          customer_id?: string | null
          customer_name?: string | null
          delivery_date?: string | null
          final_total?: number | null
          is_overdue?: never
          order_id?: number | null
          payment_status?: never
          service_charge_amount?: number | null
          service_charge_description?: string | null
          service_charge_type?: string | null
          service_charge_value?: number | null
          subtotal?: number | null
        }
        Update: {
          amount_received?: number | null
          balance_amount?: number | null
          customer_id?: string | null
          customer_name?: string | null
          delivery_date?: string | null
          final_total?: number | null
          is_overdue?: never
          order_id?: number | null
          payment_status?: never
          service_charge_amount?: number | null
          service_charge_description?: string | null
          service_charge_type?: string | null
          service_charge_value?: number | null
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "fk_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
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
      order_payments_view: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          due_date: string | null
          order_amount_paid: number | null
          order_balance_due: number | null
          order_id: number | null
          order_status: string | null
          order_total_amount: number | null
          payment_amount: number | null
          payment_created_at: string | null
          payment_due_date: string | null
          payment_id: string | null
          payment_method: string | null
          payment_notes: string | null
          payment_status: string | null
          payment_updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "fk_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
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
      support_tickets_summary: {
        Row: {
          assigned_admin_name: string | null
          assigned_to: string | null
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          id: string | null
          last_message: string | null
          last_message_at: string | null
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string | null
          total_messages: number | null
          unread_admin_count: number | null
          unread_customer_count: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_analytics"
            referencedColumns: ["id"]
          },
        ]
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
      add_service_charge_to_request: {
        Args: {
          charge_amount: number
          charge_description: string
          charge_type?: string
          request_id: number
        }
        Returns: undefined
      }
      approve_order_request: {
        Args: { request_id: number }
        Returns: {
          id: number
        }[]
      }
      approve_order_request_with_service_charge: {
        Args: { request_id: number; service_charge_data?: Json }
        Returns: undefined
      }
      approve_order_request_with_service_charges: {
        Args: { request_id: number }
        Returns: {
          id: number
        }[]
      }
      award_order_points: {
        Args: { customer_uuid: string; order_total: number; order_uuid: number }
        Returns: number
      }
      award_order_points_with_service_charge: {
        Args: { customer_uuid: string; order_total: number; order_uuid: number }
        Returns: number
      }
      calculate_loyalty_points: {
        Args: { order_amount: number }
        Returns: number
      }
      calculate_order_total: {
        Args: {
          p_quantity: number
          p_rate: number
          p_service_charge_type: string
          p_service_charge_value: number
        }
        Returns: {
          final_total: number
          service_charge_amount: number
          subtotal: number
        }[]
      }
      check_login_attempts: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      create_new_order: {
        Args: {
          p_customer_id: string
          p_design_needed?: boolean
          p_notes?: string
          p_product_id: number
          p_quantity: number
          p_total_amount: number
        }
        Returns: {
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
          service_charge_amount: number | null
          service_charge_description: string | null
          service_charge_type: string | null
          service_charge_value: number | null
          subtotal: number | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }[]
      }
      create_new_product: {
        Args: {
          p_category?: string
          p_description?: string
          p_name: string
          p_unit_price: number
        }
        Returns: {
          category: string | null
          created_at: string | null
          description: string | null
          id: number
          image_url: string | null
          name: string
          unit_price: number
        }[]
      }
      create_notification: {
        Args: {
          data_param?: Json
          message_text: string
          notification_type: string
          order_id_param?: number
          priority_param?: string
          recipient_id_param?: string
          recipient_type_param: string
          sender_id_param?: string
          title_text: string
        }
        Returns: string
      }
      create_order_with_payment: {
        Args: {
          p_amount_received: number
          p_customer_id: string
          p_customer_name: string
          p_customer_phone: string
          p_delivery_date: string
          p_notes: string
          p_order_type: string
          p_payment_method: string
          p_quantity: number
          p_total_amount: number
        }
        Returns: {
          order_id: number
          payment_id: string
        }[]
      }
      create_support_ticket: {
        Args: {
          p_customer_id: string
          p_description: string
          p_initial_message: string
          p_subject: string
        }
        Returns: string
      }
      customer_accept_quote: {
        Args:
          | { customer_id: string; request_id: number }
          | { request_id: number }
        Returns: undefined
      }
      customer_reject_quote: {
        Args:
          | { customer_id: string; request_id: number }
          | { request_id: number }
        Returns: undefined
      }
      debug_approve_order: {
        Args: { request_id: number }
        Returns: {
          admin_total: number
          final_amount_result: number
          json_total: number
          request_found: boolean
        }[]
      }
      debug_request_data: {
        Args: { request_id: number }
        Returns: {
          calculated_amount: number
          extracted_fields: Json
          id: number
          request_data: Json
        }[]
      }
      debug_request_status: {
        Args: { request_id: number }
        Returns: {
          admin_total_amount: number
          customer_id: string
          id: number
          pricing_status: string
          service_charges: Json
          status: string
        }[]
      }
      delete_customer_and_related_data: {
        Args: { p_customer_id: string }
        Returns: undefined
      }
      generate_referral_code: {
        Args: { customer_name: string }
        Returns: string
      }
      get_all_customers: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: string
          email: string
          id: string
          joined_date: string
          name: string
          phone: string
        }[]
      }
      get_all_due_payments_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_all_products: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          id: number
          name: string
          unit_price: number
        }[]
      }
      get_best_selling_products: {
        Args: { p_limit: number }
        Returns: {
          name: string
          sale_count: number
        }[]
      }
      get_comprehensive_business_snapshot: {
        Args: { end_date?: string; start_date?: string }
        Returns: Json
      }
      get_customer_breakdown: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          customer_count: number
          customer_type: string
        }[]
      }
      get_customers_report: {
        Args: { search_term?: string; since_date?: string }
        Returns: {
          created_at: string
          customer_id: string
          email: string
          name: string
          phone: string
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
        Args: { end_date: string; start_date: string }
        Returns: {
          date: string
          revenue: number
        }[]
      }
      get_dashboard_metrics: {
        Args: Record<PropertyKey, never> | { p_user_id: string }
        Returns: Json
      }
      get_dashboard_metrics_table: {
        Args: Record<PropertyKey, never>
        Returns: {
          balance_due: number
          orders_due_count: number
          orders_fully_paid_count: number
          orders_overdue_count: number
          orders_partial_count: number
          stock_alerts_count: number
          total_customers_count: number
          total_expenses: number
          total_orders_count: number
          total_paid: number
          total_revenue: number
        }[]
      }
      get_due_summary_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          balance_due: number
          customer_name: string
          delivery_date: string
          order_id: number
        }[]
      }
      get_employee_order_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          completed_orders: number
          designer_name: string
          inprogress_orders: number
        }[]
      }
      get_employee_performance: {
        Args: { p_employee_name: string }
        Returns: Json
      }
      get_financial_report_for_period: {
        Args: { end_date: string; start_date: string }
        Returns: {
          net_profit: number
          total_expenses: number
          total_revenue: number
        }[]
      }
      get_financial_summary: {
        Args: { p_month: string } | { p_month: string; p_user_id: string }
        Returns: {
          balancedue: number
          expenses: number
          orders: number
          received: number
          revenue: number
        }[]
      }
      get_invoice_list: {
        Args: {
          p_customer_name?: string
          p_end_date?: string
          p_order_id?: number
          p_start_date?: string
        }
        Returns: {
          balance_due: number
          customer_name: string
          order_date: string
          order_id: number
          status: string
          total_amount: number
        }[]
      }
      get_low_stock_materials: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_quantity: number
          material_id: string
          material_name: string
          minimum_stock_level: number
        }[]
      }
      get_monthly_order_counts: {
        Args: { num_months: number }
        Returns: {
          count: number
          date: string
        }[]
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_new_customer_count: {
        Args: { end_date: string; start_date: string }
        Returns: number
      }
      get_order_details_with_status: {
        Args: { p_order_id: number }
        Returns: Json
      }
      get_order_message_summary: {
        Args: { order_id_param: number; user_uuid: string }
        Returns: {
          last_message_at: string
          last_message_from: string
          total_messages: number
          unread_messages: number
        }[]
      }
      get_orders_report: {
        Args: { end_date: string; order_status?: string; start_date: string }
        Returns: {
          customer_name: string
          order_date: string
          order_id: number
          order_type: string
          quantity: number
          status: string
          total_amount: number
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
          amount: number
          customer_name: string
          description: string
          order_id: number
          payment_date: string
          payment_method: string
        }[]
      }
      get_payments_report: {
        Args: { end_date: string; start_date: string }
        Returns: {
          amount_paid: number
          customer_name: string
          order_id: number
          payment_date: string
          payment_id: number
          payment_method: string
          status: string
        }[]
      }
      get_product_details: {
        Args: { p_product_name: string }
        Returns: Json
      }
      get_profit_loss_report: {
        Args: { end_date: string; start_date: string }
        Returns: {
          net_profit: number
          total_expenses: number
          total_revenue: number
        }[]
      }
      get_recent_due_payments: {
        Args: Record<PropertyKey, never>
        Returns: {
          balance_amount: number
          customer_name: string
          due_date: string
          payment_id: string
        }[]
      }
      get_recent_pending_orders: {
        Args: Record<PropertyKey, never>
        Returns: {
          customer_name: string
          date: string
          id: number
          status: string
        }[]
      }
      get_top_spending_customers: {
        Args: { p_limit: number }
        Returns: {
          name: string
          total_spent: number
        }[]
      }
      get_top_spending_customers_by_month: {
        Args: { p_limit: number; p_month: string }
        Returns: {
          customer_name: string
          total_spent_in_month: number
        }[]
      }
      get_top_spending_customers_overall: {
        Args: { p_limit: number }
        Returns: {
          customer_name: string
          total_spent: number
        }[]
      }
      get_unread_notification_count: {
        Args: { user_type_param?: string; user_uuid: string }
        Returns: number
      }
      get_user_notifications: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: number
          is_read: boolean
          link_to: string
          message: string
          title: string
          user_id: string
        }[]
      }
      global_search: {
        Args: { search_term: string }
        Returns: {
          description: string
          id: string
          link: string
          title: string
          type: string
        }[]
      }
      increment_quantity_used: {
        Args: { additional_used: number; stock_id_input: number }
        Returns: undefined
      }
      is_owner_or_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      list_new_customers_by_date: {
        Args: { end_date: string; start_date: string }
        Returns: {
          address: string
          created_at: string
          id: string
          name: string
          phone: string
        }[]
      }
      log_activity: {
        Args: {
          p_action_type: string
          p_details?: Json
          p_ip_address?: string
          p_target_id?: string
          p_user_id: string
        }
        Returns: string
      }
      log_user_activity: {
        Args: {
          p_action_type: string
          p_details?: Json
          p_ip_address?: string
          p_user_id: string
        }
        Returns: string
      }
      mark_messages_as_read: {
        Args: { p_reader_type: string; p_ticket_id: string }
        Returns: undefined
      }
      mark_notifications_as_read: {
        Args: { notification_ids: string[]; user_uuid: string }
        Returns: number
      }
      match_documents: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          similarity: number
        }[]
      }
      reject_order_request: {
        Args: { reason: string; request_id: number }
        Returns: undefined
      }
      remove_service_charge_from_request: {
        Args:
          | { charge_id: string; request_id: number }
          | { charge_id: string; request_id: number }
        Returns: undefined
      }
      send_quote_to_customer: {
        Args: { request_id: number }
        Returns: undefined
      }
      sync_remote_to_local: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      sync_user_profile: {
        Args: {
          user_address: string
          user_id: string
          user_name: string
          user_phone: string
        }
        Returns: undefined
      }
      test_approve_order: {
        Args: { request_id: number }
        Returns: {
          id: number
        }[]
      }
      test_notification_system: {
        Args: { test_user_id?: string }
        Returns: string
      }
      trigger_missing_payments: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_customer_tier: {
        Args: { customer_uuid: string }
        Returns: undefined
      }
      update_order_status: {
        Args: { new_status_param: string; order_id_param: number }
        Returns: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
