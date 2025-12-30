/*
  # Add Client Inquiry Reference to Inquiries

  1. Changes
    - Add client_inquiry_reference column to inquiries table
    - This is an optional field for client-provided inquiry numbers/references
    - Different from the system-generated inquiry_number

  2. Column Details
    - client_inquiry_reference (text, nullable)
    - Can contain letters and numbers
    - Users can search by this field
*/

-- Add client_inquiry_reference column
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS client_inquiry_reference text;

-- Add index for faster searching
CREATE INDEX IF NOT EXISTS idx_inquiries_client_reference 
ON inquiries(client_inquiry_reference) 
WHERE client_inquiry_reference IS NOT NULL;
