// Generated from the live SAFRA project (vuuoytevikywqymgabws) — do not edit by hand.
// Regenerate after schema changes: npm run db:types

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      destinations: {
        Row: {
          card_image_alt: string
          card_image_url: string
          country: string
          created_at: string
          description: string
          duration: string
          duration_bands: string[]
          estimated_total: number
          hero_image_alt: string
          hero_image_url: string
          highlights: string[]
          is_active: boolean
          match_default: number
          max_budget: number
          min_budget: number
          month_affinity: number[]
          quiz_tags: string[]
          slug: string
          sort_order: number
          teaser_budget: number
          teaser_duration: string
          teaser_tags: string[]
          title: string
          traveler_suitability: Json
          translations: Json
          updated_at: string
        }
        Insert: {
          card_image_alt?: string
          card_image_url: string
          country: string
          created_at?: string
          description: string
          duration: string
          duration_bands?: string[]
          estimated_total: number
          hero_image_alt?: string
          hero_image_url: string
          highlights?: string[]
          is_active?: boolean
          match_default?: number
          max_budget: number
          min_budget: number
          month_affinity?: number[]
          quiz_tags?: string[]
          slug: string
          sort_order?: number
          teaser_budget: number
          teaser_duration: string
          teaser_tags?: string[]
          title: string
          traveler_suitability?: Json
          translations?: Json
          updated_at?: string
        }
        Update: {
          card_image_alt?: string
          card_image_url?: string
          country?: string
          created_at?: string
          description?: string
          duration?: string
          duration_bands?: string[]
          estimated_total?: number
          hero_image_alt?: string
          hero_image_url?: string
          highlights?: string[]
          is_active?: boolean
          match_default?: number
          max_budget?: number
          min_budget?: number
          month_affinity?: number[]
          quiz_tags?: string[]
          slug?: string
          sort_order?: number
          teaser_budget?: number
          teaser_duration?: string
          teaser_tags?: string[]
          title?: string
          traveler_suitability?: Json
          translations?: Json
          updated_at?: string
        }
        Relationships: []
      }
      request_events: {
        Row: {
          actor: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["request_status"] | null
          id: number
          request_id: string
          to_status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          actor?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["request_status"] | null
          id?: never
          request_id: string
          to_status: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          actor?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["request_status"] | null
          id?: never
          request_id?: string
          to_status?: Database["public"]["Enums"]["request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          budget_dt: number | null
          category: string | null
          channel: string
          created_at: string
          destination_slug: string | null
          destination_text: string | null
          duration_days: number | null
          duration_text: string | null
          full_name: string
          id: string
          kind: Database["public"]["Enums"]["request_kind"]
          locale: string
          notes: string | null
          number: number
          preferred_date: string | null
          quiz_answers: Json | null
          reference: string | null
          safari_slug: string | null
          source: Database["public"]["Enums"]["request_source"]
          status: Database["public"]["Enums"]["request_status"]
          travelers: number
          updated_at: string
          whatsapp: string
        }
        Insert: {
          budget_dt?: number | null
          category?: string | null
          channel?: string
          created_at?: string
          destination_slug?: string | null
          destination_text?: string | null
          duration_days?: number | null
          duration_text?: string | null
          full_name: string
          id?: string
          kind: Database["public"]["Enums"]["request_kind"]
          locale?: string
          notes?: string | null
          number?: never
          preferred_date?: string | null
          quiz_answers?: Json | null
          reference?: string | null
          safari_slug?: string | null
          source: Database["public"]["Enums"]["request_source"]
          status?: Database["public"]["Enums"]["request_status"]
          travelers: number
          updated_at?: string
          whatsapp: string
        }
        Update: {
          budget_dt?: number | null
          category?: string | null
          channel?: string
          created_at?: string
          destination_slug?: string | null
          destination_text?: string | null
          duration_days?: number | null
          duration_text?: string | null
          full_name?: string
          id?: string
          kind?: Database["public"]["Enums"]["request_kind"]
          locale?: string
          notes?: string | null
          number?: never
          preferred_date?: string | null
          quiz_answers?: Json | null
          reference?: string | null
          safari_slug?: string | null
          source?: Database["public"]["Enums"]["request_source"]
          status?: Database["public"]["Enums"]["request_status"]
          travelers?: number
          updated_at?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_destination_slug_fkey"
            columns: ["destination_slug"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "requests_safari_slug_fkey"
            columns: ["safari_slug"]
            isOneToOne: false
            referencedRelation: "safaris"
            referencedColumns: ["slug"]
          },
        ]
      }
      safaris: {
        Row: {
          created_at: string
          description: string
          duration: string
          highlights: string[]
          image_alt: string
          image_url: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          translations: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          duration: string
          highlights?: string[]
          image_alt?: string
          image_url: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          translations?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          duration?: string
          highlights?: string[]
          image_alt?: string
          image_url?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          translations?: Json
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          country: string
          created_at: string
          description: string
          documents: string[]
          flag: string
          includes: string[]
          is_active: boolean
          name: string
          price_dt: number
          slug: string
          sort_order: number
          translations: Json
          updated_at: string
        }
        Insert: {
          country?: string
          created_at?: string
          description?: string
          documents?: string[]
          flag?: string
          includes?: string[]
          is_active?: boolean
          name: string
          price_dt: number
          slug: string
          sort_order?: number
          translations?: Json
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          description?: string
          documents?: string[]
          flag?: string
          includes?: string[]
          is_active?: boolean
          name?: string
          price_dt?: number
          slug?: string
          sort_order?: number
          translations?: Json
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          booking_mode: string
          id: number
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          booking_mode?: string
          id?: number
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          booking_mode?: string
          id?: number
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      visa_applications: {
        Row: {
          accommodation_booked: boolean
          arrival_date: string
          created_at: string
          date_of_birth: string
          departure_date: string
          flight_booked: boolean
          nationality: string
          occupation_status: string
          passport_expiry: string
          passport_number: string
          previous_visit: boolean
          previous_visa_refusal: boolean
          price_dt: number
          purpose_of_travel: string
          request_id: string
          service_slug: string
        }
        Insert: {
          accommodation_booked: boolean
          arrival_date: string
          created_at?: string
          date_of_birth: string
          departure_date: string
          flight_booked: boolean
          nationality: string
          occupation_status: string
          passport_expiry: string
          passport_number: string
          previous_visit: boolean
          previous_visa_refusal: boolean
          price_dt: number
          purpose_of_travel: string
          request_id: string
          service_slug: string
        }
        Update: {
          accommodation_booked?: boolean
          arrival_date?: string
          created_at?: string
          date_of_birth?: string
          departure_date?: string
          flight_booked?: boolean
          nationality?: string
          occupation_status?: string
          passport_expiry?: string
          passport_number?: string
          previous_visit?: boolean
          previous_visa_refusal?: boolean
          price_dt?: number
          purpose_of_travel?: string
          request_id?: string
          service_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "visa_applications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visa_applications_service_slug_fkey"
            columns: ["service_slug"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["slug"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      submit_request: {
        Args: { payload: Json }
        Returns: {
          id: string
          reference: string
        }[]
      }
    }
    Enums: {
      request_kind: "trip" | "visa" | "safari"
      request_source: "quiz" | "trip" | "direct" | "visa" | "safari"
      request_status:
        | "new"
        | "contacted"
        | "quoted"
        | "paid"
        | "closed"
        | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      request_kind: ["trip", "visa", "safari"],
      request_source: ["quiz", "trip", "direct", "visa", "safari"],
      request_status: [
        "new",
        "contacted",
        "quoted",
        "paid",
        "closed",
        "cancelled",
      ],
    },
  },
} as const
