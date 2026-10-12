-- Family play is a household-scoped document, updated under a household row lock.
CREATE TABLE IF NOT EXISTS familyplay (
    householdid integer PRIMARY KEY REFERENCES householdinfo(id) ON DELETE CASCADE,
    document text NOT NULL,
    CONSTRAINT familyplay_document_valid CHECK (jsonb_typeof(document::jsonb) = 'object')
);
