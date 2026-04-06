export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          cedula: string | null;
          email: string | null;
          phone: string | null;
          plan: "base" | "inicio" | "portafolio" | "patrimonio" | null;
          plan_expires_at: string | null;
          bank_name: string | null;
          bank_account_type: string | null;
          bank_account_number: string | null;
          bank_account_holder: string | null;
          bank_account_key: string | null;
          logo_url: string | null;
          tier: "base" | "inicio" | "portafolio" | "patrimonio";
          subscription_status: "active" | "past_due" | "cancelled" | "trialing";
          subscription_valid_until: string | null;
          pending_tier: string | null;
          pending_tier_since: string | null;
          wompi_payment_token: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          user_id: string | null;
          alias: string;
          type: string | null;
          address: string | null;
          city: string | null;
          neighborhood: string | null;
          matricula: string | null;
          area_m2: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          estrato: number | null;
          commercial_value: number | null;
          current_rent: number | null;
          admin_fee: number | null;
          predial_annual: number | null;
          status: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["properties"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["properties"]["Row"]>;
        Relationships: [];
      };
      tenants: {
        Row: {
          id: string;
          user_id: string | null;
          property_id: string | null;
          full_name: string;
          cedula: string | null;
          email: string | null;
          phone: string | null;
          whatsapp: string | null;
          notification_address: string | null;
          activo: boolean | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["tenants"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["tenants"]["Row"]>;
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          user_id: string | null;
          property_id: string | null;
          tenant_id: string | null;
          start_date: string;
          end_date: string | null;
          duration_months: number | null;
          initial_rent: number;
          current_rent: number;
          increment_type: string | null;
          increment_month: number | null;
          deposit_months: number | null;
          deposit_amount: number | null;
          status: string | null;
          file_url: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["contracts"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["contracts"]["Row"]>;
        Relationships: [];
      };
      charges: {
        Row: {
          id: string;
          user_id: string | null;
          property_id: string | null;
          tenant_id: string | null;
          contract_id: string | null;
          concept: string;
          amount: number;
          due_date: string;
          paid_date: string | null;
          payment_method: string | null;
          status: string | null;
          pdf_url: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["charges"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["charges"]["Row"]>;
        Relationships: [];
      };
      charge_email_deliveries: {
        Row: {
          id: string;
          charge_id: string;
          user_id: string;
          tenant_id: string | null;
          provider: string;
          provider_message_id: string | null;
          trigger: "manual" | "automatic";
          status: "sent" | "failed" | "skipped";
          recipient_email: string;
          subject: string;
          error_message: string | null;
          sent_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["charge_email_deliveries"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["charge_email_deliveries"]["Row"]>;
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string | null;
          property_id: string | null;
          category: string | null;
          description: string | null;
          amount: number;
          date: string;
          receipt_url: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["expenses"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["expenses"]["Row"]>;
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          user_id: string | null;
          property_id: string | null;
          tenant_id: string | null;
          type: string | null;
          name: string;
          file_url: string;
          file_size: number | null;
          mime_type: string | null;
          uploaded_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["documents"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["documents"]["Row"]>;
        Relationships: [];
      };
      documentos: {
        Row: {
          id: string;
          user_id: string;
          propiedad_id: string | null;
          tipo: string;
          nombre_original: string;
          r2_key: string;
          tamanio_bytes: number | null;
          tenant_id: string | null;
          texto_extraido: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["documentos"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["documentos"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
