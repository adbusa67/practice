-- Fix the unregister function to remove reference to non-existent updated_at column
CREATE OR REPLACE FUNCTION unregister_user_from_event(
    p_user_id uuid,
    p_event_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_purchase_id uuid;
    v_amount_paid decimal;
    v_payment_method text;
BEGIN
    -- Get the ticket purchase info before deleting registration
    SELECT tp.id, tp.amount_paid, tp.payment_method
    INTO v_purchase_id, v_amount_paid, v_payment_method
    FROM registrations r
    JOIN ticket_purchases tp ON r.ticket_purchase_id = tp.id
    WHERE r.user_id = p_user_id AND r.event_id = p_event_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration not found';
    END IF;

    -- Delete registration (this will be atomic with the update below)
    DELETE FROM registrations
    WHERE user_id = p_user_id AND event_id = p_event_id;

    -- Mark ticket purchase as refunded (maintains financial audit trail)
    -- For free tickets, this is just a status update
    -- For paid tickets, this indicates a refund should be processed
    UPDATE ticket_purchases
    SET payment_status = 'refunded'
    WHERE id = v_purchase_id;

    -- Return info about what was refunded
    RETURN jsonb_build_object(
        'success', true,
        'refunded_amount', v_amount_paid,
        'payment_method', v_payment_method,
        'purchase_id', v_purchase_id
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Any error will automatically rollback the transaction
        RAISE EXCEPTION 'Unregistration failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;