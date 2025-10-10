-- Step 1: Add new role to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'admin_return_handler';