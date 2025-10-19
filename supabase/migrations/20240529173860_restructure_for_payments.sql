-- Restructure ticketing system for payments
-- This migration creates a proper financial transaction model

-- 1. Rename tickets to ticket_types (pricing definitions)
ALTER TABLE tickets RENAME TO ticket_types;

-- 2. Drop the old ticket_sales table
DROP TABLE ticket_sales;

-- 3. Create new ticket_purchases table for financial transactions
CREATE TABLE ticket_purchases (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticket_type_id uuid NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
    quantity integer NOT NULL DEFAULT 1,
    amount_paid decimal(10,2) NOT NULL,
    payment_method text NOT NULL DEFAULT 'free',
    payment_status text NOT NULL DEFAULT 'completed',
    payment_reference text, -- Stripe payment intent ID, etc.
    purchased_at timestamp DEFAULT now(),

    -- Constraints
    CONSTRAINT ticket_purchases_quantity_positive CHECK (quantity > 0),
    CONSTRAINT ticket_purchases_amount_non_negative CHECK (amount_paid >= 0),
    CONSTRAINT ticket_purchases_payment_method_valid
        CHECK (payment_method IN ('free', 'stripe', 'paypal', 'manual')),
    CONSTRAINT ticket_purchases_payment_status_valid
        CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),

    -- Prevent duplicate purchases of same ticket type by same user
    UNIQUE(user_id, ticket_type_id)
);

-- 4. Add ticket_purchase_id to registrations table
ALTER TABLE registrations ADD COLUMN ticket_purchase_id uuid REFERENCES ticket_purchases(id) ON DELETE SET NULL;

-- 5. Create indexes for performance
CREATE INDEX idx_ticket_purchases_user_id ON ticket_purchases(user_id);
CREATE INDEX idx_ticket_purchases_ticket_type_id ON ticket_purchases(ticket_type_id);
CREATE INDEX idx_ticket_purchases_payment_status ON ticket_purchases(payment_status);
CREATE INDEX idx_registrations_ticket_purchase_id ON registrations(ticket_purchase_id);

-- 6. Add constraint to ensure paid registrations have purchases
-- (Allow NULL for free events, but if ticket_type has price > 0, must have purchase)
-- Note: This would be a complex check constraint, so we'll handle in application logic

-- 7. Update existing index names to reflect new table name
DROP INDEX IF EXISTS idx_tickets_event_id;
CREATE INDEX idx_ticket_types_event_id ON ticket_types(event_id);