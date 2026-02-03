-- Create Contacts table optimized for Cold Email (Instantly.ai)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    website TEXT,
    city TEXT,
    specialty TEXT NOT NULL, -- Field "Especialidad"
    personal_note TEXT, -- Field "Nota personal"
    source TEXT DEFAULT 'manual', -- 'manual', 'apollo', 'scraper'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate emails to keep clean list
    CONSTRAINT unique_contact_email UNIQUE (email)
);

-- Index for fast searching
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_name);
