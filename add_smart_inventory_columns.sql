-- SQL to add Smart Inventory enhancement columns to the materials table
-- Run this in your Supabase SQL Editor

-- First, create categories table
CREATE TABLE IF NOT EXISTS public.material_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample categories
INSERT INTO public.material_categories (name, description) VALUES
('Paper & Cardboard', 'All types of paper and cardboard materials'),
('Printing Inks', 'Offset printing inks and related chemicals'),
('Chemicals', 'Printing chemicals and solvents'),
('Plates & Films', 'Printing plates and photographic films'),
('Binding Materials', 'Materials for book binding and finishing'),
('Maintenance', 'Machine maintenance and cleaning supplies')
ON CONFLICT (name) DO NOTHING;

-- Insert sample suppliers
INSERT INTO public.suppliers (name, contact_person, email, phone, address) VALUES
('Paper Solutions Ltd', 'John Smith', 'john@papersolutions.com', '+91-9876543210', 'Mumbai, Maharashtra'),
('Ink Master Industries', 'Priya Sharma', 'priya@inkmaster.com', '+91-9876543211', 'Delhi, India'),
('Chemical Supply Co', 'Raj Patel', 'raj@chemicalsupply.com', '+91-9876543212', 'Gujarat, India'),
('Plate Tech Systems', 'Anita Kumar', 'anita@platetech.com', '+91-9876543213', 'Chennai, Tamil Nadu'),
('Binding Express', 'Suresh Reddy', 'suresh@bindingexpress.com', '+91-9876543214', 'Hyderabad, Telangana'),
('Maintenance Pro', 'Deepak Gupta', 'deepak@maintenancepro.com', '+91-9876543215', 'Bangalore, Karnataka');

-- Add missing columns for Smart Inventory functionality (only the ones not already in your schema)
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS supplier VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_restocked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Note: We're not adding current_stock and reorder_point because your table already has 
-- current_quantity and minimum_stock_level which serve the same purpose

-- Update foreign key constraints (if they don't already exist)
DO $$
BEGIN
  -- Add foreign key constraint for category_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'materials_category_id_fkey' 
    AND table_name = 'materials'
  ) THEN
    ALTER TABLE public.materials 
    ADD CONSTRAINT materials_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES public.material_categories(id);
  END IF;

  -- Add foreign key constraint for supplier_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'materials_supplier_id_fkey' 
    AND table_name = 'materials'
  ) THEN
    ALTER TABLE public.materials 
    ADD CONSTRAINT materials_supplier_id_fkey 
    FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);
  END IF;
END
$$;

-- Add some sample data to test the Smart Inventory system
-- First, update category_id and supplier_id with actual references
UPDATE public.materials 
SET 
  category_id = (SELECT id FROM public.material_categories ORDER BY RANDOM() LIMIT 1),
  supplier_id = (SELECT id FROM public.suppliers ORDER BY RANDOM() LIMIT 1)
WHERE category_id IS NULL OR supplier_id IS NULL;

-- Then update other fields (using existing column names)
UPDATE public.materials 
SET 
  unit = CASE 
    WHEN unit IS NULL THEN unit_of_measurement
    ELSE unit 
  END,
  price_per_unit = CASE 
    WHEN price_per_unit IS NULL OR price_per_unit = 0 THEN cost_per_unit
    ELSE price_per_unit 
  END,
  supplier = CASE 
    WHEN supplier IS NULL THEN 'Default Supplier'
    ELSE supplier 
  END,
  category = CASE 
    WHEN category IS NULL THEN 'General'
    ELSE category 
  END;

-- Create inventory_adjustments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  adjustment_type VARCHAR(20) CHECK (adjustment_type IN ('add', 'remove', 'transfer')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  adjusted_by UUID, -- Can reference auth.users if needed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_materials table if it doesn't exist (for usage tracking)
CREATE TABLE IF NOT EXISTS public.order_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  order_id UUID, -- Reference to orders table if it exists
  quantity_used INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add some sample usage data for demonstration
-- (This will help the Smart Inventory system calculate usage rates)
INSERT INTO public.order_materials (material_id, quantity_used, created_at)
SELECT 
  id,
  FLOOR(RANDOM() * 10) + 1,  -- Random usage between 1-10
  NOW() - (RANDOM() * INTERVAL '30 days')  -- Random date within last 30 days
FROM public.materials
WHERE id IN (SELECT id FROM public.materials LIMIT 3);  -- Sample for first 3 materials

-- Verify the new structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'materials' 
AND table_schema = 'public'
ORDER BY ordinal_position;
