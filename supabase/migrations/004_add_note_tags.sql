-- Migration: 004_add_note_tags.sql
-- Description: Adds top_notes, heart_notes, and base_notes text arrays to the products table to support robust filtering.

ALTER TABLE products
ADD COLUMN IF NOT EXISTS top_notes text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS heart_notes text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS base_notes text[] DEFAULT '{}'::text[];

-- (Optional) Create some generalized indexes over the arrays for super fast array intersecting queries:
CREATE INDEX IF NOT EXISTS idx_products_top_notes ON products USING GIN (top_notes);
CREATE INDEX IF NOT EXISTS idx_products_heart_notes ON products USING GIN (heart_notes);
CREATE INDEX IF NOT EXISTS idx_products_base_notes ON products USING GIN (base_notes);
