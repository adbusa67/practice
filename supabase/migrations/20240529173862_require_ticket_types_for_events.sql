-- Ensure every event has at least one ticket type
-- This prevents orphaned events that can't be registered for

-- First, add ticket types for any events that don't have them
-- (This should not be needed with proper seed data, but ensures safety)

-- Add a constraint function to check that events have ticket types
CREATE OR REPLACE FUNCTION check_event_has_ticket_types()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT operations on events, we can't check immediately since ticket_types
    -- will be inserted after the event. We'll rely on application logic for this.
    -- For DELETE operations on ticket_types, ensure we don't remove the last ticket type
    IF TG_OP = 'DELETE' THEN
        -- Check if this is the last ticket type for the event
        IF (SELECT COUNT(*) FROM ticket_types WHERE event_id = OLD.event_id AND id != OLD.id) = 0 THEN
            RAISE EXCEPTION 'Cannot delete the last ticket type for an event. Events must have at least one ticket type.';
        END IF;
        RETURN OLD;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add trigger to prevent deletion of last ticket type
CREATE TRIGGER prevent_last_ticket_type_deletion
    BEFORE DELETE ON ticket_types
    FOR EACH ROW
    EXECUTE FUNCTION check_event_has_ticket_types();

-- Add a check constraint that will be validated when needed
-- Note: We can't use a CHECK constraint directly because it would create a circular dependency
-- Instead, we'll document this as a business rule and enforce it in the application layer

-- Add a comment documenting this business rule
COMMENT ON TABLE events IS 'Business Rule: Every event must have at least one ticket type in the ticket_types table. This is enforced by application logic and the prevent_last_ticket_type_deletion trigger.';