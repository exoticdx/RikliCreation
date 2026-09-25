const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://qrulvfovtqtnqgvavoue.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydWx2Zm92dHF0bnFndmF2b3VlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI1MjI4MSwiZXhwIjoyMTA1ODI4MjgxfQ.LdOkhvWm4JkgDMynN7Irk3zfYfjt_9bQfCBfDDiZ3i8'
);

async function test() {
  const { data, error } = await supabase.from('Category').select('*').limit(1);
  if (error) {
    console.error('Connection failed:', error.message);
    process.exit(1);
  } else {
    console.log('Connection successful! Tables are ready. Data:', data);
  }
}
test();
