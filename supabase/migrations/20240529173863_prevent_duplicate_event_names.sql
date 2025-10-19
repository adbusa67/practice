-- Clean up any duplicate events and add constraint to prevent duplicate event names

-- First, identify and remove duplicate events (keeping the one with ticket types)
WITH duplicate_events AS (
    SELECT name,
           array_agg(id ORDER BY (
               SELECT COUNT(*)
               FROM ticket_types tt
               WHERE tt.event_id = events.id
           ) DESC) as event_ids
    FROM events
    GROUP BY name
    HAVING COUNT(*) > 1
),
events_to_delete AS (
    SELECT unnest(event_ids[2:]) as id_to_delete
    FROM duplicate_events
)
DELETE FROM events
WHERE id IN (SELECT id_to_delete FROM events_to_delete);

-- Add unique constraint to prevent duplicate event names
ALTER TABLE events ADD CONSTRAINT unique_event_names UNIQUE (name);

-- Add comment explaining this constraint
COMMENT ON CONSTRAINT unique_event_names ON events IS 'Prevents duplicate event names which can confuse users and cause data integrity issues.';