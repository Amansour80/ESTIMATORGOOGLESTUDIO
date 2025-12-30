/*
  # Create Organization Logos Storage Bucket

  1. Storage Bucket
    - Create 'organization-logos' bucket for storing organization logo files
    - Public bucket to allow easy access in PDFs and exports
    - 2MB file size limit per file
  
  2. Security
    - RLS policies ensure only organization admins can upload/delete logos
    - All authenticated users can view logos from their organization
    - Bucket is public for easy embedding in documents
*/

-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-logos',
  'organization-logos',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Organization admins can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Organization admins can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Organization admins can delete logos" ON storage.objects;

-- Allow authenticated users to view all logos (public bucket)
CREATE POLICY "Anyone can view organization logos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'organization-logos');

-- Allow organization admins to upload logos
CREATE POLICY "Organization admins can upload logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'organization-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Allow organization admins to update their logos
CREATE POLICY "Organization admins can update logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'organization-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Allow organization admins to delete their logos
CREATE POLICY "Organization admins can delete logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'organization-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );
