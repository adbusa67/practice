-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the materialized view refresh to run every 30 seconds
SELECT cron.schedule(
    'refresh-event-stats',
    '*/30 * * * * *',  -- Every 30 seconds
    'SELECT refresh_event_stats_simple();'
);

-- Create a function to check cron job status
CREATE OR REPLACE FUNCTION get_event_stats_cron_status()
RETURNS TABLE (
    jobid bigint,
    schedule text,
    command text,
    nodename text,
    nodeport integer,
    database text,
    username text,
    active boolean,
    jobname text
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM cron.job 
    WHERE jobname = 'refresh-event-stats';
END;
$$ LANGUAGE plpgsql;
