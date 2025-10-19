-- Create organizations table
CREATE TABLE organizations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('nonprofit', 'business', 'government', 'community')),
    contact_email text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    UNIQUE(name, type)
);

-- Add organization_id to organizers table
ALTER TABLE organizers ADD COLUMN organization_id uuid REFERENCES organizations(id);

-- Create index for performance
CREATE INDEX idx_organizers_organization_id ON organizers(organization_id);