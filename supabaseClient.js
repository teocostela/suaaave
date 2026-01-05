import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gebjhbzooxppktjtjjvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlYmpoYnpvb3hwcGt0anRqanZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTk4MzQsImV4cCI6MjA4MzEzNTgzNH0.qzVVmYdGnXueUeJaQVxRg4FdYfIVnF_KnroOsN2syQM';

export const supabase = createClient(supabaseUrl, supabaseKey);
