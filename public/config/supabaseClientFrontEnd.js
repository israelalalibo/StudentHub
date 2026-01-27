// public/config/supabaseClient.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://bfpaawywaljnfudynnke.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmcGFhd3l3YWxqbmZ1ZHlubmtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTUwMTgsImV4cCI6MjA3NDEzMTAxOH0.Q4m-ZfF0bJDOcqNtz4z0gtTB2MqlIcSEnKtB8sF2ocg"; 

const supabase2 = createClient(supabaseUrl, supabaseAnonKey);

export default supabase2;
