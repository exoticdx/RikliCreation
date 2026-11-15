import { supabase } from '@/lib/supabase';
import AdminDashboard from './AdminDashboard';

export default async function AdminPage() {
  const { data: rawCategories } = await supabase.from('Category').select('*');
  const { data: productsData } = await supabase.from('Product').select('*, category:Category(*)');
  const { data: fieldOptions } = await supabase.from('FieldOption').select('*');
  
  // Resolve category order from FieldOption or order column
  const orderOpt = fieldOptions?.find(o => o.fieldKey === 'category_order');
  let categoryOrder: string[] = [];
  if (orderOpt?.value) {
    try {
      categoryOrder = JSON.parse(orderOpt.value);
    } catch {}
  }

  const categories = (rawCategories || []).map(cat => {
    const rawTags = cat.tags || fieldOptions?.find(o => o.fieldKey === `cat_tags_${cat.id}`)?.value || '';
    const parsedTags = Array.isArray(rawTags)
      ? rawTags
      : typeof rawTags === 'string' && rawTags.trim()
        ? rawTags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];

    return {
      ...cat,
      imageUrl: cat.imageUrl || fieldOptions?.find(o => o.fieldKey === `cat_img_${cat.id}`)?.value || '',
      tags: parsedTags
    };
  }).sort((a, b) => {
    if (categoryOrder.length > 0) {
      const idxA = categoryOrder.indexOf(a.id);
      const idxB = categoryOrder.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
    }
    if (a.order !== undefined && b.order !== undefined) {
      return (a.order || 0) - (b.order || 0);
    }
    return 0;
  });

  const products = productsData?.map(p => ({
    ...p,
    category: Array.isArray(p.category) ? p.category[0] : p.category
  })) || [];

  return <AdminDashboard categories={categories} products={products} fieldOptions={fieldOptions || []} />;
}
