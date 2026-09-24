import { supabase } from '@/lib/supabase';
import AdminDashboard from './AdminDashboard';

export default async function AdminPage() {
  const { data: categories } = await supabase.from('Category').select('*');
  const { data: productsData } = await supabase.from('Product').select('*, category:Category(*)');
  const { data: fieldOptions } = await supabase.from('FieldOption').select('*');
  
  const products = productsData?.map(p => ({
    ...p,
    category: Array.isArray(p.category) ? p.category[0] : p.category
  })) || [];

  return <AdminDashboard categories={categories || []} products={products} fieldOptions={fieldOptions || []} />;
}
