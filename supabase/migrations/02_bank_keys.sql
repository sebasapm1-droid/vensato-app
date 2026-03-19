-- Add an optional bank_account_key for neobanks integrations (Lulo, Nequi, etc.)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account_key text;
