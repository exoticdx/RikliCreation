'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize Cloudflare R2 Client
// These env vars will be needed in Vercel
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '', // e.g. https://<account_id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function uploadImageToR2(formData: FormData) {
  await checkAuth();
  
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    const bucketName = process.env.R2_BUCKET_NAME;
    const publicDomain = process.env.R2_PUBLIC_DOMAIN; // e.g. https://images.yourdomain.com

    if (!bucketName || !publicDomain) {
      throw new Error('Server configuration error: Cloudflare R2 environment variables are missing.');
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `product_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type || 'image/jpeg',
    });

    await r2Client.send(command);

    // Return the cached public URL
    const url = `${publicDomain.replace(/\/$/, '')}/${fileName}`;
    return { success: true, url };
  } catch (error: any) {
    console.error("R2 Upload error:", error);
    return { success: false, error: error.message || 'Failed to upload image' };
  }
}

// Helper to check authentication
async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'true') {
    throw new Error('Unauthorized');
  }
}

export async function loginAdmin(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  // If the env variable is not set, use a highly secure fallback during dev, or just reject
  // We recommend the user sets this in Vercel.
  if (!adminPassword) {
    throw new Error('Server configuration error: ADMIN_PASSWORD is not set.');
  }

  if (password === adminPassword) {
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
    return { success: true };
  } else {
    return { success: false, error: 'Incorrect password' };
  }
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  return { success: true };
}

export async function addCategory(name: string) {
  await checkAuth();
  const id = 'c' + Math.random().toString(36).substr(2, 9);
  await supabase.from('Category').insert([{ id, name }]);
  revalidatePath('/');
  revalidatePath('/riklicreationadminpafe2021222324');
}

export async function deleteCategory(id: string) {
  await checkAuth();
  await supabase.from('Product').delete().eq('categoryId', id);
  await supabase.from('Category').delete().eq('id', id);
  revalidatePath('/');
  revalidatePath('/riklicreationadminpafe2021222324');
}

export async function addProduct(data: { sku: string; name: string; description: string; imageUrl: string; categoryId: string; attributes?: any }) {
  await checkAuth();
  const id = 'p' + Math.random().toString(36).substr(2, 9);
  await supabase.from('Product').insert([{ id, ...data }]);
  revalidatePath('/');
  revalidatePath('/riklicreationadminpafe2021222324');
}

export async function updateProduct(id: string, data: { sku: string; name: string; description: string; imageUrl: string; categoryId: string; attributes?: any }) {
  await checkAuth();
  await supabase.from('Product').update(data).eq('id', id);
  revalidatePath('/');
  revalidatePath('/riklicreationadminpafe2021222324');
}

export async function deleteProduct(id: string) {
  await checkAuth();
  await supabase.from('Product').delete().eq('id', id);
  revalidatePath('/');
  revalidatePath('/riklicreationadminpafe2021222324');
}

export async function bulkAddProducts(items: { sku: string; name: string; imageUrl: string; categoryName: string; attributes?: any }[]) {
  await checkAuth();
  try {
    const { data: existingCategories } = await supabase.from('Category').select('id, name');
    const categoryMap = new Map((existingCategories || []).map(c => [c.name.toLowerCase().trim(), c.id]));

    const newCategoryNames = Array.from(new Set(items.map(i => i.categoryName.trim())))
      .filter(name => name && !categoryMap.has(name.toLowerCase()));

    if (newCategoryNames.length > 0) {
      const newCategories = newCategoryNames.map(name => ({
        id: 'c' + Math.random().toString(36).substr(2, 9),
        name
      }));
      await supabase.from('Category').insert(newCategories);
      newCategories.forEach(c => categoryMap.set(c.name.toLowerCase(), c.id));
    }

    const { data: existingProducts } = await supabase.from('Product').select('sku');
    const existingSkus = new Set((existingProducts || []).map(p => p.sku));

    const productsToInsert = items
      .filter(item => !existingSkus.has(item.sku))
      .map(item => ({
        id: 'p' + Math.random().toString(36).substr(2, 9),
        sku: item.sku,
        name: item.name,
        description: '', // default to empty
        imageUrl: item.imageUrl || '',
        categoryId: categoryMap.get(item.categoryName.trim().toLowerCase()),
        attributes: item.attributes || {}
      }));

    if (productsToInsert.length > 0) {
      const { error } = await supabase.from('Product').insert(productsToInsert);
      if (error) throw error;
    }

    revalidatePath('/');
    revalidatePath('/riklicreationadminpafe2021222324');
    
    return { 
      success: true, 
      addedProducts: productsToInsert.length, 
      skippedProducts: items.length - productsToInsert.length,
      newCategoriesCount: newCategoryNames.length 
    };
  } catch (error: any) {
    console.error("Bulk upload error:", error);
    return { success: false, error: error.message || 'Failed to upload products' };
  }
}

export async function addFieldOption(fieldKey: string, value: string) {
  await checkAuth();
  const id = 'o' + Math.random().toString(36).substr(2, 9);
  await supabase.from('FieldOption').insert([{ id, fieldKey, value }]);
  revalidatePath('/');
  revalidatePath('/riklicreationadminpafe2021222324');
}

export async function deleteFieldOption(id: string, fieldKey: string, value: string) {
  await checkAuth();
  
  // First delete the option
  await supabase.from('FieldOption').delete().eq('id', id);
  
  // Delete all products that have this specific attribute value
  const { data: products } = await supabase.from('Product').select('id, attributes');
  
  if (products) {
    const productsToDelete = products.filter(p => p.attributes && p.attributes[fieldKey] === value);
    for (const p of productsToDelete) {
      await supabase.from('Product').delete().eq('id', p.id);
    }
  }

  revalidatePath('/');
  revalidatePath('/riklicreationadminpafe2021222324');
}

export async function getUploadUrl(fileName: string, fileType: string) {
  await checkAuth();
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  if (!bucketName || !publicDomain) {
    throw new Error('R2 missing');
  }
  const fileExt = fileName.split('.').pop() || 'jpg';
  const newFileName = `product_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: newFileName,
    ContentType: fileType,
  });
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
  const finalUrl = `${publicDomain.replace(/\/$/, '')}/${newFileName}`;
  return { success: true, uploadUrl, finalUrl };
}
