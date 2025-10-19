-- Create the organizers table
CREATE TABLE organizers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    contact_info text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Create the events table
CREATE TABLE events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    date timestamp NOT NULL,
    location text NOT NULL,
    description text,
    time time NOT NULL,
    venue text NOT NULL,
    organizer_id uuid REFERENCES organizers(id),
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Create the registrations table
CREATE TABLE registrations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id uuid REFERENCES events(id),
    user_id uuid REFERENCES auth.users(id),
    registered_at timestamp DEFAULT now(),
    UNIQUE (event_id, user_id)
);