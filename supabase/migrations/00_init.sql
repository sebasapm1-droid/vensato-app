-- Perfil de usuario (creado por trigger en auth.users)
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users,
  full_name   text,
  cedula      text,
  email       text,
  phone       text,
  plan        text DEFAULT 'base' CHECK (plan IN ('base','portafolio','patrimonio')),
  plan_expires_at timestamptz,
  bank_name   text,
  bank_account_type text,
  bank_account_number text,
  bank_account_holder text,
  logo_url    text,
  created_at  timestamptz DEFAULT now()
);

-- Propiedades
CREATE TABLE properties (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE,
  alias         text NOT NULL,
  type          text, -- apartamento, casa, local, bodega, etc.
  address       text,
  city          text,
  neighborhood  text,
  matricula     text,
  area_m2       numeric,
  bedrooms      int,
  bathrooms     int,
  estrato       int,
  commercial_value  numeric, -- para Cap Rate
  current_rent  numeric,
  admin_fee     numeric DEFAULT 0,
  predial_annual numeric DEFAULT 0,
  status        text DEFAULT 'occupied' CHECK (status IN ('occupied','vacant','in_process')),
  notes         text,
  created_at    timestamptz DEFAULT now()
);

-- Inquilinos
CREATE TABLE tenants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE,
  property_id   uuid REFERENCES properties(id),
  full_name     text NOT NULL,
  cedula        text,
  email         text,
  phone         text,
  whatsapp      text,
  notification_address text,
  created_at    timestamptz DEFAULT now()
);

-- Contratos
CREATE TABLE contracts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES profiles(id) ON DELETE CASCADE,
  property_id       uuid REFERENCES properties(id),
  tenant_id         uuid REFERENCES tenants(id),
  start_date        date NOT NULL,
  end_date          date,
  duration_months   int,
  initial_rent      numeric NOT NULL,
  current_rent      numeric NOT NULL,
  increment_type    text DEFAULT 'ipc' CHECK (increment_type IN ('ipc','fixed_percent','manual')),
  increment_month   int DEFAULT 1, -- enero=1
  deposit_months    int DEFAULT 1,
  deposit_amount    numeric,
  status            text DEFAULT 'active' CHECK (status IN ('active','expired','terminated')),
  file_url          text, -- Supabase Storage URL del contrato firmado
  notes             text,
  created_at        timestamptz DEFAULT now()
);

-- Cobros
CREATE TABLE charges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES profiles(id) ON DELETE CASCADE,
  property_id     uuid REFERENCES properties(id),
  tenant_id       uuid REFERENCES tenants(id),
  contract_id     uuid REFERENCES contracts(id),
  concept         text NOT NULL, -- arriendo, admin, extraordinario, otro
  amount          numeric NOT NULL,
  due_date        date NOT NULL,
  paid_date       date,
  payment_method  text, -- transferencia, nequi, llave, wompi
  status          text DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
  pdf_url         text, -- Supabase Storage URL de la cuenta de cobro
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- Gastos de propiedades
CREATE TABLE expenses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE,
  property_id   uuid REFERENCES properties(id),
  category      text, -- predial, mantenimiento, admin, seguro, otro
  description   text,
  amount        numeric NOT NULL,
  date          date NOT NULL,
  receipt_url   text,
  created_at    timestamptz DEFAULT now()
);

-- Documentos (bóveda)
CREATE TABLE documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE,
  property_id   uuid REFERENCES properties(id),
  tenant_id     uuid REFERENCES tenants(id),
  type          text, -- contrato, escritura, paz_y_salvo, cedula, predial, otro
  name          text NOT NULL,
  file_url      text NOT NULL, -- Supabase Storage
  file_size     int, -- bytes
  mime_type     text,
  uploaded_at   timestamptz DEFAULT now()
);

-- IPC histórico Colombia (seed data)
CREATE TABLE ipc_history (
  year  int PRIMARY KEY,
  rate  numeric NOT NULL -- porcentaje, ej: 9.94 para 2022
);

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can only access their own profile" ON profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can only access their own properties" ON properties FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only access their own tenants" ON tenants FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only access their own contracts" ON contracts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only access their own charges" ON charges FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only access their own expenses" ON expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only access their own documents" ON documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Función y trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
