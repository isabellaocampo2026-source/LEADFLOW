
-- Create the leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Core Lead Data
  title TEXT NOT NULL,
  price TEXT,
  location TEXT,
  description TEXT,
  
  -- Source Data (to prevent duplicate scraping)
  source TEXT NOT NULL, -- e.g. 'Zillow', 'Craigslist'
  external_id TEXT,     -- Unique ID on the platform
  url TEXT NOT NULL,
  
  -- Contact Info
  seller_name TEXT,
  seller_phone TEXT,
  
  -- Property Details
  area INTEGER, -- in sq meters
  bedrooms INTEGER,
  bathrooms INTEGER,
  stratum INTEGER, -- 1-6 for Colombia
  days_on_market INTEGER,
  posted_by TEXT, -- 'owner' or 'agent'
  
  -- CRM Status
  status TEXT DEFAULT 'new', -- new, contacted, interested, closed, archivied
  notes TEXT,
  
  -- Constraint to prevent duplicates
  UNIQUE(source, external_id)
);

-- Turn on Row Level Security (RLS) is good practice, 
-- but for this simple MVP we can leave it open or simple if you are the only user.
-- For now, we will enable it but allow all operations for authenticated users.
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" 
ON leads FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for anon (public) users for now (optional for strict dev)"
ON leads FOR ALL USING (true);