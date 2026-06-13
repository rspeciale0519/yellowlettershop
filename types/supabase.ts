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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          target_id: string | null
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      background_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          data: Json
          error: string | null
          id: string
          metadata: Json
          progress: number
          result: Json | null
          started_at: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          data?: Json
          error?: string | null
          id: string
          metadata?: Json
          progress?: number
          result?: Json | null
          started_at?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          data?: Json
          error?: string | null
          id?: string
          metadata?: Json
          progress?: number
          result?: Json | null
          started_at?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_mailing_lists: {
        Row: {
          added_at: string | null
          campaign_id: string
          mailing_list_id: string
        }
        Insert: {
          added_at?: string | null
          campaign_id: string
          mailing_list_id: string
        }
        Update: {
          added_at?: string | null
          campaign_id?: string
          mailing_list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_mailing_lists_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_mailing_lists_mailing_list_id_fkey"
            columns: ["mailing_list_id"]
            isOneToOne: false
            referencedRelation: "mailing_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_records: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_status: string | null
          drop_number: number | null
          id: string
          mailing_list_id: string | null
          record_id: string | null
          scheduled_date: string | null
          short_link_code: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string | null
          drop_number?: number | null
          id?: string
          mailing_list_id?: string | null
          record_id?: string | null
          scheduled_date?: string | null
          short_link_code?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string | null
          drop_number?: number | null
          id?: string
          mailing_list_id?: string | null
          record_id?: string | null
          scheduled_date?: string | null
          short_link_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_records_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_records_mailing_list_id_fkey"
            columns: ["mailing_list_id"]
            isOneToOne: false
            referencedRelation: "mailing_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_records_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "mailing_list_records"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          active_order_id: string | null
          actual_cost: number | null
          campaign_type: string | null
          completed_at: string | null
          contact_card_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          design_id: string | null
          estimated_cost: number | null
          execution_dates: Json | null
          fulfillment_type: string | null
          id: string
          metadata: Json | null
          name: string
          postage_type: string | null
          repeat_config: Json | null
          scheduled_at: string | null
          scheduled_start_date: string | null
          sent_at: string | null
          split_config: Json | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          team_id: string | null
          total_records: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          active_order_id?: string | null
          actual_cost?: number | null
          campaign_type?: string | null
          completed_at?: string | null
          contact_card_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          design_id?: string | null
          estimated_cost?: number | null
          execution_dates?: Json | null
          fulfillment_type?: string | null
          id?: string
          metadata?: Json | null
          name: string
          postage_type?: string | null
          repeat_config?: Json | null
          scheduled_at?: string | null
          scheduled_start_date?: string | null
          sent_at?: string | null
          split_config?: Json | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          team_id?: string | null
          total_records?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          active_order_id?: string | null
          actual_cost?: number | null
          campaign_type?: string | null
          completed_at?: string | null
          contact_card_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          design_id?: string | null
          estimated_cost?: number | null
          execution_dates?: Json | null
          fulfillment_type?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          postage_type?: string | null
          repeat_config?: Json | null
          scheduled_at?: string | null
          scheduled_start_date?: string | null
          sent_at?: string | null
          split_config?: Json | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          team_id?: string | null
          total_records?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_active_order_id_fkey"
            columns: ["active_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_contact_card_id_fkey"
            columns: ["contact_card_id"]
            isOneToOne: false
            referencedRelation: "contact_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_cards: {
        Row: {
          city: string
          company: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          is_default: boolean | null
          is_soft_deleted: boolean | null
          last_name: string
          name: string
          phone: string
          state: string
          street_address: string
          suite_unit_apt: string | null
          team_id: string | null
          updated_at: string | null
          user_id: string | null
          zip_code: string
        }
        Insert: {
          city: string
          company?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          is_default?: boolean | null
          is_soft_deleted?: boolean | null
          last_name: string
          name: string
          phone: string
          state: string
          street_address: string
          suite_unit_apt?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code: string
        }
        Update: {
          city?: string
          company?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_default?: boolean | null
          is_soft_deleted?: boolean | null
          last_name?: string
          name?: string
          phone?: string
          state?: string
          street_address?: string
          suite_unit_apt?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_cards_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      design_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          preview_image_url: string | null
          tags: string[]
          template_data: Json
          type: Database["public"]["Enums"]["template_type"]
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          preview_image_url?: string | null
          tags?: string[]
          template_data?: Json
          type: Database["public"]["Enums"]["template_type"]
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          preview_image_url?: string | null
          tags?: string[]
          template_data?: Json
          type?: Database["public"]["Enums"]["template_type"]
          updated_at?: string
        }
        Relationships: []
      }
      mail_pieces: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          dimensions: string | null
          id: string
          metadata: Json | null
          name: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dimensions?: string | null
          id?: string
          metadata?: Json | null
          name: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dimensions?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      mailing_list_records: {
        Row: {
          additional_data: Json | null
          address_line1: string | null
          address_line2: string | null
          age: number | null
          auction_date: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          county: string | null
          created_at: string | null
          data_source: string | null
          deliverability_score: number | null
          education_level: string | null
          email: string | null
          estimated_value: number | null
          external_id: string | null
          filing_date: string | null
          first_name: string | null
          foreclosure_status: string | null
          full_name: string | null
          gender: string | null
          home_ownership: string | null
          id: string
          income: number | null
          interest_rate: number | null
          is_valid: boolean | null
          last_name: string | null
          last_sale_date: string | null
          last_sale_price: number | null
          last_used_at: string | null
          latitude: number | null
          lender_name: string | null
          likely_to_move: boolean | null
          likely_to_refinance: boolean | null
          likely_to_sell: boolean | null
          loan_amount: number | null
          loan_to_value: number | null
          loan_type: string | null
          longitude: number | null
          lot_size: number | null
          mailing_list_id: string | null
          marital_status: string | null
          maturity_date: string | null
          metadata: Json | null
          middle_name: string | null
          modified_by: string | null
          motivation_score: number | null
          net_worth: number | null
          occupation: string | null
          origination_date: string | null
          phone: string | null
          property_type: string | null
          redemption_date: string | null
          square_feet: number | null
          state: string | null
          status: string | null
          updated_at: string | null
          usage_count: number | null
          validation_errors: Json | null
          validation_status: string | null
          year_built: number | null
          zip_code: string | null
        }
        Insert: {
          additional_data?: Json | null
          address_line1?: string | null
          address_line2?: string | null
          age?: number | null
          auction_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          data_source?: string | null
          deliverability_score?: number | null
          education_level?: string | null
          email?: string | null
          estimated_value?: number | null
          external_id?: string | null
          filing_date?: string | null
          first_name?: string | null
          foreclosure_status?: string | null
          full_name?: string | null
          gender?: string | null
          home_ownership?: string | null
          id?: string
          income?: number | null
          interest_rate?: number | null
          is_valid?: boolean | null
          last_name?: string | null
          last_sale_date?: string | null
          last_sale_price?: number | null
          last_used_at?: string | null
          latitude?: number | null
          lender_name?: string | null
          likely_to_move?: boolean | null
          likely_to_refinance?: boolean | null
          likely_to_sell?: boolean | null
          loan_amount?: number | null
          loan_to_value?: number | null
          loan_type?: string | null
          longitude?: number | null
          lot_size?: number | null
          mailing_list_id?: string | null
          marital_status?: string | null
          maturity_date?: string | null
          metadata?: Json | null
          middle_name?: string | null
          modified_by?: string | null
          motivation_score?: number | null
          net_worth?: number | null
          occupation?: string | null
          origination_date?: string | null
          phone?: string | null
          property_type?: string | null
          redemption_date?: string | null
          square_feet?: number | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          usage_count?: number | null
          validation_errors?: Json | null
          validation_status?: string | null
          year_built?: number | null
          zip_code?: string | null
        }
        Update: {
          additional_data?: Json | null
          address_line1?: string | null
          address_line2?: string | null
          age?: number | null
          auction_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          data_source?: string | null
          deliverability_score?: number | null
          education_level?: string | null
          email?: string | null
          estimated_value?: number | null
          external_id?: string | null
          filing_date?: string | null
          first_name?: string | null
          foreclosure_status?: string | null
          full_name?: string | null
          gender?: string | null
          home_ownership?: string | null
          id?: string
          income?: number | null
          interest_rate?: number | null
          is_valid?: boolean | null
          last_name?: string | null
          last_sale_date?: string | null
          last_sale_price?: number | null
          last_used_at?: string | null
          latitude?: number | null
          lender_name?: string | null
          likely_to_move?: boolean | null
          likely_to_refinance?: boolean | null
          likely_to_sell?: boolean | null
          loan_amount?: number | null
          loan_to_value?: number | null
          loan_type?: string | null
          longitude?: number | null
          lot_size?: number | null
          mailing_list_id?: string | null
          marital_status?: string | null
          maturity_date?: string | null
          metadata?: Json | null
          middle_name?: string | null
          modified_by?: string | null
          motivation_score?: number | null
          net_worth?: number | null
          occupation?: string | null
          origination_date?: string | null
          phone?: string | null
          property_type?: string | null
          redemption_date?: string | null
          square_feet?: number | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          usage_count?: number | null
          validation_errors?: Json | null
          validation_status?: string | null
          year_built?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mailing_list_records_mailing_list_id_fkey"
            columns: ["mailing_list_id"]
            isOneToOne: false
            referencedRelation: "mailing_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      mailing_list_tags: {
        Row: {
          created_at: string | null
          mailing_list_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          mailing_list_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          mailing_list_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mailing_list_tags_mailing_list_id_fkey"
            columns: ["mailing_list_id"]
            isOneToOne: false
            referencedRelation: "mailing_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mailing_list_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      mailing_list_usage: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          id: string
          mailing_list_id: string | null
          record_count: number | null
          usage_type: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          mailing_list_id?: string | null
          record_count?: number | null
          usage_type: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          mailing_list_id?: string | null
          record_count?: number | null
          usage_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mailing_list_usage_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mailing_list_usage_mailing_list_id_fkey"
            columns: ["mailing_list_id"]
            isOneToOne: false
            referencedRelation: "mailing_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      mailing_list_versions: {
        Row: {
          change_description: string | null
          created_at: string | null
          created_by: string | null
          criteria: Json | null
          description: string | null
          id: string
          mailing_list_id: string | null
          metadata: Json | null
          name: string
          record_count: number | null
          snapshot: Json | null
          version_number: number
        }
        Insert: {
          change_description?: string | null
          created_at?: string | null
          created_by?: string | null
          criteria?: Json | null
          description?: string | null
          id?: string
          mailing_list_id?: string | null
          metadata?: Json | null
          name: string
          record_count?: number | null
          snapshot?: Json | null
          version_number: number
        }
        Update: {
          change_description?: string | null
          created_at?: string | null
          created_by?: string | null
          criteria?: Json | null
          description?: string | null
          id?: string
          mailing_list_id?: string | null
          metadata?: Json | null
          name?: string
          record_count?: number | null
          snapshot?: Json | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "mailing_list_versions_mailing_list_id_fkey"
            columns: ["mailing_list_id"]
            isOneToOne: false
            referencedRelation: "mailing_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      mailing_lists: {
        Row: {
          created_at: string | null
          created_by: string | null
          criteria: Json | null
          description: string | null
          estimated_cost: number | null
          file_url: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          metadata: Json | null
          name: string
          purchase_count: number | null
          record_count: number | null
          source_criteria: Json | null
          source_type: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          criteria?: Json | null
          description?: string | null
          estimated_cost?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          metadata?: Json | null
          name: string
          purchase_count?: number | null
          record_count?: number | null
          source_criteria?: Json | null
          source_type?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          criteria?: Json | null
          description?: string | null
          estimated_cost?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          metadata?: Json | null
          name?: string
          purchase_count?: number | null
          record_count?: number | null
          source_criteria?: Json | null
          source_type?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mailing_lists_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      order_drafts: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          order_state: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          order_state: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          order_state?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_authorized: number | null
          amount_captured: number | null
          campaign_id: string | null
          cost_per_piece: number | null
          created_at: string | null
          created_by: string | null
          delivered_at: string | null
          expected_delivery_date: string | null
          id: string
          mail_class: string | null
          mail_piece_id: string | null
          metadata: Json | null
          payment_status: string | null
          postage_type: string | null
          proof_approved_at: string | null
          proof_approved_by: string | null
          proof_urls: Json | null
          record_count: number | null
          shipped_at: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          stripe_payment_intent_id: string | null
          submitted_at: string | null
          total_cost: number | null
          tracking_numbers: Json | null
          vendor_assignments: Json | null
          vendor_order_id: string | null
        }
        Insert: {
          amount_authorized?: number | null
          amount_captured?: number | null
          campaign_id?: string | null
          cost_per_piece?: number | null
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          expected_delivery_date?: string | null
          id?: string
          mail_class?: string | null
          mail_piece_id?: string | null
          metadata?: Json | null
          payment_status?: string | null
          postage_type?: string | null
          proof_approved_at?: string | null
          proof_approved_by?: string | null
          proof_urls?: Json | null
          record_count?: number | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          stripe_payment_intent_id?: string | null
          submitted_at?: string | null
          total_cost?: number | null
          tracking_numbers?: Json | null
          vendor_assignments?: Json | null
          vendor_order_id?: string | null
        }
        Update: {
          amount_authorized?: number | null
          amount_captured?: number | null
          campaign_id?: string | null
          cost_per_piece?: number | null
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          expected_delivery_date?: string | null
          id?: string
          mail_class?: string | null
          mail_piece_id?: string | null
          metadata?: Json | null
          payment_status?: string | null
          postage_type?: string | null
          proof_approved_at?: string | null
          proof_approved_by?: string | null
          proof_urls?: Json | null
          record_count?: number | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          stripe_payment_intent_id?: string | null
          submitted_at?: string | null
          total_cost?: number | null
          tracking_numbers?: Json | null
          vendor_assignments?: Json | null
          vendor_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_mail_piece_id_fkey"
            columns: ["mail_piece_id"]
            isOneToOne: false
            referencedRelation: "mail_pieces"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_change_log: {
        Row: {
          change_type: string
          changed_by: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          pricing_config_id: string | null
          reason: string | null
        }
        Insert: {
          change_type: string
          changed_by: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          pricing_config_id?: string | null
          reason?: string | null
        }
        Update: {
          change_type?: string
          changed_by?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          pricing_config_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_change_log_pricing_config_id_fkey"
            columns: ["pricing_config_id"]
            isOneToOne: false
            referencedRelation: "pricing_config"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_config: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          is_public: boolean | null
          key: string
          metadata: Json | null
          pricing_model: string
          sort_order: number | null
          tier_config: Json | null
          unit_amount: number | null
          unit_label: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          key: string
          metadata?: Json | null
          pricing_model?: string
          sort_order?: number | null
          tier_config?: Json | null
          unit_amount?: number | null
          unit_label?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          key?: string
          metadata?: Json | null
          pricing_model?: string
          sort_order?: number | null
          tier_config?: Json | null
          unit_amount?: number | null
          unit_label?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      proof_annotations: {
        Row: {
          comment: string
          created_at: string | null
          created_by: string
          id: string
          order_id: string | null
          page_number: number
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          x_coordinate: number | null
          y_coordinate: number | null
        }
        Insert: {
          comment: string
          created_at?: string | null
          created_by: string
          id?: string
          order_id?: string | null
          page_number: number
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Update: {
          comment?: string
          created_at?: string | null
          created_by?: string
          id?: string
          order_id?: string | null
          page_number?: number
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proof_annotations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_counters: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      record_usage: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          id: string
          record_id: string | null
          usage_type: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          record_id?: string | null
          usage_type: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          record_id?: string | null
          usage_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_usage_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_usage_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "mailing_list_records"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_designs: {
        Row: {
          created_at: string | null
          description: string | null
          design_data: Json
          design_type: string | null
          id: string
          is_template: boolean | null
          name: string
          team_id: string | null
          thumbnail_url: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          design_data: Json
          design_type?: string | null
          id?: string
          is_template?: boolean | null
          name: string
          team_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          design_data?: Json
          design_type?: string | null
          id?: string
          is_template?: boolean | null
          name?: string
          team_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_designs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      short_link_tracking: {
        Row: {
          campaign_id: string | null
          clicks: Json | null
          created_at: string | null
          id: string
          record_id: string | null
          short_code: string
          target_url: string | null
          total_clicks: number | null
        }
        Insert: {
          campaign_id?: string | null
          clicks?: Json | null
          created_at?: string | null
          id?: string
          record_id?: string | null
          short_code: string
          target_url?: string | null
          total_clicks?: number | null
        }
        Update: {
          campaign_id?: string | null
          clicks?: Json | null
          created_at?: string | null
          id?: string
          record_id?: string | null
          short_code?: string
          target_url?: string | null
          total_clicks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "short_link_tracking_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "short_link_tracking_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "mailing_list_records"
            referencedColumns: ["id"]
          },
        ]
      }
      skip_trace_orders: {
        Row: {
          completed_at: string | null
          cost: number | null
          created_at: string | null
          id: string
          record_ids: string[]
          results_file_url: string | null
          status: string | null
          submitted_at: string | null
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          completed_at?: string | null
          cost?: number | null
          created_at?: string | null
          id?: string
          record_ids: string[]
          results_file_url?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          completed_at?: string | null
          cost?: number | null
          created_at?: string | null
          id?: string
          record_ids?: string[]
          results_file_url?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skip_trace_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      system_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          design_data: Json
          design_type: string | null
          id: string
          is_active: boolean | null
          name: string
          thumbnail_url: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          design_data: Json
          design_type?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          thumbnail_url?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          design_data?: Json
          design_type?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          thumbnail_url?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          id: string
          max_seats: number
          name: string
          owner_id: string
          plan: string
          settings: Json | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_seats?: number
          name: string
          owner_id: string
          plan: string
          settings?: Json | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_seats?: number
          name?: string
          owner_id?: string
          plan?: string
          settings?: Json | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          created_by: string
          description: string
          id: string
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          account_status: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: string
          settings: Json
          team_id: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string
          settings?: Json
          team_id?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string
          settings?: Json
          team_id?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          contact_info: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          performance_metrics: Json | null
          pricing_tiers: Json | null
          updated_at: string | null
          vendor_type: string[]
        }
        Insert: {
          contact_info: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          performance_metrics?: Json | null
          pricing_tiers?: Json | null
          updated_at?: string | null
          vendor_type: string[]
        }
        Update: {
          contact_info?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          performance_metrics?: Json | null
          pricing_tiers?: Json | null
          updated_at?: string | null
          vendor_type?: string[]
        }
        Relationships: []
      }
      webhook_dead_letters: {
        Row: {
          attempts: number
          created_at: string
          event_type: string
          id: string
          last_error: string | null
          payload: Json
          user_id: string | null
          webhook_id: string | null
        }
        Insert: {
          attempts: number
          created_at?: string
          event_type: string
          id?: string
          last_error?: string | null
          payload: Json
          user_id?: string | null
          webhook_id?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          event_type?: string
          id?: string
          last_error?: string | null
          payload?: Json
          user_id?: string | null
          webhook_id?: string | null
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          delivery_attempts: number | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          webhook_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_attempts?: number | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_attempts?: number | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string | null
          events: string[]
          id: string
          is_active: boolean | null
          retry_count: number | null
          secret: string | null
          team_id: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          events: string[]
          id?: string
          is_active?: boolean | null
          retry_count?: number | null
          secret?: string | null
          team_id?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          events?: string[]
          id?: string
          is_active?: boolean | null
          retry_count?: number | null
          secret?: string | null
          team_id?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      // ---- Restored ahead of migration 20260613030000 (assets + version-history).
      // Applied to the live DB at deploy time; shapes mirror that migration exactly.
      asset_share_links: {
        Row: {
          access_count: number
          asset_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          share_token: string
        }
        Insert: {
          access_count?: number
          asset_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          share_token: string
        }
        Update: {
          access_count?: number
          asset_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          share_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_share_links_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "user_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      change_history: {
        Row: {
          batch_id: string | null
          change_type: string
          created_at: string
          description: string | null
          field_name: string | null
          id: string
          is_undoable: boolean
          new_value: string | null
          old_value: string | null
          resource_id: string
          resource_type: string
          sequence_number: number
          undone_at: string | null
          undone_by: string | null
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          change_type: string
          created_at?: string
          description?: string | null
          field_name?: string | null
          id?: string
          is_undoable?: boolean
          new_value?: string | null
          old_value?: string | null
          resource_id: string
          resource_type: string
          sequence_number?: number
          undone_at?: string | null
          undone_by?: string | null
          user_id: string
        }
        Update: {
          batch_id?: string | null
          change_type?: string
          created_at?: string
          description?: string | null
          field_name?: string | null
          id?: string
          is_undoable?: boolean
          new_value?: string | null
          old_value?: string | null
          resource_id?: string
          resource_type?: string
          sequence_number?: number
          undone_at?: string | null
          undone_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_snapshots: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          resource_id: string
          resource_type: string
          snapshot_data: Json
          snapshot_type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          resource_id: string
          resource_type: string
          snapshot_data?: Json
          snapshot_type?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          resource_id?: string
          resource_type?: string
          snapshot_data?: Json
          snapshot_type?: string
        }
        Relationships: []
      }
      user_assets: {
        Row: {
          created_at: string
          file_path: string
          file_size: number
          file_type: string
          file_url: string | null
          filename: string
          id: string
          is_public: boolean
          metadata: Json
          mime_type: string
          original_filename: string
          team_id: string | null
          updated_at: string
          uploaded_by: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number
          file_type?: string
          file_url?: string | null
          filename: string
          id?: string
          is_public?: boolean
          metadata?: Json
          mime_type?: string
          original_filename: string
          team_id?: string | null
          updated_at?: string
          uploaded_by: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number
          file_type?: string
          file_url?: string | null
          filename?: string
          id?: string
          is_public?: boolean
          metadata?: Json
          mime_type?: string
          original_filename?: string
          team_id?: string | null
          updated_at?: string
          uploaded_by?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_rate_limit_counters: { Args: never; Returns: undefined }
      increment_rate_limit: {
        Args: { p_key: string; p_window_seconds: number }
        Returns: number
      }
    }
    Enums: {
      campaign_status:
        | "draft"
        | "pending_payment"
        | "proofs_pending"
        | "proofs_approved"
        | "validating"
        | "payment_captured"
        | "in_production"
        | "shipped"
        | "completed"
        | "cancelled"
      order_status:
        | "draft"
        | "submitted"
        | "processing"
        | "shipped"
        | "completed"
        | "failed"
      template_type: "letter" | "postcard" | "envelope"
      validation_status: "pending" | "running" | "completed" | "failed"
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
      campaign_status: [
        "draft",
        "pending_payment",
        "proofs_pending",
        "proofs_approved",
        "validating",
        "payment_captured",
        "in_production",
        "shipped",
        "completed",
        "cancelled",
      ],
      order_status: [
        "draft",
        "submitted",
        "processing",
        "shipped",
        "completed",
        "failed",
      ],
      template_type: ["letter", "postcard", "envelope"],
      validation_status: ["pending", "running", "completed", "failed"],
    },
  },
} as const

// ---------------------------------------------------------------------------
// Convenience row-type aliases for code that imports named types.
// Generated against the consolidated (DB1-model) schema on YLS-owned DB2.
// ---------------------------------------------------------------------------
export type MailingList = Database['public']['Tables']['mailing_lists']['Row']
export type MailingListRecord = Database['public']['Tables']['mailing_list_records']['Row']
export type MailingListVersion = Database['public']['Tables']['mailing_list_versions']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type CampaignRecord = Database['public']['Tables']['campaign_records']['Row']
export type Contact = Database['public']['Tables']['contact_cards']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type ProofAnnotation = Database['public']['Tables']['proof_annotations']['Row']
export type SavedDesign = Database['public']['Tables']['saved_designs']['Row']
export type SystemTemplate = Database['public']['Tables']['system_templates']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type Vendor = Database['public']['Tables']['vendors']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Webhook = Database['public']['Tables']['webhooks']['Row']
export type WebhookDelivery = Database['public']['Tables']['webhook_deliveries']['Row']
export type OrderStatus = Database['public']['Enums']['order_status']
export type CampaignStatus = Database['public']['Enums']['campaign_status']
export type UserAsset = Database['public']['Tables']['user_assets']['Row']
export type AssetShareLink = Database['public']['Tables']['asset_share_links']['Row']
export type ChangeHistory = Database['public']['Tables']['change_history']['Row']
export type DataSnapshot = Database['public']['Tables']['data_snapshots']['Row']
// change_history.resource_type / change_type are flexible text columns spanning
// many resource kinds (asset, vendor, team, campaign, mailing_list, …); typed as
// string to mirror the schema and avoid breaking the diverse set of callers.
export type ResourceType = string
export type ChangeType = string
