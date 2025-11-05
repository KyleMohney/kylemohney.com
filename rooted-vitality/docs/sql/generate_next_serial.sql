-- ═══════════════════════════════════════════════════════════════════════════
-- SQL: Generate Next Serial Number
-- ═══════════════════════════════════════════════════════════════════════════
-- This function generates the next serial number for clients or practitioners
-- Bypasses RLS since it's a server-side operation
-- Usage: SELECT generate_next_serial('client'); -- Returns 'C1', 'C2', etc.

CREATE OR REPLACE FUNCTION generate_next_serial(user_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    table_name TEXT;
    next_number INT;
    prefix CHAR(1);
    result TEXT;
BEGIN
    -- Validate input
    IF user_type NOT IN ('client', 'practitioner') THEN
        RAISE EXCEPTION 'Invalid user_type: %. Must be "client" or "practitioner"', user_type;
    END IF;
    
    -- Set table name and prefix
    IF user_type = 'client' THEN
        table_name := 'clients';
        prefix := 'C';
    ELSE
        table_name := 'practitioners';
        prefix := 'P';
    END IF;
    
    -- Count existing non-null serial numbers
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE serial_number IS NOT NULL', table_name)
    INTO next_number;
    
    -- Increment to get next number
    next_number := next_number + 1;
    
    -- Format result
    result := prefix || next_number;
    
    RETURN result;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION generate_next_serial(TEXT) TO anon, authenticated;

-- Test the function (uncomment to test):
-- SELECT generate_next_serial('client');
-- SELECT generate_next_serial('practitioner');
