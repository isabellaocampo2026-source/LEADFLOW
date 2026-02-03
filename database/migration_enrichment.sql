-- Add additional_emails column to business_leads table
-- This column will store JSON data containing enrichment results (e.g., AnyMailFinder data)

ALTER TABLE business_leads 
ADD COLUMN IF NOT EXISTS additional_emails JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN business_leads.additional_emails IS 'List of additional emails found via enrichment services (e.g. AnyMailFinder)';
