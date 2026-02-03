-- Add archived column to business_leads for soft delete / discard workflow
ALTER TABLE business_leads
ADD COLUMN archived BOOLEAN DEFAULT FALSE;

-- Index for performance when filtering out archived leads
CREATE INDEX IF NOT EXISTS idx_business_leads_archived ON business_leads(archived);
