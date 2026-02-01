-- Migration: Create business_leads table for Google Maps scraper
-- Run this in Supabase SQL Editor

-- Drop old real estate table if it exists
DROP TABLE IF EXISTS leads;

-- Create new business leads table
CREATE TABLE business_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    rating DECIMAL(2,1),
    review_count INTEGER,
    price_level TEXT,
    maps_url TEXT,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    contacted BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_business_leads_category ON business_leads(category);
CREATE INDEX idx_business_leads_city ON business_leads(city);
CREATE INDEX idx_business_leads_contacted ON business_leads(contacted);
CREATE INDEX idx_business_leads_scraped_at ON business_leads(scraped_at DESC);

-- Enable Row Level Security (optional, for multi-user later)
-- ALTER TABLE business_leads ENABLE ROW LEVEL SECURITY;

-- Verify creation
SELECT 'business_leads table created successfully' as status;
