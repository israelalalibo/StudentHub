-- ============================================
-- STRIPE INTEGRATION DATABASE SCHEMA
-- StudentHub E-Commerce Platform
-- ============================================

-- ============================================
-- 1. ADD BALANCE TO STUDENT TABLE
-- ============================================
-- This adds a balance column to track seller earnings

ALTER TABLE student 
ADD COLUMN IF NOT EXISTS balance DECIMAL(10, 2) DEFAULT 0.00;

ALTER TABLE student 
ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10, 2) DEFAULT 0.00;

ALTER TABLE student 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- ============================================
-- 2. ORDERS TABLE
-- Tracks all purchases made through the platform
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Order totals
    subtotal DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) DEFAULT 0.00,  -- Platform takes a percentage (e.g., 5%)
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Stripe payment info
    stripe_payment_intent_id TEXT,
    stripe_checkout_session_id TEXT,
    
    -- Order status: pending, paid, completed, cancelled, refunded
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',  -- unpaid, paid, failed, refunded
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Shipping/contact info (optional)
    buyer_email TEXT,
    buyer_name TEXT,
    notes TEXT
);

-- ============================================
-- 3. ORDER ITEMS TABLE
-- Individual items within an order
-- ============================================

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES "ProductTable"(product_id) ON DELETE SET NULL,
    seller_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Item details (snapshot at time of purchase)
    title TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    
    -- Seller payout tracking
    seller_amount DECIMAL(10, 2) NOT NULL,  -- Amount seller receives (price - platform fee)
    seller_paid BOOLEAN DEFAULT FALSE,
    seller_paid_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TRANSACTIONS TABLE
-- Tracks all money movements (payments, payouts, refunds)
-- ============================================

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Transaction type: payment, payout, refund, platform_fee
    type TEXT NOT NULL,
    
    -- Amount (positive for credits, negative for debits)
    amount DECIMAL(10, 2) NOT NULL,
    
    -- Reference to related order (if applicable)
    order_id UUID REFERENCES orders(order_id),
    order_item_id UUID REFERENCES order_items(order_item_id),
    
    -- Stripe reference
    stripe_reference TEXT,
    
    -- Description
    description TEXT,
    
    -- Status: pending, completed, failed
    status TEXT DEFAULT 'pending',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. PAYOUTS TABLE (For seller withdrawals)
-- ============================================

CREATE TABLE IF NOT EXISTS payouts (
    payout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    amount DECIMAL(10, 2) NOT NULL,
    
    -- Payout method and details
    payout_method TEXT,  -- bank_transfer, paypal, etc.
    payout_details JSONB,  -- Encrypted bank/paypal info
    
    -- Stripe payout reference
    stripe_payout_id TEXT,
    
    -- Status: pending, processing, completed, failed
    status TEXT DEFAULT 'pending',
    
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    notes TEXT
);

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);

-- ============================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Orders: Users can view their own orders (as buyer)
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = buyer_id);

-- Order Items: Users can view items from their orders or items they sold
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        auth.uid() IN (
            SELECT buyer_id FROM orders WHERE orders.order_id = order_items.order_id
        )
        OR auth.uid() = seller_id
    );

-- Transactions: Users can only view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Payouts: Users can only view their own payouts
CREATE POLICY "Users can view own payouts" ON payouts
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to update seller balance when order is paid
CREATE OR REPLACE FUNCTION update_seller_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- When an order item is marked as seller_paid
    IF NEW.seller_paid = TRUE AND OLD.seller_paid = FALSE THEN
        UPDATE student 
        SET 
            balance = balance + NEW.seller_amount,
            total_earnings = total_earnings + NEW.seller_amount
        WHERE id = NEW.seller_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update balance
DROP TRIGGER IF EXISTS trigger_update_seller_balance ON order_items;
CREATE TRIGGER trigger_update_seller_balance
    AFTER UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_seller_balance();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'order_items', 'transactions', 'payouts');

-- Check student table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'student' 
AND column_name IN ('balance', 'total_earnings', 'stripe_customer_id');

