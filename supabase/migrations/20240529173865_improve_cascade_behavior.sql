-- Improve cascade behavior for better transactional integrity
-- Since we now handle refunds properly in the unregister function,
-- we can keep the current ON DELETE SET NULL behavior but add some constraints

-- Add constraint to prevent orphaned registrations (registrations without purchases)
-- This is now enforced by our NOT NULL constraint from earlier migration

-- Add index for better performance on foreign key lookups
CREATE INDEX IF NOT EXISTS idx_registrations_ticket_purchase_id ON registrations(ticket_purchase_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_user_ticket_type ON ticket_purchases(user_id, ticket_type_id);

-- Add a trigger to log refunds for audit purposes
CREATE TABLE IF NOT EXISTS refund_audit_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_purchase_id uuid NOT NULL REFERENCES ticket_purchases(id),
    user_id uuid NOT NULL,
    event_id uuid NOT NULL,
    refunded_amount decimal(10,2) NOT NULL,
    refunded_at timestamp DEFAULT NOW(),
    refund_reason text DEFAULT 'User cancellation'
);

-- Create trigger function to log refunds
CREATE OR REPLACE FUNCTION log_refund()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log when payment_status changes to 'refunded'
    IF OLD.payment_status != 'refunded' AND NEW.payment_status = 'refunded' THEN
        INSERT INTO refund_audit_log (
            ticket_purchase_id,
            user_id,
            event_id,
            refunded_amount
        ) SELECT
            NEW.id,
            NEW.user_id,
            r.event_id,
            NEW.amount_paid
        FROM registrations r
        WHERE r.ticket_purchase_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically log refunds
DROP TRIGGER IF EXISTS trigger_log_refund ON ticket_purchases;
CREATE TRIGGER trigger_log_refund
    AFTER UPDATE ON ticket_purchases
    FOR EACH ROW
    EXECUTE FUNCTION log_refund();

-- Add comments
COMMENT ON TABLE refund_audit_log IS 'Audit trail for all refunded ticket purchases to maintain financial transparency';
COMMENT ON TRIGGER trigger_log_refund ON ticket_purchases IS 'Automatically logs refunds for financial audit and compliance';