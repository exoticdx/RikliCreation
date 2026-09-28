import { supabase } from '@/lib/supabase';
import CatalogueClient from '@/components/CatalogueClient';

export default async function Home() {
  const { data: categories } = await supabase.from('Category').select('*');
  const { data: productsData } = await supabase.from('Product').select('*, category:Category(*)');
  const { data: fieldOptions } = await supabase.from('FieldOption').select('*');

  const products = productsData?.map(p => ({
    ...p,
    category: Array.isArray(p.category) ? p.category[0] : p.category
  })) || [];

  return (
    <main className="min-h-screen bg-black text-brand font-sans">
      <CatalogueClient initialCategories={categories || []} initialProducts={products} fieldOptions={fieldOptions || []} />
    </main>
  );
}
