-- Add constraint requiring ticket_purchase_id for all registrations
-- This ensures every registration has a corresponding financial record

-- First, clean up any existing registrations without ticket_purchase_id
DELETE FROM registrations WHERE ticket_purchase_id IS NULL;

-- Add NOT NULL constraint to ticket_purchase_id
ALTER TABLE registrations ALTER COLUMN ticket_purchase_id SET NOT NULL;

-- Add additional constraints for data integrity

-- Ensure ticket purchases have positive quantities
ALTER TABLE ticket_purchases ADD CONSTRAINT check_positive_quantity
CHECK (quantity > 0);

-- Ensure ticket purchases have non-negative amounts
ALTER TABLE ticket_purchases ADD CONSTRAINT check_non_negative_amount
CHECK (amount_paid >= 0);

-- Ensure payment status is valid
ALTER TABLE ticket_purchases ADD CONSTRAINT check_valid_payment_status
CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'));

-- Ensure payment method is valid
ALTER TABLE ticket_purchases ADD CONSTRAINT check_valid_payment_method
CHECK (payment_method IN ('free', 'stripe', 'paypal', 'cash', 'check'));

-- Ensure free tickets have zero amount and 'free' payment method
ALTER TABLE ticket_purchases ADD CONSTRAINT check_free_ticket_consistency
CHECK (
  (payment_method = 'free' AND amount_paid = 0) OR
  (payment_method != 'free' AND amount_paid > 0)
);

-- Ensure ticket types have non-negative prices
ALTER TABLE ticket_types ADD CONSTRAINT check_non_negative_price
CHECK (price >= 0);

-- Ensure ticket types have positive capacity if specified
ALTER TABLE ticket_types ADD CONSTRAINT check_positive_capacity
CHECK (capacity IS NULL OR capacity > 0);

-- Ensure events have valid date relationships
ALTER TABLE events ADD CONSTRAINT check_valid_event_times
CHECK (start_time < end_time);

-- Ensure events are not scheduled in the past (optional - comment out if you want historical data)
-- ALTER TABLE events ADD CONSTRAINT check_future_events
-- CHECK (date >= CURRENT_DATE);