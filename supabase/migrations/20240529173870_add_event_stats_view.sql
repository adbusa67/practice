-- Add capacity field to events table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'capacity') THEN
        ALTER TABLE events ADD COLUMN capacity integer DEFAULT 100;
    END IF;
END $$;

-- Update existing events with null capacity to have default capacity
UPDATE events SET capacity = 100 WHERE capacity IS NULL;

-- Add constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'check_capacity_positive') THEN
        ALTER TABLE events ADD CONSTRAINT check_capacity_positive CHECK (capacity >= 0);
    END IF;
END $$;

-- Create materialized view for event statistics
CREATE MATERIALIZED VIEW event_stats AS
SELECT 
    e.id as event_id,
    e.capacity,
    COALESCE(COUNT(r.id), 0) as registrations_count,
    e.capacity - COALESCE(COUNT(r.id), 0) as seats_remaining,
    MAX(r.registered_at) as last_registration_at
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
GROUP BY e.id, e.capacity;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_event_stats_event_id ON event_stats (event_id);

-- Simple function that uses Supabase's built-in logging
CREATE OR REPLACE FUNCTION refresh_event_stats_simple()
RETURNS void AS $$
BEGIN
    -- Refresh the materialized view
    REFRESH MATERIALIZED VIEW CONCURRENTLY event_stats;
    
    -- Log success (Supabase will capture this in logs)
    RAISE NOTICE 'Event stats refreshed successfully at %', NOW();
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error (Supabase will capture this in logs)
        RAISE WARNING 'Event stats refresh failed: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Simple function to test manually
CREATE OR REPLACE FUNCTION test_refresh_event_stats()
RETURNS text AS $$
BEGIN
    PERFORM refresh_event_stats_simple();
    RETURN 'Event stats refreshed successfully at ' || NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions on the materialized view
GRANT SELECT ON event_stats TO anon, authenticated;

-- Initial refresh of the materialized view
REFRESH MATERIALIZED VIEW event_stats;
