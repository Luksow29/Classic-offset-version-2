-- SQL Query to check the structure of the materials table
-- Run this in your Supabase SQL Editor to see what columns exist

-- 1. Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'materials' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Sample the first few rows to see actual data
SELECT * FROM public.materials LIMIT 5;

-- 3. Check if the enhancement columns were added
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' 
    AND column_name = 'reorder_point'
    AND table_schema = 'public'
) as has_reorder_point,
EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' 
    AND column_name = 'supplier'
    AND table_schema = 'public'
) as has_supplier,
EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' 
    AND column_name = 'last_restocked'
    AND table_schema = 'public'
) as has_last_restocked;

-- 4. Check what the primary identifier column is called
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'materials' 
AND table_schema = 'public'
AND (column_name LIKE '%id%' OR column_name LIKE '%name%' OR column_name LIKE '%title%')
ORDER BY ordinal_position;
