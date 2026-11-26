'use client';

import React, { useState, useRef, useEffect } from 'react';
import { addCategory, updateCategory, deleteCategory, reorderCategories, toggleCategoryVisibility, addProduct, updateProduct, deleteProduct, bulkAddProducts, logoutAdmin, addFieldOption, deleteFieldOption } from '../actions';
import { Trash2, Plus, Upload, Download, AlertCircle, LogOut, X, Edit, Link as LinkIcon, Copy, Layers, Image as ImageIcon, ChevronUp, ChevronDown, GripVertical, Star, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import ExcelJS from 'exceljs';
import toast from 'react-hot-toast';
import { STORE_CONFIG } from '@/config/store.config';
import { useRouter } from 'next/navigation';

export default function AdminDashboard({ categories: initialCategories, products, fieldOptions = [] }: { categories: any[], products: any[], fieldOptions?: any[] }) {
  const router = useRouter();
  
  // Category management & reordering state
  const [categories, setCategories] = useState<any[]>(initialCategories);
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const [isReordering, setIsReordering] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState('');
  const [newCategoryTags, setNewCategoryTags] = useState('');
  const [newCategoryHidden, setNewCategoryHidden] = useState(false);
  const [togglingVisibilityId, setTogglingVisibilityId] = useState<string | null>(null);
  const [isUploadingCatImage, setIsUploadingCatImage] = useState(false);
  
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  const [newProduct, setNewProduct] = useState({
    sku: '', name: '', description: '', categoryId: '', attributes: {} as Record<string, any>
  });
  
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  type ConfirmDeleteState = {
    type: 'category' | 'product' | 'fieldOption';
    id: string;
    name: string;
    productCount?: number;
    extraData?: any;
  } | null;

  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>(null);
  
  // State for adding new field options (keyed by field.key)
  const [newFieldOptions, setNewFieldOptions] = useState<Record<string, string>>({});

  const [activeTab, setActiveTab] = useState<'products' | 'bulk' | 'settings'>('products');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [generatedUrls, setGeneratedUrls] = useState<{name: string, url: string}[]>([]);
  const [isGeneratingUrls, setIsGeneratingUrls] = useState(false);

  const handleLogout = async () => {
    await logoutAdmin();
    toast.success('Logged out successfully');
    router.push('/riklicreationloginpafe2021222324');
  };

  const uploadFileDirect = async (file: File): Promise<string> => {
    // 1. Try presigned direct upload first
    try {
      const { getUploadUrl } = await import('@/app/actions');
      const res = await getUploadUrl(file.name, file.type);
      if (res?.success && res.uploadUrl && res.finalUrl) {
        const uploadRes = await fetch(res.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        });
        if (uploadRes.ok) {
          return res.finalUrl;
        }
      }
    } catch (presignedErr) {
      console.warn('Presigned direct upload failed or blocked by CORS, falling back to /api/upload...', presignedErr);
    }

    // 2. Seamless fallback to /api/upload (same-origin, immune to browser CORS and CSRF blocks)
    const formData = new FormData();
    formData.append('file', file);
    const apiRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!apiRes.ok) {
      const errJson = await apiRes.json().catch(() => ({}));
      throw new Error(errJson.error || `Upload failed with status ${apiRes.status}`);
    }

    const data = await apiRes.json();
    if (!data.success || !data.url) {
      throw new Error(data.error || 'Failed to upload image');
    }

    return data.url;
  };

  const handleGenerateUrls = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsGeneratingUrls(true);
    const t = toast.loading(`Generating URLs for ${files.length} image(s)...`);
    
    try {
      const newUrls: {name: string, url: string}[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const finalUrl = await uploadFileDirect(file);
          newUrls.push({ name: file.name, url: finalUrl });
        } catch (fileErr: any) {
          toast.error(`Failed to upload ${file.name}: ${fileErr.message}`);
        }
      }
      
      if (newUrls.length > 0) {
        setGeneratedUrls(prev => [...prev, ...newUrls]);
        toast.success(`Generated ${newUrls.length} URL(s)!`, { id: t });
      }
    } catch (err: any) {
      toast.error(err.message, { id: t });
    } finally {
      setIsGeneratingUrls(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploadingImage(true);
    const t = toast.loading(`Uploading ${files.length} image(s)...`);
    
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const finalUrl = await uploadFileDirect(file);
          uploadedUrls.push(finalUrl);
        } catch (fileErr: any) {
          toast.error(`Failed to upload ${file.name}: ${fileErr.message}`);
        }
      }
      
      if (uploadedUrls.length > 0) {
        setImageUrls(prev => [...prev, ...uploadedUrls]);
        toast.success(`Uploaded ${uploadedUrls.length} image(s)!`, { id: t });
      }
    } catch (err: any) {
      toast.error(err.message, { id: t });
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleCategoryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCatImage(true);
    const t = toast.loading('Uploading category image...');

    try {
      const finalUrl = await uploadFileDirect(file);
      setNewCategoryImage(finalUrl);
      toast.success('Category photo uploaded!', { id: t });
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image', { id: t });
    } finally {
      setIsUploadingCatImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImageUrls(prev => {
      const selected = prev[index];
      const rest = prev.filter((_, idx) => idx !== index);
      return [selected, ...rest];
    });
    toast.success('Set as primary cover image');
  };

  const handleMoveImage = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    setImageUrls(prev => {
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, item);
      return copy;
    });
  };

  const handleEditCategoryClick = (category: any) => {
    setEditingCategoryId(category.id);
    setNewCategoryName(category.name);
    setNewCategoryImage(category.imageUrl || '');
    const tagsStr = Array.isArray(category.tags) ? category.tags.join(', ') : (category.tags || '');
    setNewCategoryTags(tagsStr);
    setNewCategoryHidden(Boolean(category.isHidden));
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setNewCategoryName('');
    setNewCategoryImage('');
    setNewCategoryTags('');
    setNewCategoryHidden(false);
  };

  const handleSaveCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error('Please enter a category name');
      return;
    }
    const t = toast.loading(editingCategoryId ? 'Updating category...' : 'Adding category...');
    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, trimmed, newCategoryImage, newCategoryTags, newCategoryHidden);
        toast.success('Category updated successfully', { id: t });
      } else {
        await addCategory(trimmed, newCategoryImage, newCategoryTags, newCategoryHidden);
        toast.success('Category added successfully', { id: t });
      }
      setEditingCategoryId(null);
      setNewCategoryName('');
      setNewCategoryImage('');
      setNewCategoryTags('');
      setNewCategoryHidden(false);
    } catch {
      toast.error(editingCategoryId ? 'Failed to update category' : 'Failed to add category', { id: t });
    }
  };

  const handleToggleCategoryVisibility = async (category: any) => {
    const nextHidden = !category.isHidden;
    const prevCategories = categories;
    setCategories(prev => prev.map(c => (c.id === category.id ? { ...c, isHidden: nextHidden } : c)));
    setTogglingVisibilityId(category.id);

    try {
      await toggleCategoryVisibility(category.id, nextHidden);
      if (editingCategoryId === category.id) {
        setNewCategoryHidden(nextHidden);
      }
      toast.success(nextHidden ? `"${category.name}" hidden from user panel` : `"${category.name}" is now visible on user panel`);
    } catch {
      setCategories(prevCategories);
      toast.error('Failed to update category visibility');
    } finally {
      setTogglingVisibilityId(null);
    }
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newList = [...categories];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    setCategories(newList);
    setIsReordering(true);
    try {
      await reorderCategories(newList.map(c => c.id));
      toast.success('Category order updated', { duration: 1500 });
    } catch {
      setCategories(categories);
      toast.error('Failed to update category order');
    } finally {
      setIsReordering(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newList = [...categories];
    const [draggedItem] = newList.splice(draggedIndex, 1);
    newList.splice(dropIndex, 0, draggedItem);

    setCategories(newList);
    setDraggedIndex(null);
    setIsReordering(true);
    try {
      await reorderCategories(newList.map(c => c.id));
      toast.success('Categories reordered successfully', { duration: 1500 });
    } catch {
      setCategories(categories);
      toast.error('Failed to save category order');
    } finally {
      setIsReordering(false);
    }
  };

  const handleAddFieldOption = async (fieldKey: string) => {
    const val = newFieldOptions[fieldKey]?.trim();
    if (!val) {
      toast.error('Please enter an option value');
      return;
    }
    const exists = fieldOptions?.some(o => o.fieldKey === fieldKey && o.value.toLowerCase() === val.toLowerCase());
    if (exists) {
      toast.error('Option already exists');
      return;
    }
    
    const t = toast.loading('Adding option...');
    try {
      await addFieldOption(fieldKey, val);
      setNewFieldOptions(prev => ({ ...prev, [fieldKey]: '' }));
      toast.success('Option added', { id: t });
    } catch {
      toast.error('Failed to add option', { id: t });
    }
  };

  const handleDeleteFieldOption = (id: string, fieldKey: string, value: string) => {
    const affectedProducts = products.filter(p => p.attributes && p.attributes[fieldKey] === value);
    if (affectedProducts.length > 0) {
      setConfirmDelete({
        type: 'fieldOption',
        id,
        name: value,
        productCount: affectedProducts.length,
        extraData: { fieldKey }
      });
    } else {
      executeDeleteFieldOption(id, fieldKey, value);
    }
  };

  const executeDeleteFieldOption = async (id: string, fieldKey: string, value: string) => {
    const t = toast.loading('Deleting option...');
    try {
      await deleteFieldOption(id, fieldKey, value);
      toast.success('Option deleted', { id: t });
    } catch {
      toast.error('Failed to delete option', { id: t });
    }
    setConfirmDelete(null);
  };

  const handleAddProduct = async () => {
    const trimmedSku = newProduct.sku.trim();
    const trimmedName = newProduct.name.trim();

    if (!trimmedName || !trimmedSku || !newProduct.categoryId) {
      toast.error('Please fill required fields: SKU, Name, and Category');
      return;
    }

    const isDuplicate = products.some(
      (p) => p.sku?.trim().toLowerCase() === trimmedSku.toLowerCase() && p.id !== editingProductId
    );
    if (isDuplicate) {
      toast.error(`SKU "${trimmedSku}" is already in use by another product`);
      return;
    }

    const t = toast.loading(editingProductId ? 'Updating product...' : 'Adding product...');
    try {
      const finalAttributes = { ...newProduct.attributes };
      
      const primaryImg = imageUrls[0] || '';
      if (imageUrls.length > 1) {
        finalAttributes.gallery = imageUrls.slice(1);
      } else {
        delete finalAttributes.gallery;
      }

      if (editingProductId) {
        await updateProduct(editingProductId, {
          sku: trimmedSku,
          name: trimmedName,
          description: newProduct.description,
          imageUrl: primaryImg,
          categoryId: newProduct.categoryId,
          attributes: finalAttributes
        });
      } else {
        await addProduct({
          sku: trimmedSku,
          name: trimmedName,
          description: newProduct.description,
          imageUrl: primaryImg,
          categoryId: newProduct.categoryId,
          attributes: finalAttributes
        });
      }
      
      const initialAttrs: any = {}; 
      STORE_CONFIG.customFields.forEach(f => { 
        if (f.defaultValue !== undefined) initialAttrs[f.key] = f.defaultValue; 
      }); 
      setNewProduct({ sku: '', name: '', description: '', categoryId: '', attributes: initialAttrs });
      setImageUrls([]);
      setEditingProductId(null);
      setIsAddProductOpen(false);
      toast.success(editingProductId ? 'Product updated' : 'Product added', { id: t });
    } catch (err: any) {
      toast.error(err?.message || (editingProductId ? 'Failed to update product' : 'Failed to add product'), { id: t });
    }
  };

  const handleEditClick = (product: any) => {
    setEditingProductId(product.id);
    setNewProduct({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId,
      attributes: product.attributes || {}
    });
    
    const urls = [];
    if (product.imageUrl) urls.push(product.imageUrl);
    if (product.attributes?.gallery && Array.isArray(product.attributes.gallery)) {
      urls.push(...product.attributes.gallery);
    }
    setImageUrls(urls);
    setIsAddProductOpen(true);
  };

  const handleDuplicateClick = (product: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Generate unique duplicate SKU with (copy)
    const baseSku = product.sku || '';
    let duplicateSku = `${baseSku} (copy)`.trim();
    if (products.some(p => p.sku.toLowerCase() === duplicateSku.toLowerCase())) {
      let counter = 2;
      while (products.some(p => p.sku.toLowerCase() === `${baseSku} (copy ${counter})`.toLowerCase())) {
        counter++;
      }
      duplicateSku = `${baseSku} (copy ${counter})`;
    }

    // Deep clone attributes, omitting gallery
    const clonedAttributes = product.attributes ? JSON.parse(JSON.stringify(product.attributes)) : {};
    delete clonedAttributes.gallery;

    setEditingProductId(null);
    setNewProduct({
      sku: duplicateSku,
      name: product.name || '',
      description: product.description || '',
      categoryId: product.categoryId || (product.category?.id || (categories[0]?.id || '')),
      attributes: clonedAttributes
    });

    // Clear photos so user can enter new photos
    setImageUrls([]);
    setIsAddProductOpen(true);
    toast.success(`Duplicated from ${baseSku}. Ready for photos!`, { duration: 3000 });
  };

  const handleDeleteCategory = (id: string, name: string) => {
    const productsInCategory = products.filter(p => p.categoryId === id || p.category?.id === id);
    setConfirmDelete({
      type: 'category',
      id,
      name,
      productCount: productsInCategory.length
    });
  };

  const handleDeleteProduct = (id: string, sku: string) => {
    setConfirmDelete({
      type: 'product',
      id,
      name: sku
    });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    
    const { type, id, name, extraData } = confirmDelete;
    setConfirmDelete(null);

    if (type === 'category') {
      toast.promise(deleteCategory(id), {
        loading: 'Deleting category...',
        success: 'Category and its products deleted',
        error: 'Failed to delete category'
      });
    } else if (type === 'fieldOption') {
      executeDeleteFieldOption(id, extraData.fieldKey, name);
    } else {
      toast.promise(deleteProduct(id), {
        loading: 'Deleting product...',
        success: 'Product deleted',
        error: 'Failed to delete product'
      });
    }
  };

  const downloadTemplate = () => {
    window.location.href = '/api/export-template';
    toast.success('Downloading Excel template...');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const t = toast.loading('Parsing Excel file...');

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.getWorksheet('Products');
      
      if (!worksheet) {
        throw new Error("Could not find 'Products' sheet in the Excel file.");
      }

      const headers: Record<number, string> = {};
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value?.toString().replace(/\*/g, '').trim() || '';
      });

      const items: any[] = [];
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header

        const rowData: Record<string, any> = {};
        row.eachCell((cell, colNumber) => {
          const headerName = headers[colNumber];
          if (headerName) {
            if (cell.type === ExcelJS.ValueType.Hyperlink) {
              rowData[headerName] = cell.hyperlink;
            } else if (cell.value && typeof cell.value === 'object' && 'text' in cell.value) {
              rowData[headerName] = (cell.value as any).text;
            } else {
              rowData[headerName] = cell.value?.toString().trim();
            }
          }
        });

        const sku = rowData['SKU'];
        const name = rowData['Title'];
        const categoryName = rowData['Category'];
        const price = rowData['Price'] ? Number(rowData['Price']) : undefined;
        const description = rowData['Description'] || '';
        const sizes = rowData['Available Sizes'] || rowData['Sizes'] || '';
        const materialsDetail = rowData['Materials Detail'] || rowData['Material Details'] || rowData['Matierias Detail'] || '';
        
        // Extract up to 5 image URLs
        const gallery = [];
        for (let i = 1; i <= 5; i++) {
          const imgUrl = rowData[`Image URL ${i}`];
          if (imgUrl) gallery.push(imgUrl);
        }
        
        const imageUrl = gallery.length > 0 ? gallery[0] : '';

        if (!sku || !name || !categoryName) {
          // If the row is completely empty, skip it. If partially filled, throw error.
          if (!sku && !name && !categoryName) return;
          throw new Error(`Row ${rowNumber} missing required fields (SKU, Title, Category).`);
        }
        
        const attributes: any = {};
        if (sizes) {
          attributes.sizes = sizes;
        }
        if (materialsDetail) {
          attributes.materialsDetail = materialsDetail;
          attributes.material_details = materialsDetail;
        }
        if (price !== undefined) {
          attributes.price = price;
        }
        if (gallery.length > 1) {
          attributes.gallery = gallery.slice(1);
        }

        STORE_CONFIG.customFields.forEach(field => {
          const val = rowData[`Attr: ${field.label}`];
          if (val !== undefined && val !== '') {
            if (field.type === 'number') {
              attributes[field.key] = Number(val);
            } else if (field.type === 'boolean') {
              attributes[field.key] = val.toLowerCase() === 'true' || val.toLowerCase() === 'yes' || val === '1';
            } else {
              attributes[field.key] = val;
            }
          }
        });

        items.push({ sku, name, categoryName, imageUrl, attributes, description });
      });

      if (items.length === 0) throw new Error("The Excel file is empty.");

      toast.loading('Uploading products...', { id: t });
      const result = await bulkAddProducts(items);
      
      if (result.success) {
        toast.success(`Added ${result.addedProducts} products, created ${result.newCategoriesCount} categories!`, { id: t, duration: 5000 });
        if (result.skippedProducts && result.skippedProducts > 0) {
           setTimeout(() => toast(`Skipped ${result.skippedProducts} duplicate SKUs`, { icon: 'ℹ️' }), 1000);
        }
      } else {
        toast.error(result.error || 'Failed to upload.', { id: t });
      }
    } catch (err: any) {
      toast.error(err.message, { id: t });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-black font-sans text-white flex flex-col">
      {/* Top Navbar */}
      <div className="bg-[#0f1015] border-b border-[#1f2025] px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-end space-x-2 pb-1">
          <img src="/Logonew.png" alt="RC Logo" className="h-8 md:h-10 w-auto object-contain shrink-0" />
          <h1 
            className="text-lg md:text-xl font-bold font-serif tracking-wide leading-none pb-0.5"
            style={{
              backgroundImage: 'linear-gradient(135deg, #fff5c0 0%, #e8c566 22%, #fff9d6 44%, #aa771c 68%, #fbf3b9 88%, #c59b27 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.95)) drop-shadow(0 0 8px rgba(218,165,32,0.3))',
            }}
          >
            Imitation Jewellery <span className="text-xs font-sans font-normal text-neutral-400 ml-1">Admin</span>
          </h1>
        </div>
        <div className="flex space-x-2 md:space-x-4">
          <button onClick={handleLogout} className="flex items-center space-x-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm">
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#0f1015] border-b border-[#1f2025] px-4 md:px-8 flex space-x-8">
        <button 
          onClick={() => setActiveTab('products')} 
          className={`py-4 font-medium border-b-2 transition-colors ${activeTab === 'products' ? 'border-white text-white font-semibold' : 'border-transparent text-neutral-400 hover:text-white'}`}
        >
          Products ({products.length})
        </button>
        <button 
          onClick={() => setActiveTab('bulk')} 
          className={`py-4 font-medium border-b-2 transition-colors ${activeTab === 'bulk' ? 'border-white text-white font-semibold' : 'border-transparent text-neutral-400 hover:text-white'}`}
        >
          Bulk Upload
        </button>
        <button 
          onClick={() => setActiveTab('settings')} 
          className={`py-4 font-medium border-b-2 transition-colors ${activeTab === 'settings' ? 'border-white text-white font-semibold' : 'border-transparent text-neutral-400 hover:text-white'}`}
        >
          Categories & Settings ({categories.length})
        </button>
      </div>

      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* TAB 1: PRODUCTS INVENTORY */}
        {activeTab === 'products' && (
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Product Inventory ({products.length})</h2>
              <button onClick={() => {
                setEditingProductId(null);
                const initialAttrs: any = {}; 
                STORE_CONFIG.customFields.forEach(f => { 
                  if (f.defaultValue !== undefined) initialAttrs[f.key] = f.defaultValue; 
                }); 
                setNewProduct({ sku: '', name: '', description: '', categoryId: categories[0]?.id || '', attributes: initialAttrs });
                setImageUrls([]);
                setIsAddProductOpen(true);
              }} className="bg-white text-black px-4 py-2 rounded-lg flex items-center font-medium shadow-sm hover:bg-neutral-200 transition-colors text-sm">
                <Plus className="w-5 h-5 mr-1" /> Add Product
              </button>
            </div>
            
            <div className="bg-[#0f1015] rounded-2xl shadow-sm overflow-hidden border border-[#1f2025]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-white">
                  <thead className="bg-black">
                    <tr className="border-b border-[#1f2025]">
                      <th className="p-4 font-medium text-neutral-400 text-sm">Image</th>
                      <th className="p-4 font-medium text-neutral-400 text-sm">SKU</th>
                      <th className="p-4 font-medium text-neutral-400 text-sm">Name</th>
                      <th className="p-4 font-medium text-neutral-400 text-sm">Category</th>
                      <th className="p-4 font-medium text-neutral-400 text-sm">Sizes</th>
                      <th className="p-4 font-medium text-neutral-400 text-sm text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-neutral-400">No products found. Add one or use Bulk Upload!</td></tr>
                    ) : products.map(p => (
                      <tr key={p.id} onClick={() => handleEditClick(p)} className="border-b border-[#1f2025] hover:bg-black transition-colors cursor-pointer">
                        <td className="p-4">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover rounded-lg border border-[#1f2025]" />
                          ) : (
                            <div className="w-12 h-12 bg-neutral-900 rounded-lg border border-[#1f2025] flex items-center justify-center text-xs text-neutral-500">No Img</div>
                          )}
                        </td>
                        <td className="p-4 font-mono text-sm text-neutral-300">{p.sku}</td>
                        <td className="p-4 font-medium">{p.name}</td>
                        <td className="p-4 text-sm text-neutral-400">
                          <span className="bg-neutral-900 border border-[#1f2025] px-2.5 py-1 rounded-md text-xs text-neutral-200">
                            {p.category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-neutral-400">
                          {p.attributes?.sizes || p.attributes?.Size || '-'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button 
                              onClick={(e) => handleDuplicateClick(p, e)} 
                              className="text-neutral-400 hover:text-white p-2 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                              title="Duplicate Product (without photos)"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id, p.sku); }} 
                              className="text-red-400 hover:text-red-300 p-2 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXCEL BULK UPLOAD */}
        {activeTab === 'bulk' && (
          <div className="max-w-3xl mx-auto mt-4 space-y-8">
            <div className="bg-[#0f1015] p-8 rounded-2xl shadow-sm border border-[#1f2025]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white flex items-center"><Upload className="w-6 h-6 mr-3 text-white"/> Excel Bulk Upload</h2>
                <button onClick={downloadTemplate} className="text-sm flex items-center bg-neutral-900 px-3 py-1.5 rounded-lg text-neutral-300 hover:bg-neutral-800 font-medium transition-colors border border-[#1f2025]">
                  <Download className="w-4 h-4 mr-2" /> Download Excel Template
                </button>
              </div>
              
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-neutral-300">
                  <strong>Instructions:</strong> Download the Excel template, fill it out with Title, SKU, Category, Price, and Image URLs. Available sizes can be listed like "2.4, 2.6, 2.8" or left empty if the item has no sizes. Existing SKUs will be safely skipped.
                </p>
              </div>

              <div className="border-2 border-dashed border-[#1f2025] rounded-xl p-8 text-center bg-black hover:bg-neutral-900 transition-colors relative">
                <input 
                  type="file" 
                  accept=".xlsx"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">Drop your Excel file here</h3>
                <p className="text-sm text-neutral-400">or click to browse (.xlsx)</p>
                {isUploading && <div className="mt-4 text-sm font-medium text-white bg-neutral-800 inline-block px-3 py-1 rounded-full animate-pulse">Parsing and Uploading...</div>}
              </div>
            </div>

            {/* Image URL Generator */}
            <div className="bg-[#0f1015] p-8 rounded-2xl shadow-sm border border-[#1f2025]">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-white flex items-center"><LinkIcon className="w-6 h-6 mr-3 text-white"/> Image URL Generator</h2>
                <p className="text-sm text-neutral-400 mt-2">Upload product photos here to instantly generate public image URLs that you can paste directly into your Bulk Upload Excel sheet.</p>
              </div>

              <div className="border-2 border-dashed border-[#1f2025] rounded-xl p-8 text-center bg-black hover:bg-neutral-900 transition-colors relative mb-6">
                <input 
                  type="file" 
                  multiple
                  accept="image/*"
                  onChange={handleGenerateUrls}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isGeneratingUrls}
                />
                <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-white mb-1">Upload Images to Generate URLs</h3>
                <p className="text-sm text-neutral-400">Select multiple images at once</p>
                {isGeneratingUrls && <div className="mt-4 text-sm font-medium text-white bg-neutral-800 inline-block px-3 py-1 rounded-full animate-pulse">Uploading and Generating URLs...</div>}
              </div>

              {generatedUrls.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-white">Generated URLs ({generatedUrls.length})</h3>
                    <button onClick={() => setGeneratedUrls([])} className="text-sm text-red-400 hover:text-red-300">Clear All</button>
                  </div>
                  {generatedUrls.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-black p-3 rounded-lg border border-[#1f2025]">
                      <img src={item.url} alt="Preview" className="w-10 h-10 object-cover rounded shadow-sm border border-[#1f2025]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate mb-1">{item.name}</p>
                        <input type="text" readOnly value={item.url} className="w-full bg-[#0f1015] border border-[#1f2025] text-xs px-2 py-1 rounded text-neutral-400 focus:outline-none" />
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(item.url);
                          toast.success('URL Copied to clipboard!');
                        }} 
                        className="p-2 bg-[#0f1015] border border-[#1f2025] rounded-lg text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors shrink-0"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES & SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-5xl mx-auto mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Dynamic Categories Section */}
            <div className="bg-[#0f1015] p-6 rounded-2xl shadow-sm border border-[#1f2025] self-start space-y-5">
              <div>
                <h2 className="text-xl font-semibold border-b border-[#1f2025] pb-2 flex items-center">
                  <Layers className="w-5 h-5 mr-2 text-white" /> Manage Catalogue Categories
                </h2>
                <p className="text-xs text-neutral-400 mt-2">
                  Categories added here automatically appear on the homepage with their photo and name.
                </p>
              </div>

              {/* Add / Edit Category Form */}
              <div className="bg-black p-4 rounded-xl border border-[#1f2025] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                    {editingCategoryId ? 'Edit Category' : 'Add New Category'}
                  </span>
                  {editingCategoryId && (
                    <button 
                      onClick={handleCancelCategoryEdit} 
                      className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <label className="block text-xs font-medium text-neutral-300">Category Name *</label>
                <input 
                  value={newCategoryName} 
                  onChange={e => setNewCategoryName(e.target.value)} 
                  className="w-full border border-[#1f2025] p-2.5 rounded-lg text-white placeholder:text-neutral-500 bg-[#0f1015] text-sm focus:outline-none focus:ring-1 focus:ring-white" 
                  placeholder="e.g. Pendant Set, Long Set, Bridal Sets" 
                />

                <label className="block text-xs font-medium text-neutral-300 mt-2">Category Photo (Shown on Homepage)</label>
                <div className="flex gap-2 items-center">
                  <input 
                    value={newCategoryImage} 
                    onChange={e => setNewCategoryImage(e.target.value)} 
                    className="flex-grow border border-[#1f2025] p-2 rounded-lg text-white placeholder:text-neutral-500 bg-[#0f1015] text-xs focus:outline-none focus:ring-1 focus:ring-white" 
                    placeholder="Image URL or upload below" 
                  />
                  <label className="cursor-pointer bg-neutral-900 border border-[#1f2025] hover:bg-neutral-800 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center shrink-0 transition-colors">
                    {isUploadingCatImage ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-1" />
                        <span>Upload</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleCategoryPhotoUpload} className="hidden" disabled={isUploadingCatImage} />
                  </label>
                </div>

                {newCategoryImage && (
                  <div className="relative w-24 h-20 rounded-lg overflow-hidden border border-[#1f2025] mt-2">
                    <img src={newCategoryImage} alt="Category preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setNewCategoryImage('')}
                      className="absolute top-1 right-1 bg-black/80 rounded-full p-0.5 text-white hover:bg-red-600"
                      title="Remove Image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-neutral-300">
                      Category Tags (Search Keywords)
                    </label>
                    <span className="text-[10px] text-neutral-500">Comma-separated</span>
                  </div>
                  <input 
                    value={newCategoryTags} 
                    onChange={e => setNewCategoryTags(e.target.value)} 
                    className="w-full border border-[#1f2025] p-2.5 rounded-lg text-white placeholder:text-neutral-500 bg-[#0f1015] text-xs focus:outline-none focus:ring-1 focus:ring-white" 
                    placeholder="e.g. bridal, kundan, choker, wedding, antique, heavy, daily wear" 
                  />
                  <p className="text-[11px] text-neutral-400">
                    ✨ Default tag: <span className="text-white font-medium">"{newCategoryName.trim() || 'Category Name'}"</span> is always included automatically.
                  </p>
                </div>

                <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#0f1015] border border-[#1f2025] cursor-pointer hover:border-neutral-700 transition-colors">
                  <div className="flex items-center space-x-2">
                    <EyeOff className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs font-medium text-neutral-200">Hide from User Panel</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={newCategoryHidden}
                    onChange={e => setNewCategoryHidden(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>

                <div className="flex gap-2 mt-3">
                  {editingCategoryId && (
                    <button 
                      type="button"
                      onClick={handleCancelCategoryEdit} 
                      className="w-1/3 bg-neutral-900 border border-[#1f2025] text-neutral-300 p-2.5 rounded-lg flex items-center justify-center font-medium hover:bg-neutral-800 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={handleSaveCategory} 
                    className={`${editingCategoryId ? 'w-2/3' : 'w-full'} bg-white text-black p-2.5 rounded-lg flex items-center justify-center font-medium hover:bg-neutral-200 transition-colors text-sm shadow-sm`}
                  >
                    {editingCategoryId ? (
                      <>
                        <Edit className="w-4 h-4 mr-1.5" /> Save Changes
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1.5" /> Add Category
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Categories List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-300">
                      Existing Categories ({categories.length})
                      {categories.some(c => c.isHidden) && (
                        <span className="ml-2 text-xs font-normal text-amber-400">
                          · {categories.filter(c => c.isHidden).length} hidden
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Drag or use arrows to change the order on the homepage.
                    </p>
                  </div>
                  {isReordering && (
                    <span className="text-xs text-amber-400 animate-pulse font-medium">Saving order...</span>
                  )}
                </div>

                <ul className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {categories.length === 0 ? (
                    <li className="text-neutral-500 text-center py-6 text-sm border border-dashed border-[#1f2025] rounded-xl">
                      No categories yet. Add your first category above!
                    </li>
                  ) : categories.map((c, index) => {
                    const count = products.filter(p => p.categoryId === c.id || p.category?.id === c.id).length;
                    const isFirst = index === 0;
                    const isLast = index === categories.length - 1;
                    const isDragging = draggedIndex === index;

                    return (
                      <li 
                        key={c.id} 
                        draggable={!editingCategoryId}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                        className={`flex justify-between items-center p-3 rounded-xl transition-all ${
                          isDragging ? 'opacity-40 border-dashed border-white' : ''
                        } ${
                          editingCategoryId === c.id 
                            ? 'bg-neutral-900/80 border border-white/60 ring-1 ring-white/40' 
                            : 'bg-black border border-[#1f2025] hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {/* Drag Handle & Order Badge */}
                          <div className="flex items-center space-x-1.5 text-neutral-500 cursor-grab active:cursor-grabbing hover:text-white" title="Drag to reorder">
                            <GripVertical className="w-4 h-4 shrink-0" />
                            <span className="text-[11px] font-mono font-bold text-neutral-400 bg-neutral-900 border border-[#1f2025] w-6 h-6 rounded-md flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                          </div>

                          {c.imageUrl ? (
                            <img src={c.imageUrl} alt={c.name} className="w-12 h-10 object-cover rounded-lg border border-[#1f2025] shrink-0" />
                          ) : (
                            <div className="w-12 h-10 bg-neutral-900 rounded-lg border border-[#1f2025] flex items-center justify-center shrink-0">
                              <Layers className="w-5 h-5 text-neutral-600" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`font-medium text-sm block truncate ${c.isHidden ? 'text-neutral-400' : 'text-white'}`}>
                                {c.name}
                              </span>
                              {c.isHidden && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded shrink-0">
                                  <EyeOff className="w-2.5 h-2.5" /> Hidden
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-neutral-400 block">{count} product(s)</span>
                            {c.tags && (Array.isArray(c.tags) ? c.tags.length > 0 : Boolean(c.tags)) && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(Array.isArray(c.tags) ? c.tags : String(c.tags).split(',')).slice(0, 4).map((tag: string, tidx: number) => (
                                  <span key={tidx} className="text-[9px] bg-[#0f1015] border border-[#1f2025] text-neutral-400 px-1.5 py-0.5 rounded">
                                    #{tag.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions: Move Up, Move Down, Edit, Delete */}
                        <div className="flex items-center space-x-1 shrink-0 ml-2">
                          <button
                            type="button"
                            disabled={isFirst || isReordering}
                            onClick={() => handleMoveCategory(index, 'up')}
                            className="text-neutral-400 hover:text-white disabled:opacity-20 disabled:hover:text-neutral-400 p-1.5 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                            title="Move Up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isLast || isReordering}
                            onClick={() => handleMoveCategory(index, 'down')}
                            className="text-neutral-400 hover:text-white disabled:opacity-20 disabled:hover:text-neutral-400 p-1.5 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                            title="Move Down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          
                          <div className="h-4 w-px bg-[#1f2025] mx-1"></div>

                          <button
                            type="button"
                            disabled={togglingVisibilityId === c.id}
                            onClick={() => handleToggleCategoryVisibility(c)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                              c.isHidden
                                ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20'
                                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                            }`}
                            title={c.isHidden ? 'Show on User Panel' : 'Hide from User Panel'}
                          >
                            {c.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>

                          <button 
                            type="button"
                            onClick={() => handleEditCategoryClick(c)} 
                            className="text-neutral-400 hover:text-white p-1.5 hover:bg-neutral-800 rounded-lg transition-colors"
                            title="Edit Category"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteCategory(c.id, c.name)} 
                            className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-950/30 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Custom Field Options Section */}
            {STORE_CONFIG.customFields.filter(f => f.type === 'select').length > 0 && (
              <div className="bg-[#0f1015] p-6 rounded-2xl shadow-sm border border-[#1f2025] self-start space-y-6">
                <h2 className="text-xl font-semibold border-b border-[#1f2025] pb-2">Custom Attribute Options</h2>
                <div className="space-y-8">
                  {STORE_CONFIG.customFields.filter(f => f.type === 'select').map(field => {
                    const currentOptions = fieldOptions?.filter(o => o.fieldKey === field.key) || [];
                    return (
                      <div key={field.key}>
                        <h3 className="font-medium text-white mb-2 flex items-center text-base">{field.label} Options</h3>
                        <div className="flex gap-2 mb-3">
                          <input 
                            value={newFieldOptions[field.key] || ''} 
                            onChange={e => setNewFieldOptions(prev => ({ ...prev, [field.key]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleAddFieldOption(field.key);
                            }}
                            className="flex-grow border border-[#1f2025] p-2 rounded-lg text-white placeholder:text-neutral-500 bg-black text-sm" 
                            placeholder={`New ${field.label}`} 
                          />
                          <button onClick={() => handleAddFieldOption(field.key)} className="bg-neutral-800 text-white p-2 px-3 rounded-lg flex items-center text-sm font-medium hover:bg-neutral-700">
                            <Plus className="w-4 h-4 mr-1" /> Add
                          </button>
                        </div>
                        <ul className="space-y-1.5 max-h-[250px] overflow-y-auto">
                          {currentOptions.map(opt => (
                            <li key={opt.id} className="flex justify-between items-center p-2.5 bg-black border border-[#1f2025] rounded-lg text-white text-xs">
                              <span className="font-medium">{opt.value}</span>
                              <button onClick={() => handleDeleteFieldOption(opt.id, field.key, opt.value)} className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-950/30 rounded-lg transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </li>
                          ))}
                          {currentOptions.length === 0 && (
                            <li className="text-xs text-neutral-500 italic p-3 text-center border border-dashed border-[#1f2025] rounded-lg">
                              No options found. Add your first option above.
                            </li>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Single Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f1015] border border-[#1f2025] rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[#1f2025] shrink-0">
              <h2 className="text-xl font-semibold text-white">
                {editingProductId ? 'Edit Product' : (!editingProductId && newProduct.sku && newProduct.sku.includes('(copy)') ? 'Duplicate Product' : 'Add New Product')}
              </h2>
              <button onClick={() => setIsAddProductOpen(false)} className="text-neutral-400 hover:bg-neutral-900 p-2 rounded-full transition-colors cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            {!editingProductId && newProduct.sku && newProduct.sku.includes('(copy)') && (
              <div className="mx-6 mt-4 p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-center justify-between">
                <span>📋 Product details cloned. Add your new photos below to save this product.</span>
              </div>
            )}
            
            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">SKU *</label>
                  <input 
                    value={newProduct.sku} 
                    onChange={e => setNewProduct({...newProduct, sku: e.target.value})} 
                    className="w-full border border-[#1f2025] p-2.5 rounded-lg text-white placeholder:text-neutral-500 bg-black text-sm" 
                    placeholder="e.g. RC-PEN-001" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Product Name *</label>
                  <input 
                    value={newProduct.name} 
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                    className="w-full border border-[#1f2025] p-2.5 rounded-lg text-white placeholder:text-neutral-500 bg-black text-sm" 
                    placeholder="e.g. Antique Gold Pendant Set" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Category *</label>
                  <select 
                    value={newProduct.categoryId} 
                    onChange={e => setNewProduct({...newProduct, categoryId: e.target.value})} 
                    className="w-full border border-[#1f2025] p-2.5 rounded-lg bg-black text-white font-medium text-sm"
                  >
                    <option value="" disabled>Select Category *</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Wholesale Price (₹)</label>
                  <input 
                    type="number"
                    value={newProduct.attributes?.price || ''} 
                    onChange={e => setNewProduct({
                      ...newProduct, 
                      attributes: { ...newProduct.attributes, price: e.target.value ? Number(e.target.value) : undefined }
                    })} 
                    className="w-full border border-[#1f2025] p-2.5 rounded-lg text-white placeholder:text-neutral-500 bg-black text-sm" 
                    placeholder="e.g. 1250" 
                  />
                </div>
              </div>

              {/* Available Sizes Input */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Available Sizes
                </label>
                <input 
                  type="text"
                  value={newProduct.attributes?.sizes || newProduct.attributes?.Size || ''} 
                  onChange={e => setNewProduct({
                    ...newProduct, 
                    attributes: { ...newProduct.attributes, sizes: e.target.value, Size: e.target.value }
                  })} 
                  className="w-full border border-[#1f2025] p-2.5 rounded-lg text-white placeholder:text-neutral-500 bg-black text-sm" 
                  placeholder="e.g. 2.4, 2.6, 2.8 or S, M, L (leave empty if no size)" 
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  If this jewellery piece has no size variation, leave this completely empty.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Description</label>
                <textarea 
                  value={newProduct.description} 
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})} 
                  className="w-full border border-[#1f2025] p-2.5 rounded-lg text-white placeholder:text-neutral-500 bg-black min-h-[90px] text-sm" 
                  placeholder="Handcrafted premium imitation jewellery with matching earrings..." 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Materials Detail</label>
                <textarea 
                  value={newProduct.attributes?.materialsDetail || newProduct.attributes?.material_details || ''} 
                  onChange={e => setNewProduct({
                    ...newProduct, 
                    attributes: { 
                      ...newProduct.attributes, 
                      materialsDetail: e.target.value,
                      material_details: e.target.value 
                    }
                  })} 
                  className="w-full border border-[#1f2025] p-2.5 rounded-lg text-white placeholder:text-neutral-500 bg-black min-h-[90px] text-sm" 
                  placeholder="e.g. Copper alloy base with micro gold polish, AAA kundan stones, synthetic pearls..." 
                />
              </div>
              
              {/* Product Images Upload */}
              <div className="border border-[#1f2025] rounded-xl p-4 bg-black">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-white">Product Images (Up to 5)</label>
                  <span className="text-[11px] text-neutral-400">{imageUrls.length} / 5 uploaded</span>
                </div>
                <p className="text-xs text-neutral-400 mb-3">
                  The first image is the <span className="text-amber-400 font-medium">Primary Cover</span>. Click <span className="text-amber-400 font-medium">"Set Primary"</span> on any image to set it as the main cover.
                </p>
                <div className="flex flex-wrap gap-3 mb-2">
                  {imageUrls.map((url, i) => (
                    <div 
                      key={`${url}-${i}`} 
                      className={`relative group w-24 h-24 bg-[#0f1015] rounded-xl overflow-hidden transition-all shadow-sm ${
                        i === 0 
                          ? 'border-2 border-amber-400 ring-2 ring-amber-400/30' 
                          : 'border border-[#1f2025] hover:border-neutral-500'
                      }`}
                    >
                      <img src={url} alt={`product-img-${i}`} className="w-full h-full object-cover select-none" />

                      {/* Top Action Buttons (Reorder & Delete) */}
                      <div className="absolute top-1 right-1 flex items-center space-x-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        {i > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveImage(i, 'left')}
                            className="bg-black/80 hover:bg-black text-white rounded p-1 transition-colors shadow-sm cursor-pointer"
                            title="Move Left"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        )}
                        {i < imageUrls.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveImage(i, 'right')}
                            className="bg-black/80 hover:bg-black text-white rounded p-1 transition-colors shadow-sm cursor-pointer"
                            title="Move Right"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => setImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                          className="bg-red-600 hover:bg-red-700 text-white rounded p-1 transition-colors shadow-sm cursor-pointer"
                          title="Remove Image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Primary Badge or Set Primary Button */}
                      {i === 0 ? (
                        <div className="absolute bottom-0 left-0 right-0 bg-amber-500 text-black text-[10px] font-bold text-center py-1 flex items-center justify-center gap-1 shadow-md">
                          <Star className="w-2.5 h-2.5 fill-black" /> Primary
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(i)}
                          className="absolute bottom-0 left-0 right-0 bg-black/85 hover:bg-amber-500 hover:text-black text-neutral-200 text-[10px] font-medium text-center py-1 transition-colors cursor-pointer flex items-center justify-center gap-1 group-hover:bg-black/95"
                          title="Click to set this as the primary image"
                        >
                          <Star className="w-2.5 h-2.5 text-amber-400 group-hover:text-black group-hover:fill-black" /> Set Primary
                        </button>
                      )}
                    </div>
                  ))}

                  {imageUrls.length < 5 && (
                    <label className="w-24 h-24 border-2 border-dashed border-[#1f2025] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-900 hover:border-white transition-colors bg-[#0f1015]">
                      {isUploadingImage ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Plus className="w-6 h-6 text-neutral-400 mb-1" />
                          <span className="text-[10px] text-neutral-400 font-medium">Add Image</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" multiple disabled={isUploadingImage} />
                    </label>
                  )}
                </div>
              </div>

              {/* Custom Attributes (Material, In Stock) */}
              {STORE_CONFIG.customFields.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#1f2025] pt-4">
                  {STORE_CONFIG.customFields.map(field => {
                    if (field.key === 'sizes' || field.key === 'Size' || field.key === 'size' || field.key === 'materialsDetail' || field.key === 'material_details') return null;
                    return (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">{field.label}</label>
                        {field.type === 'select' ? (
                          <select 
                            value={newProduct.attributes[field.key] || ''} 
                            onChange={e => setNewProduct({...newProduct, attributes: {...newProduct.attributes, [field.key]: e.target.value}})}
                            className="w-full border border-[#1f2025] p-2.5 rounded-lg bg-black text-white text-sm"
                          >
                            <option value="">Select {field.label}</option>
                            {(() => {
                              const dbOptions = fieldOptions?.filter(o => o.fieldKey === field.key).map(o => o.value) || field.options || [];
                              return dbOptions.map(opt => <option key={opt} value={opt}>{opt}</option>);
                            })()}
                          </select>
                        ) : field.type === 'boolean' ? (
                          <label className="flex items-center space-x-2 text-white cursor-pointer p-2.5 border border-[#1f2025] rounded-lg bg-black">
                            <input 
                              type="checkbox" 
                              checked={newProduct.attributes[field.key] !== undefined ? !!newProduct.attributes[field.key] : true} 
                              onChange={e => setNewProduct({...newProduct, attributes: {...newProduct.attributes, [field.key]: e.target.checked}})}
                              className="rounded border-gray-600 text-brand focus:ring-brand w-4 h-4"
                            />
                            <span className="text-sm font-medium">{field.label}</span>
                          </label>
                        ) : (
                          <input 
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={newProduct.attributes[field.key] || ''} 
                            onChange={e => setNewProduct({...newProduct, attributes: {...newProduct.attributes, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value}})}
                            className="w-full border border-[#1f2025] p-2.5 rounded-lg text-white placeholder:text-neutral-500 bg-black text-sm" 
                            placeholder={`Enter ${field.label}`} 
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            <div className="p-6 border-t border-[#1f2025] bg-black rounded-b-2xl flex items-center justify-between gap-3 shrink-0">
              <div>
                {editingProductId && (
                  <button 
                    type="button"
                    onClick={() => {
                      const prodToClone = products.find(p => p.id === editingProductId) || { ...newProduct, id: editingProductId };
                      handleDuplicateClick(prodToClone);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-neutral-900 border border-[#1f2025] hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors text-xs font-medium cursor-pointer"
                    title="Duplicate as new product"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate Product</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsAddProductOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-neutral-400 hover:bg-neutral-800 transition-colors text-sm cursor-pointer">Cancel</button>
                <button onClick={handleAddProduct} className="bg-white text-black px-8 py-2.5 rounded-lg font-medium shadow-sm hover:bg-neutral-200 transition-colors text-sm cursor-pointer">{editingProductId ? 'Update Product' : 'Save Product'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f1015] border border-[#1f2025] rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
              <AlertCircle className="w-7 h-7 text-red-500 mr-2" /> Confirm Deletion
            </h3>
            
            {confirmDelete.type === 'category' ? (
              confirmDelete.productCount && confirmDelete.productCount > 0 ? (
                <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 mb-6">
                  <p className="text-red-200">
                    WARNING: The category <strong>"{confirmDelete.name}"</strong> contains <strong>{confirmDelete.productCount} product(s)</strong>.
                  </p>
                  <p className="text-red-300 mt-2 text-sm">
                    Deleting this category will permanently remove all {confirmDelete.productCount} product(s) inside it.
                  </p>
                </div>
              ) : (
                <p className="text-neutral-300 mb-6 text-base">
                  Are you sure you want to delete the category <strong className="text-white">"{confirmDelete.name}"</strong>?
                </p>
              )
            ) : confirmDelete.type === 'fieldOption' ? (
              <p className="text-neutral-300 mb-6 text-base">
                Are you sure you want to delete the option <strong className="text-white">"{confirmDelete.name}"</strong>?
              </p>
            ) : (
              <p className="text-neutral-300 mb-6 text-base">
                Are you sure you want to delete the product with SKU: <strong className="text-white">{confirmDelete.name}</strong>?
              </p>
            )}

            <div className="flex gap-3 justify-end mt-8">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="px-5 py-2.5 rounded-xl font-medium text-neutral-400 bg-neutral-900 hover:bg-neutral-800 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="px-5 py-2.5 rounded-xl font-medium bg-red-600 text-white shadow-sm hover:bg-red-700 transition-all text-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
