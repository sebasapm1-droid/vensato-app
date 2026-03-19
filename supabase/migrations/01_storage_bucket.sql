-- Create a public storage bucket for documents (vault)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own files
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to read their own documents
CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

-- Allow authenticated users to delete their own documents
CREATE POLICY "Authenticated users can delete their own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');

-- Add purchase_price column alias for app-level compatibility
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS purchase_price numeric GENERATED ALWAYS AS (commercial_value) STORED;
