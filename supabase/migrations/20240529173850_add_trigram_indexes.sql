-- Enable pg_trgm extension for trigram indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram GIN indexes on the searched columns
CREATE INDEX idx_events_name_trgm ON events USING GIN (name gin_trgm_ops);
CREATE INDEX idx_events_description_trgm ON events USING GIN (description gin_trgm_ops);
CREATE INDEX idx_events_location_trgm ON events USING GIN (location gin_trgm_ops);
CREATE INDEX idx_events_venue_trgm ON events USING GIN (venue gin_trgm_ops);
