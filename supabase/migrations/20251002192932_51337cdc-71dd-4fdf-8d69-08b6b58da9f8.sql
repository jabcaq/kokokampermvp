-- Add columns for storing links to handover, return and driver submission forms
ALTER TABLE contracts
ADD COLUMN handover_link TEXT,
ADD COLUMN return_link TEXT,
ADD COLUMN driver_submission_link TEXT;