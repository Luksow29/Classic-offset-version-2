/*
  # Add designer_name column to orders table

  1. Changes
    - Add `designer_name` column to `orders` table
    - Column is nullable (text type) since it's optional based on design_needed flag
    - No default value needed as it's conditionally filled

  2. Notes
    - This column stores the name of the designer assigned to orders that require design work
    - Used in conjunction with the `design_needed` boolean column
*/

-- Add designer_name column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'designer_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN designer_name text;
  END IF;
END $$;