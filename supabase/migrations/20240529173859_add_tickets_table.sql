-- Create tickets table for tiered pricing
CREATE TABLE tickets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tier_name text NOT NULL,
    price decimal(10,2) NOT NULL,
    capacity integer,
    description text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),

    -- Constraints
    CONSTRAINT tickets_price_positive CHECK (price >= 0),
    CONSTRAINT tickets_capacity_positive CHECK (capacity IS NULL OR capacity > 0),
    CONSTRAINT tickets_tier_name_not_empty CHECK (length(trim(tier_name)) > 0),

    -- Prevent duplicate tier names per event
    UNIQUE(event_id, tier_name)
);

-- Create index for performance
CREATE INDEX idx_tickets_event_id ON tickets(event_id);

-- Create tickets_sold tracking table (for capacity management)
CREATE TABLE ticket_sales (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quantity integer NOT NULL DEFAULT 1,
    purchased_at timestamp DEFAULT now(),

    -- Constraints
    CONSTRAINT ticket_sales_quantity_positive CHECK (quantity > 0),

    -- Prevent duplicate purchases (user can only buy each ticket type once)
    UNIQUE(ticket_id, user_id)
);

-- Create index for performance
CREATE INDEX idx_ticket_sales_ticket_id ON ticket_sales(ticket_id);
CREATE INDEX idx_ticket_sales_user_id ON ticket_sales(user_id);