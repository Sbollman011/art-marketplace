-- Add shipping and notes fields to orders table
ALTER TABLE orders
ADD COLUMN shipping_address TEXT,
ADD COLUMN order_notes TEXT;

-- Create index for quick lookups
CREATE INDEX idx_orders_created ON orders(created_at DESC);
