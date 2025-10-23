-- Add new columns to vehicle_returns for tracking deposit refund and review request
ALTER TABLE vehicle_returns 
ADD COLUMN IF NOT EXISTS deposit_refunded_transfer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_refund_timestamp timestamp with time zone,
ADD COLUMN IF NOT EXISTS review_request_sent boolean DEFAULT false;

-- Create index for efficient querying by cron job
CREATE INDEX IF NOT EXISTS idx_vehicle_returns_review_pending 
ON vehicle_returns(deposit_refund_timestamp, review_request_sent) 
WHERE review_request_sent = false;