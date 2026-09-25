'use client';

import React, { useState, useRef } from 'react';
import { addCategory, deleteCategory, addProduct, updateProduct, deleteProduct, bulkAddProducts, logoutAdmin, uploadImageToR2, addFieldOption, deleteFieldOption } from '../actions';
import { Trash2, Plus, Upload, Download, AlertCircle, LogOut, X, Edit, Link as LinkIcon, Copy } from 'lucide-react';
import ExcelJS from 'exceljs';
import toast from 'react-hot-toast';
import { STORE_CONFIG } from '@/config/store.config';
import { useRouter } from 'next/navigation';





export default function AdminDashboard({ categories, products, fieldOptions = [] }: { categories: any[], products: any[], fieldOptions?: any[] }) {
  const router = useRouter();
  const [newCategoryName, setNewCategoryName] = useState('');
  
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
    extraData?: any; // To hold fieldKey for fieldOption
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

  const handleGenerateUrls = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsGeneratingUrls(true);
    const t = toast.loading(`Generating URLs for ${files.length} image(s)...`);
    
    try {
      const newUrls: {name: string, url: string}[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { getUploadUrl } = await import('@/app/actions');
        const res = await getUploadUrl(file.name, file.type);
        
        if (res.success && res.uploadUrl && res.finalUrl) {
          const uploadRes = await fetch(res.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type || 'application/octet-stream' },
          });
          
          if (uploadRes.ok) {
            newUrls.push({ name: file.name, url: res.finalUrl });
          }
        }
      }
      
      setGeneratedUrls(prev => [...prev, ...newUrls]);
      toast.success(`Generated ${newUrls.length} URL(s)!`, { id: t });
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
        
        // 1. Get presigned URL from server (bypasses payload limits!)
        const { getUploadUrl } = await import('@/app/actions');
        const res = await getUploadUrl(file.name, file.type);
        
        if (res.success && res.uploadUrl && res.finalUrl) {
          // 2. Upload file directly from browser to Cloudflare R2
          const uploadRes = await fetch(res.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
            },
          });
          
          if (uploadRes.ok) {
            uploadedUrls.push(res.finalUrl);
          } else {
            toast.error(`Cloudflare rejected ${file.name}`);
          }
        } else {
          toast.error(`Failed to get upload URL for ${file.name}`);
        }
      }
      
      if (uploadedUrls.length > 0) {
        setImageUrls(prev => [...prev, ...uploadedUrls]);
        toast.success(`Successfully uploaded ${uploadedUrls.length} image(s)!`, { id: t });
      } else {
        toast.error('Failed to upload any images.', { id: t });
      }
    } catch (err: any) {
      toast.error(err.message, { id: t });
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = ''; // Reset input
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) {
      toast.error('Please enter a category name');
      return;
    }
    const t = toast.loading('Adding category...');
    try {
      await addCategory(newCategoryName);
      setNewCategoryName('');
      toast.success('Category added', { id: t });
    } catch {
      toast.error('Failed to add category', { id: t });
    }
  };

  const handleAddFieldOption = async (fieldKey: string) => {
    const val = newFieldOptions[fieldKey]?.trim();
    if (!val) {
      toast.error('Please enter an option value');
      return;
    }
    // Check if it already exists
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
    if (!newProduct.name || !newProduct.sku || !newProduct.categoryId) {
      toast.error('Please fill required fields (SKU, Name, Category)');
      return;
    }
    const t = toast.loading(editingProductId ? 'Updating product...' : 'Adding product...');
    try {
      const finalAttributes = { ...newProduct.attributes };
      if (imageUrls.length > 1) {
        finalAttributes.gallery = imageUrls.slice(1);
      } else {
        delete finalAttributes.gallery;
      }

      if (editingProductId) {
        await updateProduct(editingProductId, {
          ...newProduct,
          imageUrl: imageUrls[0] || '',
          attributes: finalAttributes
        });
      } else {
        await addProduct({
          ...newProduct,
          imageUrl: imageUrls[0] || '',
          attributes: finalAttributes
        });
      }
      
      const initialAttrs: any = {}; STORE_CONFIG.customFields.forEach(f => { if (f.defaultValue !== undefined) initialAttrs[f.key] = f.defaultValue; }); setNewProduct({ sku: '', name: '', description: '', categoryId: '', attributes: initialAttrs });
      setImageUrls([]);
      setEditingProductId(null);
      setIsAddProductOpen(false);
      toast.success(editingProductId ? 'Product updated' : 'Product added', { id: t });
    } catch {
      toast.error(editingProductId ? 'Failed to update product' : 'Failed to add product', { id: t });
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
            // Check if it's a hyperlink or just value
            if (cell.type === ExcelJS.ValueType.Hyperlink) {
              rowData[headerName] = cell.hyperlink;
            } else if (cell.value && typeof cell.value === 'object' && 'text' in cell.value) {
              rowData[headerName] = cell.value.text; // Sometimes RichText or formula fallback
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
        if (gallery.length > 1) {
          attributes.gallery = gallery.slice(1);
        }

        STORE_CONFIG.customFields.forEach(field => {
          const val = rowData[`Attr: ${field.label}`];
          if (val) {
            if (field.type === 'number') {
              attributes[field.key] = Number(val);
            } else if (field.type === 'boolean') {
              attributes[field.key] = val.toLowerCase() === 'true' || val.toLowerCase() === 'yes' || val === '1';
            } else {
              attributes[field.key] = val;
            }
          }
        });

        items.push({ sku, name, categoryName, imageUrl, attributes, price, description });
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
    <div className="min-h-screen bg-neutral-50 font-sans text-black flex flex-col">
      {/* Top Navbar */}
      <div className="bg-white border-b px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-40">
        <h1 className="text-2xl font-bold text-brand">Admin Dashboard</h1>
        <div className="flex space-x-2 md:space-x-4">
          <button onClick={handleLogout} className="flex items-center space-x-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base">
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-4 md:px-8 flex space-x-8">
        <button 
          onClick={() => setActiveTab('products')} 
          className={`py-4 font-medium border-b-2 transition-colors ${activeTab === 'products' ? 'border-brand text-brand' : 'border-transparent text-neutral-500 hover:text-black'}`}
        >
          Products
        </button>
        <button 
          onClick={() => setActiveTab('bulk')} 
          className={`py-4 font-medium border-b-2 transition-colors ${activeTab === 'bulk' ? 'border-brand text-brand' : 'border-transparent text-neutral-500 hover:text-black'}`}
        >
          Bulk Upload
        </button>
        <button 
          onClick={() => setActiveTab('settings')} 
          className={`py-4 font-medium border-b-2 transition-colors ${activeTab === 'settings' ? 'border-brand text-brand' : 'border-transparent text-neutral-500 hover:text-black'}`}
        >
          Store Settings
        </button>
      </div>

      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        {activeTab === 'products' && (
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-black">Inventory ({products.length})</h2>
              <button onClick={() => {
                setEditingProductId(null);
                const initialAttrs: any = {}; STORE_CONFIG.customFields.forEach(f => { if (f.defaultValue !== undefined) initialAttrs[f.key] = f.defaultValue; }); setNewProduct({ sku: '', name: '', description: '', categoryId: '', attributes: initialAttrs });
                setImageUrls([]);
                setIsAddProductOpen(true);
              }} className="bg-brand text-button-text px-4 py-2 rounded-lg flex items-center font-medium shadow-sm hover:bg-brand-dark transition-colors">
                <Plus className="w-5 h-5 mr-1" /> Add Product
              </button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-neutral-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-black">
                  <thead className="bg-neutral-50">
                    <tr className="border-b">
                      <th className="p-4 font-medium text-neutral-600 text-sm">Image</th>
                      <th className="p-4 font-medium text-neutral-600 text-sm">SKU</th>
                      <th className="p-4 font-medium text-neutral-600 text-sm">Name</th>
                      <th className="p-4 font-medium text-neutral-600 text-sm">Category</th>
                      <th className="p-4 font-medium text-neutral-600 text-sm text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-neutral-500">No products found. Add one or use Bulk Upload!</td></tr>
                    ) : products.map(p => (
                      <tr key={p.id} onClick={() => handleEditClick(p)} className="border-b hover:bg-neutral-50 transition-colors cursor-pointer">
                        <td className="p-4">
                          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover rounded-lg border" /> : <div className="w-12 h-12 bg-neutral-100 rounded-lg border flex items-center justify-center text-xs text-neutral-400">No Img</div>}
                        </td>
                        <td className="p-4 font-mono text-sm">{p.sku}</td>
                        <td className="p-4 font-medium">{p.name}</td>
                        <td className="p-4 text-sm text-neutral-600">
                          <span className="bg-neutral-100 px-2 py-1 rounded-md text-xs">{p.category?.name}</span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id, p.sku); }} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bulk' && (
          <div className="max-w-3xl mx-auto mt-4 space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-black flex items-center"><Upload className="w-6 h-6 mr-3 text-brand"/> Excel Bulk Upload</h2>
                <button onClick={downloadTemplate} className="text-sm flex items-center bg-neutral-100 px-3 py-1.5 rounded-lg text-neutral-700 hover:bg-neutral-200 font-medium transition-colors">
                  <Download className="w-4 h-4 mr-2" /> Download Excel Template
                </button>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Instructions:</strong> Download the Excel template, fill it out, and upload it back here to add hundreds of products at once. Categories and Custom Options appear as dropdowns in the template. Existing SKUs will be safely skipped.
                </p>
              </div>

              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center bg-neutral-50 hover:bg-neutral-100 transition-colors relative">
                <input 
                  type="file" 
                  accept=".xlsx"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-black mb-1">Drop your Excel file here</h3>
                <p className="text-sm text-neutral-500">or click to browse (.xlsx)</p>
                {isUploading && <div className="mt-4 text-sm font-medium text-amber-600 bg-amber-100 inline-block px-3 py-1 rounded-full animate-pulse">Parsing and Uploading...</div>}
              </div>
            </div>

            {/* Image URL Generator */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-black flex items-center"><LinkIcon className="w-6 h-6 mr-3 text-brand"/> Image URL Generator</h2>
                <p className="text-sm text-neutral-500 mt-2">Upload images here to instantly generate public URLs. You can copy and paste these URLs directly into your Bulk Upload Excel sheet.</p>
              </div>

              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center bg-neutral-50 hover:bg-neutral-100 transition-colors relative mb-6">
                <input 
                  type="file" 
                  multiple
                  accept="image/*"
                  onChange={handleGenerateUrls}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isGeneratingUrls}
                />
                <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-black mb-1">Upload Images to Generate URLs</h3>
                <p className="text-sm text-neutral-500">Select multiple images at once</p>
                {isGeneratingUrls && <div className="mt-4 text-sm font-medium text-brand bg-brand/10 inline-block px-3 py-1 rounded-full animate-pulse">Uploading and Generating URLs...</div>}
              </div>

              {generatedUrls.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-black">Generated URLs</h3>
                    <button onClick={() => setGeneratedUrls([])} className="text-sm text-red-500 hover:text-red-700">Clear All</button>
                  </div>
                  {generatedUrls.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                      <img src={item.url} alt="Preview" className="w-10 h-10 object-cover rounded shadow-sm border border-neutral-200" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-black truncate mb-1">{item.name}</p>
                        <input type="text" readOnly value={item.url} className="w-full bg-white border border-neutral-300 text-xs px-2 py-1 rounded text-neutral-600 focus:outline-none" />
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(item.url);
                          toast.success('URL Copied to clipboard!');
                        }} 
                        className="p-2 bg-white border border-neutral-300 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-black transition-colors shrink-0"
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

        {activeTab === 'settings' && (
          <div className="max-w-5xl mx-auto mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Categories Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 self-start">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">Manage Categories</h2>
              <div className="flex gap-2 mb-6">
                <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} 
                  className="flex-grow border p-2.5 rounded-lg text-black placeholder:text-neutral-500" placeholder="New Category Name" />
                <button onClick={handleAddCategory} className="bg-brand text-button-text p-2.5 px-4 rounded-lg flex items-center font-medium">
                  <Plus className="w-5 h-5 mr-1" /> Add
                </button>
              </div>
              <ul className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {categories.length === 0 ? <li className="text-neutral-500 text-center py-4 text-sm">No categories yet.</li> : categories.map(c => (
                  <li key={c.id} className="flex justify-between items-center p-3 bg-neutral-50 border border-neutral-100 rounded-lg text-black">
                    <span className="font-medium">{c.name}</span>
                    <button onClick={() => handleDeleteCategory(c.id, c.name)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Custom Field Options Section */}
            {STORE_CONFIG.customFields.filter(f => f.type === 'select').length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 self-start">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Custom Select Options</h2>
                <div className="space-y-8">
                  {STORE_CONFIG.customFields.filter(f => f.type === 'select').map(field => {
                    const currentOptions = fieldOptions?.filter(o => o.fieldKey === field.key) || [];
                    return (
                      <div key={field.key}>
                        <h3 className="font-medium text-black mb-3 flex items-center text-lg">{field.label} Options</h3>
                        <div className="flex gap-2 mb-4">
                          <input 
                            value={newFieldOptions[field.key] || ''} 
                            onChange={e => setNewFieldOptions(prev => ({ ...prev, [field.key]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleAddFieldOption(field.key);
                            }}
                            className="flex-grow border p-2 rounded-lg text-black placeholder:text-neutral-500" 
                            placeholder={`New ${field.label}`} 
                          />
                          <button onClick={() => handleAddFieldOption(field.key)} className="bg-brand text-button-text p-2 px-3 rounded-lg flex items-center text-sm font-medium">
                            <Plus className="w-4 h-4 mr-1" /> Add
                          </button>
                        </div>
                        <ul className="space-y-1.5 max-h-[300px] overflow-y-auto">
                          {currentOptions.map(opt => (
                            <li key={opt.id} className="flex justify-between items-center p-2.5 bg-neutral-50 border border-neutral-100 rounded-lg text-black text-sm">
                              <span className="font-medium">{opt.value}</span>
                              <button onClick={() => handleDeleteFieldOption(opt.id, field.key, opt.value)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </li>
                          ))}
                          {currentOptions.length === 0 && (
                            <li className="text-sm text-neutral-400 italic p-3 text-center border border-dashed rounded-lg">No options found. Add your first option above.</li>
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

      {/* Add/Edit Single Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b shrink-0">
              <h2 className="text-xl font-semibold text-black">{editingProductId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsAddProductOpen(false)} className="text-neutral-500 hover:bg-neutral-100 p-2 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} 
                  className="w-full border p-2.5 rounded-lg text-black placeholder:text-neutral-500" placeholder="SKU *" disabled={!!editingProductId} />
                <input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                  className="w-full border p-2.5 rounded-lg text-black placeholder:text-neutral-500" placeholder="Product Name *" />
              </div>
              
              <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} 
                className="w-full border p-2.5 rounded-lg text-black placeholder:text-neutral-500 min-h-[100px]" placeholder="Description" />
              
              <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                <label className="block text-sm font-medium text-black mb-3">Product Images</label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="relative group w-20 h-20 border bg-white rounded-lg overflow-hidden shadow-sm">
                      <img src={url} alt="upload" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">Primary</span>}
                    </div>
                  ))}
                  <label className="w-20 h-20 border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-100 hover:border-brand transition-colors bg-white">
                    {isUploadingImage ? (
                      <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Plus className="w-6 h-6 text-neutral-400 mb-1" />
                        <span className="text-[10px] text-neutral-500 font-medium">Add Image</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" multiple disabled={isUploadingImage} />
                  </label>
                </div>
              </div>

              <select value={newProduct.categoryId} onChange={e => setNewProduct({...newProduct, categoryId: e.target.value})} 
                className="w-full border p-2.5 rounded-lg bg-white text-black font-medium">
                <option value="" disabled>Select Category *</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              
              {STORE_CONFIG.customFields.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  {STORE_CONFIG.customFields.map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-neutral-500 mb-1 ml-1">{field.label}</label>
                      {field.type === 'select' ? (
                        <select 
                          value={newProduct.attributes[field.key] || ''} 
                          onChange={e => setNewProduct({...newProduct, attributes: {...newProduct.attributes, [field.key]: e.target.value}})}
                          className="w-full border p-2.5 rounded-lg bg-white text-black"
                        >
                          <option value="" disabled>Select {field.label}</option>
                          {(() => {
                            const dbOptions = fieldOptions?.filter(o => o.fieldKey === field.key).map(o => o.value) || [];
                            return dbOptions.map(opt => <option key={opt} value={opt}>{opt}</option>);
                          })()}
                        </select>
                      ) : field.type === 'boolean' ? (
                        <label className="flex items-center space-x-2 text-black cursor-pointer p-2 border rounded-lg bg-white">
                          <input 
                            type="checkbox" 
                            checked={!!newProduct.attributes[field.key]} 
                            onChange={e => setNewProduct({...newProduct, attributes: {...newProduct.attributes, [field.key]: e.target.checked}})}
                            className="rounded border-gray-300 text-brand focus:ring-brand w-5 h-5 ml-1"
                          />
                          <span className="font-medium">{field.label}</span>
                        </label>
                      ) : (
                        <input 
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={newProduct.attributes[field.key] || ''} 
                          onChange={e => setNewProduct({...newProduct, attributes: {...newProduct.attributes, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value}})}
                          className="w-full border p-2.5 rounded-lg text-black placeholder:text-neutral-400" 
                          placeholder={`Enter ${field.label}`} 
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-neutral-50 rounded-b-2xl flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsAddProductOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-neutral-600 hover:bg-neutral-200 transition-colors">Cancel</button>
              <button onClick={handleAddProduct} className="bg-brand text-button-text px-8 py-2.5 rounded-lg font-medium shadow-sm hover:bg-brand-dark transition-colors">{editingProductId ? 'Update Product' : 'Save Product'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all">
            <h3 className="text-2xl font-bold text-black mb-4 flex items-center">
              <AlertCircle className="w-7 h-7 text-red-500 mr-2" /> Confirm Deletion
            </h3>
            
            {confirmDelete.type === 'category' ? (
              confirmDelete.productCount && confirmDelete.productCount > 0 ? (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                  <p className="text-red-800">
                    WARNING: The category <strong>"{confirmDelete.name}"</strong> contains <strong>{confirmDelete.productCount} product(s)</strong>.
                  </p>
                  <p className="text-red-700 mt-2 text-sm">
                    If you delete this category, all {confirmDelete.productCount} product(s) will ALSO be permanently deleted. Are you absolutely sure?
                  </p>
                </div>
              ) : (
                <p className="text-neutral-600 mb-6 text-lg">
                  Are you sure you want to delete the category <strong className="text-black">"{confirmDelete.name}"</strong>?
                </p>
              )
            ) : confirmDelete.type === 'fieldOption' ? (
              confirmDelete.productCount && confirmDelete.productCount > 0 ? (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                  <p className="text-red-800">
                    WARNING: The option <strong>"{confirmDelete.name}"</strong> is used by <strong>{confirmDelete.productCount} product(s)</strong>.
                  </p>
                  <p className="text-red-700 mt-2 text-sm">
                    If you delete this option, all {confirmDelete.productCount} affected product(s) will ALSO be permanently deleted. Are you absolutely sure?
                  </p>
                </div>
              ) : (
                <p className="text-neutral-600 mb-6 text-lg">
                  Are you sure you want to delete this option: <strong className="text-black">"{confirmDelete.name}"</strong>?
                </p>
              )
            ) : (
              <p className="text-neutral-600 mb-6 text-lg">
                Are you sure you want to delete the product with SKU: <strong className="text-black">{confirmDelete.name}</strong>?
              </p>
            )}

            <div className="flex gap-3 justify-end mt-8">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="px-5 py-2.5 rounded-xl font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="px-5 py-2.5 rounded-xl font-medium bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow transition-all"
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
