require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function syncCats() {
  const cats = ['Cord Set', 'Kurties'];
  for (const name of cats) {
    const { data } = await supabase.from('Category').select('id').eq('name', name).single();
    if (!data) {
      const id = 'c' + Math.random().toString(36).substr(2, 9);
      await supabase.from('Category').insert([{ id, name }]);
      console.log('Inserted', name);
    } else {
      console.log('Exists', name);
    }
  }
}
syncCats();
