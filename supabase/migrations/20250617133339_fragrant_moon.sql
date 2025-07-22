/*
  # Add missing columns to customers table

  1. Changes
    - Add `billing_address` column (text, nullable)
    - Add `shipping_address` column (text, nullable) 
    - Add `birthday` column (date, nullable)
    - Add `secondary_phone` column (text, nullable)
    - Add `company_name` column (text, nullable)
    - Add `tags` column (text array, nullable)

  2. Notes
    - All new columns are nullable to maintain compatibility with existing data
    - Uses IF NOT EXISTS pattern to prevent errors if columns already exist
*/

-- Add billing_address column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'billing_address'
  ) THEN
    ALTER TABLE customers ADD COLUMN billing_address text;
  END IF;
END $$;

-- Add shipping_address column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'shipping_address'
  ) THEN
    ALTER TABLE customers ADD COLUMN shipping_address text;
  END IF;
END $$;

-- Add birthday column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'birthday'
  ) THEN
    ALTER TABLE customers ADD COLUMN birthday date;
  END IF;
END $$;

-- Add secondary_phone column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'secondary_phone'
  ) THEN
    ALTER TABLE customers ADD COLUMN secondary_phone text;
  END IF;
END $$;

-- Add company_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE customers ADD COLUMN company_name text;
  END IF;
END $$;

-- Add tags column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'tags'
  ) THEN
    ALTER TABLE customers ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;