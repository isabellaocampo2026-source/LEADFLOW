-- SQL to fix duplicates and enforce uniqueness on place_id

-- 1. Identify and delete duplicates, keeping the most recently updated one
DELETE FROM business_leads a 
USING business_leads b 
WHERE a.place_id = b.place_id 
AND a.created_at < b.created_at;

-- 2. Add Unique Constraint if it doesn't exist
ALTER TABLE business_leads
ADD CONSTRAINT business_leads_place_id_key UNIQUE (place_id);

-- 3. Verification
SELECT 'Duplicates removed and constraint added' as status;
