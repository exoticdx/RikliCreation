import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import CatalogueClient from '@/components/CatalogueClient';
import { processCategories } from '@/lib/categories';

export default async function Home() {
  const { data: rawCategories } = await supabase.from('Category').select('*');
  const { data: productsData } = await supabase.from('Product').select('*, category:Category(*)');
  const { data: fieldOptions } = await supabase.from('FieldOption').select('*');

  const categories = processCategories(rawCategories, fieldOptions, { includeHidden: false });
  const visibleCategoryIds = new Set(categories.map((c) => c.id));

  const products = (productsData || [])
    .map((p) => ({
      ...p,
      category: Array.isArray(p.category) ? p.category[0] : p.category,
    }))
    .filter((p) => !p.categoryId || visibleCategoryIds.has(p.categoryId));

  return (
    <main className="min-h-screen bg-black text-brand font-sans">
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <CatalogueClient initialCategories={categories} initialProducts={products} fieldOptions={fieldOptions || []} />
      </Suspense>
    </main>
  );
}
