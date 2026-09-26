'use client';

import React, { useState, useMemo } from 'react';
import { ShoppingCart, Search, ArrowUpDown, SlidersHorizontal, X, FileDown } from 'lucide-react';
import ProductCard from './ProductCard';
import InquiryModal from './InquiryModal';
import QuoteCart from './QuoteCart';
import ImageModal from './ImageModal';
import HeroCarousel from './HeroCarousel';
import Banner from './Banner';
import TextContent from './TextContent';
import { STORE_CONFIG } from '@/config/store.config';
import toast from 'react-hot-toast';

export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string;
  imageUrl: string;
  categoryId: string;
  category?: { id: string; name: string };
  attributes?: Record<string, any>;
};

export type Category = {
  id: string;
  name: string;
};

export interface CartItem {
  product: Product;
  quantity: number;
}

export default function CatalogueClient({ 
  initialCategories, 
  initialProducts,
  fieldOptions = []
}: { 
  initialCategories: Category[], 
  initialProducts: Product[],
  fieldOptions?: any[]
}) {
  const [categories] = useState<Category[]>(initialCategories);
  const [products] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [inquiryProduct, setInquiryProduct] = useState<Product | null>(null);
  const [zoomedProduct, setZoomedProduct] = useState<Product | null>(null);
  
  // Export PDF State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportSelectedCategories, setExportSelectedCategories] = useState<string[]>([]);
  
  // Custom Attributes Filter Config
  const filterableFields = useMemo(() => STORE_CONFIG.customFields.filter(f => f.isFilterable), []);

  const filterOptions = useMemo(() => {
    const opts: Record<string, string[]> = {};
    filterableFields.forEach(field => {
      if (field.type === 'select') {
        const dbOpts = fieldOptions.filter(o => o.fieldKey === field.key).map(o => o.value);
        opts[field.key] = dbOpts;
      } else if (field.type === 'text') {
        const unique = Array.from(new Set(
          products
            .map(p => p.attributes?.[field.key])
            .filter(v => v !== undefined && v !== null && v !== '')
        ));
        opts[field.key] = unique.map(String);
      }
    });
    return opts;
  }, [products, fieldOptions, filterableFields]);

  // Full filter + sort pipeline
  const displayProducts = useMemo(() => {
    // 1. Category filter
    let filtered = products;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.categoryId === selectedCategory);
    }

    // 2. Custom attribute filters
    Object.entries(activeFilters).forEach(([key, val]) => {
      if (val !== undefined) {
        filtered = filtered.filter(p => {
          const pVal = p.attributes?.[key];
          if (typeof val === 'boolean') return !!pVal === val;
          return String(pVal) === String(val);
        });
      }
    });

    // 3. Sort by price low to high by default
    filtered = [...filtered].sort((a, b) => {
      const priceA = Number(a.attributes?.price) || 0;
      const priceB = Number(b.attributes?.price) || 0;
      return priceA - priceB;
    });

    return filtered;
  }, [products, selectedCategory, activeFilters]);

  const hasActiveFilters = Object.values(activeFilters).some(v => v !== undefined) || selectedCategory !== 'all';
  
  const clearAllFilters = () => {
    setSelectedCategory('all');
    setActiveFilters({});
  };

  const handleAddToCartClick = (product: Product) => {
    addToCart(product);
    toast.success('Added to Quote List');
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          (item.product.id === product.id) ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => 
      (item.product.id === productId) ? { ...item, quantity } : item
    ));
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Group and sort for Print View
  const printGroups = useMemo(() => {
    // 1. Filter products based on selected export categories
    let productsToPrint = initialProducts;
    if (exportSelectedCategories.length > 0) {
      productsToPrint = initialProducts.filter(p => exportSelectedCategories.includes(p.categoryId || ''));
    }

    // 2. Group by category
    const grouped = productsToPrint.reduce((acc, p) => {
      const catName = p.category?.name || 'Uncategorized';
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(p);
      return acc;
    }, {} as Record<string, Product[]>);

    // 3. Sort categories A-Z
    const sortedCategories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    // 4. Sort products by price (low to high) inside each category
    sortedCategories.forEach(cat => {
      grouped[cat].sort((a, b) => {
        const priceA = Number(a.attributes?.price) || 0;
        const priceB = Number(b.attributes?.price) || 0;
        return priceA - priceB;
      });
    });

    return { grouped, sortedCategories };
  }, [initialProducts, exportSelectedCategories]);

  return (
    <div className="pb-24 print:pb-0">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm px-4 md:px-8 flex items-center justify-between h-[72px] md:h-[80px] print:hidden">
        <div className="flex items-center space-x-3 md:space-x-4">
          <img src="/Logo.png" alt="RC Imitation Jewellery Logo" className="h-10 md:h-12 w-auto object-contain" />
          <h1 className="text-lg md:text-xl font-bold text-nav-heading tracking-tight font-serif leading-tight">{STORE_CONFIG.storeName}</h1>
        </div>
        <button 
          onClick={() => setIsExportModalOpen(true)}
          className="print:hidden flex items-center space-x-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <FileDown className="w-4 h-4" />
          <span className="hidden sm:inline">Export PDF</span>
        </button>
      </header>

      {/* Dynamic Layout Blocks */}
      <div className="py-6 space-y-6 print:hidden">
        {STORE_CONFIG.homeLayout?.map((block, index) => {
          if (block.type === 'heroCarousel') {
            return <HeroCarousel key={index} slides={block.slides} />;
          }
          if (block.type === 'banner') {
            return <Banner key={index} imageUrl={block.imageUrl} linkUrl={block.linkUrl} altText={block.altText} />;
          }
          if (block.type === 'textContent') {
            return <TextContent key={index} title={block.title} body={block.body} />;
          }
          return null;
        })}
      </div>

      {/* Category Bar */}
      <div className="print:hidden sticky top-[72px] md:top-[80px] z-30 bg-white/95 backdrop-blur-sm border-b border-neutral-200 px-4 md:px-8 py-3 overflow-x-auto whitespace-nowrap hide-scrollbar flex space-x-2 md:space-x-4 shadow-sm">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === 'all' ? 'bg-brand text-button-text' : 'bg-white border border-brand/20 text-brand/80 hover:bg-brand/5'}`}
        >
          Home
        </button>
        {initialCategories.map(cat => {
          const count = initialProducts.filter(p => p.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'bg-brand text-button-text' : 'bg-white border border-brand/20 text-brand/80 hover:bg-brand/5'}`}
            >
              {cat.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Filter Bar - only show if there are filterable fields */}
      {filterableFields.length > 0 && (
        <div className="print:hidden px-4 md:px-8 py-3 bg-white border-b border-neutral-100">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
            
            {/* Filter Dropdowns */}
            {filterableFields.map(field => {
              if (field.type === 'boolean') {
                return (
                  <select 
                    key={field.key}
                    value={activeFilters[field.key] === undefined ? 'all' : String(activeFilters[field.key])}
                    onChange={e => {
                      const val = e.target.value;
                      setActiveFilters(prev => ({
                        ...prev, 
                        [field.key]: val === 'all' ? undefined : val === 'true'
                      }));
                    }}
                    className="text-sm border border-neutral-200 rounded-lg px-2 py-1.5 bg-white text-black focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="all">{field.label}: All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                );
              }

              if (field.type === 'select' || field.type === 'text') {
                const options = filterOptions[field.key] || [];
                return (
                  <select 
                    key={field.key}
                    value={activeFilters[field.key] || 'all'}
                    onChange={e => setActiveFilters(prev => ({...prev, [field.key]: e.target.value === 'all' ? undefined : e.target.value}))}
                    className="text-sm border border-neutral-200 rounded-lg px-2 py-1.5 bg-white text-black focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="all">{field.label}: All</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                );
              }

              return null;
            })}

            {hasActiveFilters && (
              <button 
                onClick={clearAllFilters} 
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto"
              >
                <X className="w-3 h-3" /> Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Normal Product Grid (Hidden in Print) */}
      <div className="p-4 md:p-8 max-w-7xl mx-auto print:hidden">
        {selectedCategory === 'all' && !hasActiveFilters && STORE_CONFIG.homepageCategories?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mt-4 md:mt-8">
            {STORE_CONFIG.homepageCategories.map((card, idx) => {
              const matchedCat = initialCategories.find(c => c.name.toLowerCase() === card.name.toLowerCase());
              return (
                <div 
                  key={idx} 
                  onClick={() => matchedCat ? setSelectedCategory(matchedCat.id) : toast.error(`Category "${card.name}" not found in database!`)}
                  className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
                >
                  <img src={card.image} alt={card.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white tracking-wide font-serif drop-shadow-md">{card.name}</h2>
                  </div>
                </div>
              );
            })}
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">
            {hasActiveFilters ? 'No products match your filters.' : 'No products found in this category.'}
          </div>
        ) : (
          <>
            <p className="text-xs text-neutral-400 mb-3">{displayProducts.length} product(s)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {displayProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onInquire={() => {
                    // Bypass InquiryModal for this client
                    const message = `I want to know more about ${product.sku} of saree`;
                    const url = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
                    window.open(url, '_blank');
                  }}
                  onAdd={() => handleAddToCartClick(product)}
                  onImageClick={() => setZoomedProduct(product)}
                  isInCart={cart.some(item => item.product.id === product.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Print-Only Product Grid with Repeating Header */}
      <table className="hidden print:table w-full max-w-7xl mx-auto">
        <thead className="table-header-group">
          <tr>
            <td className="pb-6 pt-4">
              <div className="flex items-center space-x-4">
                <img src="/Logo.png" alt="Logo" className="h-12 w-auto object-contain" />
                <h1 className="text-xl font-bold text-nav-heading tracking-tight font-serif leading-tight">{STORE_CONFIG.storeName}</h1>
              </div>
              <div className="h-px bg-neutral-200 w-full mt-4"></div>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {printGroups.sortedCategories.length === 0 ? (
                <div className="text-center py-20 text-black">No products to print.</div>
              ) : (
                printGroups.sortedCategories.map(cat => (
                  <div key={cat} className="mb-12">
                    {/* Category Header with Line Separator */}
                    <div className="flex items-center gap-4 mb-6">
                      <h2 className="text-2xl font-bold text-brand whitespace-nowrap">{cat}</h2>
                      <div className="h-px bg-neutral-300 flex-grow mt-1"></div>
                    </div>
                    
                    {/* Category Products */}
                    <div className="grid grid-cols-3 gap-6">
                      {printGroups.grouped[cat].map(product => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          onInquire={() => {}}
                          onAdd={() => {}}
                          onImageClick={() => {}}
                          isInCart={false}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Quote List Bar - Hidden for this catalogue */}
      {/*
      {totalCartItems > 0 && (
        <div className="print:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-brand text-button-text pl-4 pr-2 py-2 rounded-full shadow-2xl flex items-center space-x-3 md:space-x-4 animate-in fade-in zoom-in-95 animate-duration-200 border border-neutral-700 whitespace-nowrap">
          <div className="flex items-center space-x-2 text-sm font-medium">
            <span className="flex shrink-0 items-center justify-center bg-white border border-brand0 text-brand w-6 h-6 rounded-full text-xs font-bold">{totalCartItems}</span>
            <span className="pr-1 md:pr-2">Items in Quote</span>
          </div>
          <button onClick={() => setIsCartOpen(true)} className="bg-white shrink-0 text-brand px-4 md:px-5 py-2 rounded-full text-sm font-bold hover:bg-neutral-100 transition-colors">
            View Cart
          </button>
        </div>
      )}
      */}

      {/* Modals/Drawers */}
      {inquiryProduct && (
        <InquiryModal 
          product={inquiryProduct} 
          onClose={() => setInquiryProduct(null)} 
        />
      )}

      {isCartOpen && (
        <QuoteCart 
          cart={cart}
          onClose={() => setIsCartOpen(false)}
          onRemove={removeFromCart}
          onUpdateQuantity={updateCartQuantity}
        />
      )}

      {zoomedProduct && (
        <ImageModal 
          product={zoomedProduct}
          onClose={() => setZoomedProduct(null)} 
        />
      )}

      {/* Export PDF Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-brand mb-4">Export PDF Settings</h3>
            <p className="text-sm text-neutral-600 mb-4">Select the categories you want to include in the PDF export.</p>
            
            <div className="max-h-[300px] overflow-y-auto border rounded-lg p-2 mb-6">
              <label className="flex items-center p-2 hover:bg-neutral-50 rounded cursor-pointer border-b mb-1">
                <input 
                  type="checkbox" 
                  checked={exportSelectedCategories.length === initialCategories.length}
                  onChange={e => {
                    if (e.target.checked) {
                      setExportSelectedCategories(initialCategories.map(c => c.id));
                    } else {
                      setExportSelectedCategories([]);
                    }
                  }}
                  className="w-4 h-4 text-brand rounded focus:ring-brand"
                />
                <span className="ml-3 font-medium text-black">Select All Categories</span>
              </label>
              
              {initialCategories.map(cat => (
                <label key={cat.id} className="flex items-center p-2 hover:bg-neutral-50 rounded cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={exportSelectedCategories.includes(cat.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setExportSelectedCategories(prev => [...prev, cat.id]);
                      } else {
                        setExportSelectedCategories(prev => prev.filter(id => id !== cat.id));
                      }
                    }}
                    className="w-4 h-4 text-brand rounded focus:ring-brand"
                  />
                  <span className="ml-3 text-black">{cat.name}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2.5 rounded-lg font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (exportSelectedCategories.length === 0) {
                    toast.error('Please select at least one category to export.');
                    return;
                  }
                  // Give React a tiny fraction of a second to render the selected grid if it wasn't rendered
                  setTimeout(() => {
                    window.print();
                    setIsExportModalOpen(false);
                  }, 100);
                }}
                className="px-6 py-2.5 rounded-lg font-medium bg-brand text-button-text hover:bg-brand-dark transition-colors shadow-sm disabled:opacity-50"
              >
                Generate PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
