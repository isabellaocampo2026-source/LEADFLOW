-- Add sender_phone column to reports table
-- Use this to store the "Expected WhatsApp Number" for the campaign
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS sender_phone TEXT;

-- Comment on column
COMMENT ON COLUMN reports.sender_phone IS 'The WhatsApp phone number (e.g., +57300...) that should be used to send messages for this campaign.';
