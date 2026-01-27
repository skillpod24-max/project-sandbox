export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]


export type PaymentPurpose =
  | "down_payment"
  | "sale_settlement"
  | "emi_installment"
  | "penalty"
  | "advance"
  | "refund";


export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          code: string
          created_at: string
          driving_license_number: string | null
          email: string | null
          full_name: string
          id: string
          id_proof_number: string | null
          id_proof_type: string | null
          is_active: boolean | null
          notes: string | null
          phone: string
          updated_at: string
          user_id: string
          lead_id: string | null
          converted_from_lead: boolean | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          driving_license_number?: string | null
          email?: string | null
          full_name: string
          id?: string
          id_proof_number?: string | null
          id_proof_type?: string | null
          is_active?: boolean | null
          notes?: string | null
          phone: string
          updated_at?: string
          user_id: string
          lead_id?: string | null
          converted_from_lead?: boolean | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          driving_license_number?: string | null
          email?: string | null
          full_name?: string
          id?: string
          id_proof_number?: string | null
          id_proof_type?: string | null
          is_active?: boolean | null
          notes?: string | null
          phone?: string
          updated_at?: string
          user_id?: string
          lead_id?: string | null
          converted_from_lead?: boolean | null
        }
        Relationships: []
      }
      dealer_testimonials: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          is_verified: boolean | null
          rating: number
          review: string | null
          sale_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
          is_verified?: boolean | null
          rating: number
          review?: string | null
          sale_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          is_verified?: boolean | null
          rating?: number
          review?: string | null
          sale_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: Database["public"]["Enums"]["document_type"]
          document_url: string
          expiry_date: string | null
          id: string
          notes: string | null
          reference_id: string
          reference_type: string
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type: Database["public"]["Enums"]["document_type"]
          document_url: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          reference_id: string
          reference_type: string
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          document_url?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          reference_id?: string
          reference_type?: string
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emi_schedules: {
        Row: {
          amount_paid: number | null
          created_at: string
          due_date: string
          emi_amount: number
          emi_number: number
          id: string
          notes: string | null
          paid_date: string | null
          sale_id: string
          status: Database["public"]["Enums"]["emi_status"]
          updated_at: string
          user_id: string
          principal_component?: number | null
          interest_component?: number | null
          interest_paid?: string | null
          principal_paid?: number | null
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          due_date: string
          emi_amount: number
          emi_number: number
          id?: string
          notes?: string | null
          paid_date?: string | null
          sale_id: string
          status?: Database["public"]["Enums"]["emi_status"]
          updated_at?: string
          user_id: string
          principal_component?: number | null
          interest_component?: number | null
          interest_paid?: string | null
          principal_paid?: number | null
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          due_date?: string
          emi_amount?: number
          emi_number?: number
          id?: string
          notes?: string | null
          paid_date?: string | null
          sale_id?: string
          status?: Database["public"]["Enums"]["emi_status"]
          updated_at?: string
          user_id?: string
          principal_component?: number | null
          interest_component?: number | null
          interest_paid?: string | null
          principal_paid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "emi_schedules_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          expense_date: string
          expense_number: string
          id: string
          notes: string | null
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          updated_at: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description: string
          expense_date?: string
          expense_number: string
          id?: string
          notes?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          expense_number?: string
          id?: string
          notes?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget_max: number | null
          budget_min: number | null
          city: string | null
          created_at: string
          customer_name: string
          email: string | null
          follow_up_date: string | null
          id: string
          last_contact_date: string | null
          last_viewed_at: string | null
          lead_number: string
          lead_type: string | null
          notes: string | null
          phone: string
          priority: string
          source: string
          status: string
          updated_at: string
          user_id: string
          vehicle_interest: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          created_at?: string
          customer_name: string
          email?: string | null
          follow_up_date?: string | null
          id?: string
          last_contact_date?: string | null
          last_viewed_at?: string | null
          lead_number: string
          lead_type?: string | null
          notes?: string | null
          phone: string
          priority?: string
          source?: string
          status?: string
          updated_at?: string
          user_id: string
          vehicle_interest?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          created_at?: string
          customer_name?: string
          email?: string | null
          follow_up_date?: string | null
          id?: string
          last_contact_date?: string | null
          last_viewed_at?: string | null
          lead_number?: string
          lead_type?: string | null
          notes?: string | null
          phone?: string
          priority?: string
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
          vehicle_interest?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          payment_date: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          payment_number: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          reference_id: string | null
          reference_type: string | null
          updated_at: string
          user_id: string
          vendor_id: string | null
          principal_amount: number | null
interest_amount: number | null
profit_amount: number | null
effective_date: string | null
payment_purpose: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          payment_date?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          payment_number: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          reference_id?: string | null
          reference_type?: string | null
          updated_at?: string
          user_id: string
          vendor_id?: string | null
          principal_amount?: number | null
          interest_amount?: number | null
          profit_amount?: number | null
          effective_date?: string | null
          payment_purpose?: string | null

        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          payment_date?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          payment_number?: string
          payment_type?: Database["public"]["Enums"]["payment_type"]
          reference_id?: string | null
          reference_type?: string | null
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
          principal_amount?: number | null
          interest_amount?: number | null
          profit_amount?: number | null
          effective_date?: string | null
          payment_purpose?: string | null

        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount_paid: number
          balance_amount: number
          created_at: string
          customer_id: string
          discount: number | null
          down_payment: number | null
          id: string
          is_emi: boolean | null
          notes: string | null
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          sale_date: string
          sale_number: string
          selling_price: number
          status: Database["public"]["Enums"]["sale_status"]
          tax_amount: number | null
          total_amount: number
          updated_at: string
          user_id: string
          vehicle_id: string
          emi_configured: boolean | null
        }
        Insert: {
          amount_paid?: number
          balance_amount?: number
          created_at?: string
          customer_id: string
          discount?: number | null
          down_payment?: number | null
          id?: string
          is_emi?: boolean | null
          notes?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          sale_date?: string
          sale_number: string
          selling_price: number
          status?: Database["public"]["Enums"]["sale_status"]
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
          user_id: string
          vehicle_id: string
          emi_configured?: boolean | null
        }
        Update: {
          amount_paid?: number
          balance_amount?: number
          created_at?: string
          customer_id?: string
          discount?: number | null
          down_payment?: number | null
          id?: string
          is_emi?: boolean | null
          notes?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          sale_date?: string
          sale_number?: string
          selling_price?: number
          status?: Database["public"]["Enums"]["sale_status"]
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string
          vehicle_id?: string
          emi_configured?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_packages: {
        Row: {
          created_at: string
          description: string | null
          duration_hours: number
          id: string
          is_active: boolean
          name: string
          price: number
          services_included: string[]
          updated_at: string
          user_id: string
          vehicle_types: string[]
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_hours?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          services_included?: string[]
          updated_at?: string
          user_id: string
          vehicle_types?: string[]
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_hours?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          services_included?: string[]
          updated_at?: string
          user_id?: string
          vehicle_types?: string[]
        }
        Relationships: []
      }
      service_records: {
        Row: {
          created_at: string
          customer_name: string
          customer_phone: string
          end_date: string | null
          id: string
          labor_cost: number
          notes: string | null
          package_id: string | null
          parts_cost: number
          service_number: string
          service_type: string
          services_done: string[]
          start_date: string
          status: string
          total_cost: number
          updated_at: string
          user_id: string
          vehicle_name: string
          vehicle_number: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_phone: string
          end_date?: string | null
          id?: string
          labor_cost?: number
          notes?: string | null
          package_id?: string | null
          parts_cost?: number
          service_number: string
          service_type?: string
          services_done?: string[]
          start_date?: string
          status?: string
          total_cost?: number
          updated_at?: string
          user_id: string
          vehicle_name: string
          vehicle_number: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_phone?: string
          end_date?: string | null
          id?: string
          labor_cost?: number
          notes?: string | null
          package_id?: string | null
          parts_cost?: number
          service_number?: string
          service_type?: string
          services_done?: string[]
          start_date?: string
          status?: string
          total_cost?: number
          updated_at?: string
          user_id?: string
          vehicle_name?: string
          vehicle_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_records_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          currency: string | null
          dealer_address: string | null
          dealer_email: string | null
          dealer_gst: string | null
          dealer_name: string | null
          dealer_phone: string | null
          gmap_link: string | null
          id: string
          invoice_prefix: string | null
          public_page_enabled: boolean | null
          public_page_id: string | null
          public_page_theme: string | null
          purchase_prefix: string | null
          sale_prefix: string | null
          shop_logo_url: string | null
          shop_tagline: string | null
          show_ratings: boolean | null
          show_testimonials: boolean | null
          show_vehicles_sold: boolean | null
          tax_rate: number | null
          updated_at: string
          user_id: string
          whatsapp_number: string | null
          show_vehicle_page_views: boolean | null
          show_vehicle_page_enquiries: boolean | null
          show_dealer_page_inquiries: boolean | null
          show_dealer_page_views: boolean | null
          enable_auto_lead_popup: boolean | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          dealer_address?: string | null
          dealer_email?: string | null
          dealer_gst?: string | null
          dealer_name?: string | null
          dealer_phone?: string | null
          gmap_link?: string | null
          id?: string
          invoice_prefix?: string | null
          public_page_enabled?: boolean | null
          public_page_id?: string | null
          public_page_theme: string | null
          purchase_prefix?: string | null
          sale_prefix?: string | null
          shop_logo_url?: string | null
          shop_tagline?: string | null
          show_ratings?: boolean | null
          show_testimonials?: boolean | null
          show_vehicles_sold?: boolean | null
          tax_rate?: number | null
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
          show_vehicle_page_views?: boolean | null
          show_vehicle_page_enquiries?: boolean | null
          show_dealer_page_inquiries?: boolean | null
          show_dealer_page_views?: boolean | null
          enable_auto_lead_popup?: boolean | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          dealer_address?: string | null
          dealer_email?: string | null
          dealer_gst?: string | null
          dealer_name?: string | null
          dealer_phone?: string | null
          gmap_link?: string | null
          id?: string
          invoice_prefix?: string | null
          public_page_enabled?: boolean | null
          public_page_id?: string | null
          public_page_theme: string | null
          purchase_prefix?: string | null
          sale_prefix?: string | null
          shop_logo_url?: string | null
          shop_tagline?: string | null
          show_ratings?: boolean | null
          show_testimonials?: boolean | null
          show_vehicles_sold?: boolean | null
          tax_rate?: number | null
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
          show_vehicle_page_views?: boolean | null
          show_vehicle_page_enquiries?: boolean | null
          show_dealer_page_inquiries?: boolean | null
          show_dealer_page_views?: boolean | null
          enable_auto_lead_popup?: boolean | null
        }
        Relationships: []
      }


       public_page_events: {
  Row: {
    id: string;
    created_at: string;
    dealer_user_id: string;
    public_page_id: string;
    vehicle_id: string | null;
    event_type: "page_view" | "vehicle_view" | "enquiry_submit";
    session_id: string;
  };
  Insert: {
    id?: string;
    created_at?: string;
    dealer_user_id: string;
    public_page_id: string;
    vehicle_id?: string | null;
    event_type: "page_view" | "vehicle_view" | "enquiry_submit";
    session_id: string;
  };
  Update: {};
  Relationships: [];
};



      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_primary: boolean | null
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean | null
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean | null
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_images_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_purchases: {
        Row: {
          amount_paid: number
          balance_amount: number
          created_at: string
          id: string
          notes: string | null
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          purchase_date: string
          purchase_number: string
          purchase_price: number
          updated_at: string
          user_id: string
          vehicle_id: string
          vendor_id: string
        }
        Insert: {
          amount_paid?: number
          balance_amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          purchase_date?: string
          purchase_number: string
          purchase_price: number
          updated_at?: string
          user_id: string
          vehicle_id: string
          vendor_id: string
        }
        Update: {
          amount_paid?: number
          balance_amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          purchase_date?: string
          purchase_number?: string
          purchase_price?: number
          updated_at?: string
          user_id?: string
          vehicle_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_purchases_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_purchases_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          battery_health: string | null
          boot_space: string | null
          brand: string
          chassis_number: string | null
          code: string
          color: string | null
          condition: Database["public"]["Enums"]["vehicle_condition"]
          created_at: string
          engine_number: string | null
          fitness_expiry: string | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          hypothecation: string | null
          id: string
          insurance_expiry: string | null
          is_public: boolean | null
          last_service_date: string | null
          manufacturing_year: number
          mileage: number | null
          model: string
          next_service_due: string | null
          notes: string | null
          number_of_owners: number | null
          odometer_reading: number | null
          permit_expiry: string | null
          public_description: string | null
          public_features: string[] | null
          public_highlights: string[] | null
          public_page_id: string | null
          puc_expiry: string | null
          purchase_date: string | null
          purchase_price: number
          registration_number: string | null
          road_tax_expiry: string | null
          seating_capacity: number | null
          selling_price: number
          service_history: string | null
          show_chassis_number: boolean | null
          show_engine_number: boolean | null
          status: Database["public"]["Enums"]["vehicle_status"]
          transmission: Database["public"]["Enums"]["transmission_type"]
          tyre_condition: string | null
          updated_at: string
          user_id: string
          variant: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          vendor_id: string | null
          image_badge_text: string | null
          image_badge_color: string | null
          purchase_status: "listing" | "purchased"
          
        }
        Insert: {
          battery_health?: string | null
          boot_space?: string | null
          brand: string
          chassis_number?: string | null
          code: string
          color?: string | null
          condition?: Database["public"]["Enums"]["vehicle_condition"]
          created_at?: string
          engine_number?: string | null
          fitness_expiry?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          hypothecation?: string | null
          id?: string
          insurance_expiry?: string | null
          is_public?: boolean | null
          last_service_date?: string | null
          manufacturing_year: number
          mileage?: number | null
          model: string
          next_service_due?: string | null
          notes?: string | null
          number_of_owners?: number | null
          odometer_reading?: number | null
          permit_expiry?: string | null
          public_description?: string | null
          public_features?: string[] | null
          public_highlights?: string[] | null
          public_page_id?: string | null
          puc_expiry?: string | null
          purchase_date?: string | null
          purchase_price?: number
          registration_number?: string | null
          road_tax_expiry?: string | null
          seating_capacity?: number | null
          selling_price?: number
          service_history?: string | null
          show_chassis_number?: boolean | null
          show_engine_number?: boolean | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          transmission?: Database["public"]["Enums"]["transmission_type"]
          tyre_condition?: string | null
          updated_at?: string
          user_id: string
          variant?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          vendor_id?: string | null
          image_badge_text?: string | null
          image_badge_color?: string | null
          purchase_status?: "listing" | "purchased"

        }
        Update: {
          battery_health?: string | null
          boot_space?: string | null
          brand?: string
          chassis_number?: string | null
          code?: string
          color?: string | null
          condition?: Database["public"]["Enums"]["vehicle_condition"]
          created_at?: string
          engine_number?: string | null
          fitness_expiry?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          hypothecation?: string | null
          id?: string
          insurance_expiry?: string | null
          is_public?: boolean | null
          last_service_date?: string | null
          manufacturing_year?: number
          mileage?: number | null
          model?: string
          next_service_due?: string | null
          notes?: string | null
          number_of_owners?: number | null
          odometer_reading?: number | null
          permit_expiry?: string | null
          public_description?: string | null
          public_features?: string[] | null
          public_highlights?: string[] | null
          public_page_id?: string | null
          puc_expiry?: string | null
          purchase_date?: string | null
          purchase_price?: number
          registration_number?: string | null
          road_tax_expiry?: string | null
          seating_capacity?: number | null
          selling_price?: number
          service_history?: string | null
          show_chassis_number?: boolean | null
          show_engine_number?: boolean | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          transmission?: Database["public"]["Enums"]["transmission_type"]
          tyre_condition?: string | null
          updated_at?: string
          user_id?: string
          variant?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          vendor_id?: string | null
          image_badge_text?: string | null
          image_badge_color?: string | null
          purchase_status?: "listing" | "purchased"

        }
        Relationships: [
          {
            foreignKeyName: "vehicles_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      sticky_notes: {
  Row: {
    id: string
    user_id: string
    title: string
    content: string
    color: string
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    title: string
    content: string
    color: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    title?: string
    content?: string
    color?: string
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}

emi_documents: {
  Row: {
    id: string
    user_id: string
    reference_type: Database["public"]["Enums"]["document_reference_type"]
    reference_id: string
    document_name: string
    document_type: Database["public"]["Enums"]["emi_document_type"]
    document_url: string
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    user_id: string
    reference_type: Database["public"]["Enums"]["document_reference_type"]
    reference_id: string
    document_name: string
    document_type?: Database["public"]["Enums"]["emi_document_type"]
    document_url: string
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    reference_type?: Database["public"]["Enums"]["document_reference_type"]
    reference_id?: string
    document_name?: string
    document_type?: Database["public"]["Enums"]["emi_document_type"]
    document_url?: string
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}


      vendors: {
        Row: {
          address: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          bank_name: string | null
          code: string
          contact_person: string | null
          created_at: string
          email: string | null
          gst_number: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
          vendor_type: "company" | "individual"
          converted_from_lead: boolean | null
          lead_id: string | null
        }
        Insert: {
          address?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          code: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          vendor_type?: "company" | "individual"
          converted_from_lead?: boolean | null
          lead_id?: string | null
        }
        Update: {
          address?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          code?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          vendor_type?: "company" | "individual"
          converted_from_lead?: boolean | null
          lead_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      submit_public_lead: {
        Args: {
          p_customer_name: string
          p_dealer_user_id: string
          p_email: string
          p_notes?: string
          p_phone: string
          p_vehicle_interest: string
        }
        Returns: string
      }
    }
    Enums: {
      document_status: "pending" | "completed" | "expired"
      document_type:
        | "rc"
        | "insurance"
        | "puc"
        | "invoice"
        | "sale_agreement"
        | "delivery_note"
        | "id_proof"
        | "driving_license"
      emi_status: "pending" | "paid" | "overdue" | "partially_paid"
      fuel_type: "petrol" | "diesel" | "electric" | "hybrid" | "cng" | "lpg"
      payment_mode: "cash" | "bank_transfer" | "cheque" | "upi" | "card" | "emi"
      payment_type:
        | "customer_payment"
        | "vendor_payment"
        | "emi_payment"
        | "expense"
      sale_status: "inquiry" | "reserved" | "completed" | "cancelled"
      transmission_type: "manual" | "automatic" | "cvt" | "dct"
      user_role: "admin" | "manager" | "operator" | "viewer"
      vehicle_condition: "new" | "used"
      vehicle_status: "in_stock" | "reserved" | "sold"
      vehicle_type: "car" | "bike" | "commercial"

      document_reference_type: ["emi", "vehicle", "customer", "sale"],

emi_document_type: [
  "loan_agreement",
  "cheque_copy",
  "id_proof",
  "address_proof",
  "payment_receipt",
  "noc",
  "other",
],

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
      document_status: ["pending", "completed", "expired"],
      document_type: [
        "rc",
        "insurance",
        "puc",
        "invoice",
        "sale_agreement",
        "delivery_note",
        "id_proof",
        "driving_license",
      ],
      emi_status: ["pending", "paid", "overdue", "partially_paid"],
      fuel_type: ["petrol", "diesel", "electric", "hybrid", "cng", "lpg"],
      payment_mode: ["cash", "bank_transfer", "cheque", "upi", "card", "emi"],
      payment_type: [
        "customer_payment",
        "vendor_payment",
        "emi_payment",
        "expense",
      ],
      sale_status: ["inquiry", "reserved", "completed", "cancelled"],
      transmission_type: ["manual", "automatic", "cvt", "dct"],
      user_role: ["admin", "manager", "operator", "viewer"],
      vehicle_condition: ["new", "used"],
      vehicle_status: ["in_stock", "reserved", "sold"],
      vehicle_type: ["car", "bike", "commercial"],
    },
  },
} as const
