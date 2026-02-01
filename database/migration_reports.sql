-- Migration: Create reports tables for client lead collections
-- Run this in Supabase SQL Editor

-- Reports table (collections of leads for clients)
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    client_name TEXT,
    whatsapp_template TEXT,
    category TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table: which leads belong to which reports
CREATE TABLE IF NOT EXISTS report_leads (
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES business_leads(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (report_id, lead_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_leads_report_id ON report_leads(report_id);
CREATE INDEX IF NOT EXISTS idx_report_leads_lead_id ON report_leads(lead_id);

-- Add has_whatsapp column to business_leads if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_leads' AND column_name = 'has_whatsapp'
    ) THEN
        ALTER TABLE business_leads ADD COLUMN has_whatsapp BOOLEAN DEFAULT NULL;
    END IF;
END $$;

-- Verify creation
SELECT 'Reports tables created successfully' as status;
