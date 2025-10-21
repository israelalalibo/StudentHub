import { createClient } from '@supabase/supabase-js'
//import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


//Added security loaded from env file
//const supabaseUrl = process.env.SUPABASE_URL
const supabaseUrl = 'https://bfpaawywaljnfudynnke.supabase.co'
//const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmcGFhd3l3YWxqbmZ1ZHlubmtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU1NTAxOCwiZXhwIjoyMDc0MTMxMDE4fQ.B5ubNYjTV4j5N4aXsIpepYBOBPbEAx0n1vRmFPkroMo' 
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase 
