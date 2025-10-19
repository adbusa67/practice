-- Add atomic registration function that handles both ticket purchase and registration
-- This ensures financial integrity by preventing orphaned payments

CREATE OR REPLACE FUNCTION register_user_for_event(
    p_user_id uuid,
    p_event_id uuid,
    p_ticket_type_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_ticket_price decimal;
    v_purchase_id uuid;
    v_registration_id uuid;
    v_payment_method text;
    v_payment_reference text;
BEGIN
    -- Get ticket type details
    SELECT price INTO v_ticket_price
    FROM ticket_types
    WHERE id = p_ticket_type_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ticket type not found';
    END IF;

    -- Determine payment method and reference
    IF v_ticket_price = 0 THEN
        v_payment_method := 'free';
        v_payment_reference := NULL;
    ELSE
        v_payment_method := 'stripe';
        v_payment_reference := 'pi_' || EXTRACT(EPOCH FROM NOW())::bigint;
    END IF;

    -- Start transaction (implicit in function)
    -- Create ticket purchase
    INSERT INTO ticket_purchases (
        user_id,
        ticket_type_id,
        quantity,
        amount_paid,
        payment_method,
        payment_status,
        payment_reference
    ) VALUES (
        p_user_id,
        p_ticket_type_id,
        1,
        v_ticket_price,
        v_payment_method,
        'completed',
        v_payment_reference
    ) RETURNING id INTO v_purchase_id;

    -- Create registration linked to purchase
    INSERT INTO registrations (
        user_id,
        event_id,
        ticket_purchase_id
    ) VALUES (
        p_user_id,
        p_event_id,
        v_purchase_id
    ) RETURNING id INTO v_registration_id;

    -- Return success with IDs
    RETURN jsonb_build_object(
        'success', true,
        'purchase_id', v_purchase_id,
        'registration_id', v_registration_id,
        'amount_paid', v_ticket_price,
        'payment_method', v_payment_method
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Any error will automatically rollback the transaction
        RAISE EXCEPTION 'Registration failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Add atomic unregistration function that handles refunds properly
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

-- Add comments explaining the functions
COMMENT ON FUNCTION register_user_for_event IS 'Atomically creates ticket purchase and registration to prevent orphaned financial records';
COMMENT ON FUNCTION unregister_user_from_event IS 'Atomically removes registration and marks purchase as refunded for proper financial audit trail';