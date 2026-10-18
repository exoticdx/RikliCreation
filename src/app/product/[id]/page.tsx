import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProductDetailClient from '@/components/ProductDetailClient';
import { STORE_CONFIG } from '@/config/store.config';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params;
  const { data: product } = await supabase
    .from('Product')
    .select('name, description, imageUrl, sku')
    .eq('id', id)
    .single();

  if (!product) {
    return {
      title: `Product Not Found | ${STORE_CONFIG.storeName}`,
    };
  }

  return {
    title: `${product.name} (SKU: ${product.sku}) | ${STORE_CONFIG.storeName}`,
    description: product.description || `View details and colors for ${product.name} on ${STORE_CONFIG.storeName}`,
    openGraph: {
      title: `${product.name} | ${STORE_CONFIG.storeName}`,
      description: product.description || undefined,
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  // Fetch product with Category
  const { data: productData, error } = await supabase
    .from('Product')
    .select('*, category:Category(*)')
    .eq('id', id)
    .single();

  if (error || !productData) {
    notFound();
  }

  const product = {
    ...productData,
    category: Array.isArray(productData.category) ? productData.category[0] : productData.category
  };

  // Fetch related products (same category or parent category)
  let relatedQuery = supabase
    .from('Product')
    .select('*, category:Category(*)')
    .neq('id', id)
    .limit(4);

  if (product.categoryId) {
    relatedQuery = relatedQuery.eq('categoryId', product.categoryId);
  }

  const { data: relatedData } = await relatedQuery;

  const relatedProducts = (relatedData || []).map(p => ({
    ...p,
    category: Array.isArray(p.category) ? p.category[0] : p.category
  }));

  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ProductDetailClient 
        product={product} 
        relatedProducts={relatedProducts} 
      />
    </Suspense>
  );
}
