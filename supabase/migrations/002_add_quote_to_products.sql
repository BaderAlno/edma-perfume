-- Migration to add quote columns to the products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS quote_en text,
ADD COLUMN IF NOT EXISTS quote_ar text;
