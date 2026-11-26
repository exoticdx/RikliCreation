'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart, Search, ArrowUpDown, SlidersHorizontal, X, FileDown, Layers } from 'lucide-react';
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
  imageUrl?: string;
  tags?: string[] | string;
  isHidden?: boolean;
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
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL query params
  const urlCat = searchParams.get('cat');

  const [categories] = useState<Category[]>(initialCategories);
  const [products] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(() => urlCat || 'all');
  const [priceSort, setPriceSort] = useState<'low-to-high' | 'high-to-low'>('low-to-high');
  const [inquiryProduct, setInquiryProduct] = useState<Product | null>(null);
  const [zoomedProduct, setZoomedProduct] = useState<Product | null>(null);

  // Category Tag Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter categories based on search query matching category name (default tag) and tags
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);

    return categories.filter(cat => {
      const nameStr = (cat.name || '').toLowerCase();
      const tagsList: string[] = Array.isArray(cat.tags) 
        ? cat.tags.map((t: string) => t.toLowerCase())
        : typeof cat.tags === 'string' && cat.tags.trim()
          ? cat.tags.split(',').map((t: string) => t.toLowerCase().trim())
          : [];
      
      const allSearchable = [nameStr, ...tagsList];
      return tokens.every(token => allSearchable.some(st => st.includes(token)));
    });
  }, [categories, searchQuery]);

  // Synchronize state with URL search params and sessionStorage
  useEffect(() => {
    const currentCat = searchParams.get('cat');

    if (currentCat && categories.some(c => c.id === currentCat)) {
      setSelectedCategory(currentCat);
      sessionStorage.setItem('selectedCategory', currentCat);
    } else {
      const savedCat = typeof window !== 'undefined' ? sessionStorage.getItem('selectedCategory') : null;
      if (savedCat && savedCat !== 'all' && categories.some(c => c.id === savedCat)) {
        setSelectedCategory(savedCat);
        const params = new URLSearchParams(window.location.search);
        params.set('cat', savedCat);
        window.history.replaceState(null, '', `/?${params.toString()}`);
      } else {
        setSelectedCategory('all');
      }
    }
  }, [searchParams, categories]);

  // Restore scroll position after returning from a product detail page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedScroll = sessionStorage.getItem('catalogueScrollPos');
      if (savedScroll) {
        const y = parseInt(savedScroll, 10);
        if (!isNaN(y) && y > 0) {
          const timer = setTimeout(() => {
            window.scrollTo({ top: y, behavior: 'instant' });
            sessionStorage.removeItem('catalogueScrollPos');
          }, 80);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [selectedCategory]);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedCategory', catId);
    }
    const params = new URLSearchParams();
    if (catId && catId !== 'all') {
      params.set('cat', catId);
      router.push(`/?${params.toString()}`, { scroll: false });
    } else {
      router.push('/', { scroll: false });
    }
  };

  const handleBackHome = () => {
    setSelectedCategory('all');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('selectedCategory');
      sessionStorage.removeItem('catalogueScrollPos');
    }
    router.push('/', { scroll: false });
  };
  
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

  // In-stock products list (used for customer view and design counts)
  const inStockProducts = useMemo(() => {
    return products.filter(p => {
      const inStock = p.attributes?.in_stock ?? p.attributes?.inStock;
      return inStock !== false && inStock !== 'false' && inStock !== 0;
    });
  }, [products]);

  // Product filtering & price sorting pipeline
  const displayProducts = useMemo(() => {
    let filtered = inStockProducts;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.categoryId === selectedCategory);
    }

    // Sort by price (low-to-high by default, or high-to-low)
    filtered = [...filtered].sort((a, b) => {
      const priceA = Number(a.attributes?.price) || 0;
      const priceB = Number(b.attributes?.price) || 0;
      if (priceSort === 'high-to-low') {
        return priceB - priceA;
      }
      return priceA - priceB;
    });

    return filtered;
  }, [inStockProducts, selectedCategory, priceSort]);

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

  const currentCategoryObj = categories.find(c => c.id === selectedCategory);

  // Group and sort for Print View
  const printGroups = useMemo(() => {
    let productsToPrint = initialProducts;
    if (exportSelectedCategories.length > 0) {
      productsToPrint = initialProducts.filter(p => exportSelectedCategories.includes(p.categoryId || ''));
    }

    const grouped = productsToPrint.reduce((acc, p) => {
      const catName = p.category?.name || 'Uncategorized';
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(p);
      return acc;
    }, {} as Record<string, Product[]>);

    const sortedCategories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

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
      <header className="sticky top-0 z-40 bg-black border-b border-[#1f2025] shadow-sm px-4 md:px-8 flex items-center justify-between h-[72px] md:h-[80px] print:hidden">
        <div 
          onClick={handleBackHome}
          className={`items-end space-x-2 md:space-x-3 cursor-pointer group pb-1 ${isSearchOpen ? 'hidden sm:flex' : 'flex'}`}
        >
          <img src="/Logonew.png" alt="RC Logo" className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105 shrink-0" />
          <h1 
            className="text-lg md:text-xl font-bold font-serif tracking-wide leading-none pb-0.5 md:pb-1"
            style={{
              backgroundImage: 'linear-gradient(135deg, #fff5c0 0%, #e8c566 22%, #fff9d6 44%, #aa771c 68%, #fbf3b9 88%, #c59b27 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.95)) drop-shadow(0 0 10px rgba(218,165,32,0.35))',
            }}
          >
            Imitation Jewellery
          </h1>
        </div>

        {/* Search Bar / Search Button */}
        {isSearchOpen ? (
          <div className="flex-1 max-w-md mx-2 md:mx-4 flex items-center relative animate-in fade-in zoom-in-95 duration-150">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
            <input 
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                if (selectedCategory !== 'all' && e.target.value.trim()) {
                  setSelectedCategory('all');
                }
              }}
              placeholder="Search category name or tags..."
              className="w-full bg-[#0f1015] border border-[#1f2025] focus:border-white/50 text-white text-xs md:text-sm pl-9 pr-16 py-2 md:py-2.5 rounded-xl outline-none placeholder:text-neutral-500"
            />
            <div className="absolute right-1.5 flex items-center">
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-neutral-400 hover:text-white"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button 
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="px-2 py-1 text-xs text-neutral-400 hover:text-white font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => {
                setIsSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="p-2 md:px-3.5 md:py-2 rounded-xl bg-neutral-900 border border-[#1f2025] hover:bg-neutral-800 text-white flex items-center space-x-2 text-xs md:text-sm font-medium transition-colors cursor-pointer shadow-sm"
              title="Search categories by tags"
            >
              <Search className="w-4 h-4 text-neutral-300" />
              <span className="hidden sm:inline text-neutral-300 font-medium">Search</span>
            </button>
          </div>
        )}
      </header>

      {/* Dynamic Layout Blocks on Home */}
      {selectedCategory === 'all' && (
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
      )}

      {/* Category Header & Filter Bar (when inside a category catalogue) */}
      {selectedCategory !== 'all' && (
        <div className="print:hidden sticky top-[72px] md:top-[80px] z-30 bg-black/95 backdrop-blur-sm border-b border-[#1f2025] px-4 md:px-8 py-3.5 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-white font-serif tracking-wide">
              {currentCategoryObj?.name || 'Catalogue'}
            </h1>
            <div className="flex items-center space-x-2.5">
              <ArrowUpDown className="w-4 h-4 text-neutral-400" />
              <label htmlFor="price-sort" className="text-xs md:text-sm text-neutral-300 font-medium hidden sm:inline">
                Sort by Price:
              </label>
              <select 
                id="price-sort"
                value={priceSort}
                onChange={e => setPriceSort(e.target.value as 'low-to-high' | 'high-to-low')}
                className="text-xs md:text-sm border border-[#1f2025] rounded-lg px-3 py-1.5 bg-[#0f1015] text-white focus:outline-none focus:ring-1 focus:ring-white cursor-pointer font-medium"
              >
                <option value="low-to-high">Price: Low to High</option>
                <option value="high-to-low">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-[#0f1015] flex-grow min-h-screen">
        <div className="py-4 md:py-8 px-4 md:px-8 max-w-7xl mx-auto print:hidden">

        {/* 1. FIRST PAGE: Dynamic Category Grid */}
        {selectedCategory === 'all' ? (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white font-serif tracking-wide">
                  Collections
                </h2>
              </div>
              {searchQuery.trim() && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>

            {/* Search active results indicator */}
            {searchQuery.trim() && (
              <div className="flex items-center justify-between bg-black border border-[#1f2025] px-4 py-2.5 rounded-xl mb-6 text-xs text-neutral-300">
                <span>
                  Showing {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'} matching tag/keyword <span className="text-white font-semibold">"{searchQuery}"</span>
                </span>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-neutral-400 hover:text-white font-medium ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {filteredCategories.length === 0 ? (
              <div className="text-center py-24 bg-black rounded-2xl border border-dashed border-[#1f2025] p-8">
                {searchQuery ? (
                  <>
                    <Search className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-white mb-1">No Matching Categories</h3>
                    <p className="text-sm text-neutral-400 mb-4">
                      No category matches tag or keyword "{searchQuery}".
                    </p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-2 bg-neutral-900 border border-[#1f2025] text-white hover:bg-neutral-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <Layers className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-white mb-1">No Categories Found</h3>
                    <p className="text-sm text-neutral-400">
                      Please log in to the Admin Dashboard to add your categories and upload products.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredCategories.map((cat) => {
                  const productCount = inStockProducts.filter(p => p.categoryId === cat.id).length;

                  return (
                    <div 
                      key={cat.id} 
                      onClick={() => handleSelectCategory(cat.id)}
                      className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg cursor-pointer group border border-[#1f2025] bg-black"
                    >
                      {cat.imageUrl ? (
                        <img 
                          src={cat.imageUrl} 
                          alt={cat.name} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-neutral-900 to-black flex items-center justify-center">
                          <Layers className="w-16 h-16 text-neutral-700" />
                        </div>
                      )}
                      
                      {/* Gradient overlay for readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:via-black/50 transition-colors"></div>
                      
                      {/* Category Details at Bottom */}
                      <div className="absolute inset-0 flex flex-col justify-end p-6">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1">
                          {productCount} {productCount === 1 ? 'Design' : 'Designs'}
                        </span>
                        <h3 className="text-2xl md:text-3xl font-bold text-white tracking-wide font-serif drop-shadow-md group-hover:translate-x-1 transition-transform">
                          {cat.name}
                        </h3>

                        <div className="mt-3 flex items-center text-xs font-medium text-white/90 group-hover:text-white">
                          <span>View Catalogue</span>
                          <span className="ml-1.5 transition-transform group-hover:translate-x-1">→</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-24 bg-black rounded-2xl border border-[#1f2025] p-8">
            <h3 className="text-lg font-medium text-white mb-2">
              {currentCategoryObj?.name || 'Category'} is Empty
            </h3>
            <p className="text-sm text-neutral-400 mb-6">
              No products have been added to this category yet.
            </p>
            <button
              onClick={handleBackHome}
              className="px-5 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-sm font-medium transition-colors"
            >
              ← Back to All Categories
            </button>
          </div>
        ) : (
          /* 2. CATALOGUE PRODUCT GRID */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {displayProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onInquire={() => {
                  const message = `Hello ${STORE_CONFIG.storeName}, I want to know more about ${product.name} (SKU: ${product.sku})`;
                  const url = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
                  window.open(url, '_blank');
                }}
                onAdd={() => handleAddToCartClick(product)}
                onImageClick={() => setZoomedProduct(product)}
                isInCart={cart.some(item => item.product.id === product.id)}
              />
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Print-Only Product Grid with Repeating Header */}
      <table className="hidden print:table w-full max-w-7xl mx-auto">
        <thead className="table-header-group">
          <tr>
            <td className="pb-6 pt-4">
              <div className="flex items-end space-x-3 pb-1">
                <img src="/Logonew.png" alt="Logo" className="h-12 w-auto object-contain shrink-0" />
                <h1 
                  className="text-xl font-bold font-serif tracking-wide leading-none pb-1"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #fff5c0 0%, #e8c566 22%, #fff9d6 44%, #aa771c 68%, #fbf3b9 88%, #c59b27 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Imitation Jewellery
                </h1>
              </div>
              <div className="h-px bg-neutral-800 w-full mt-4"></div>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {printGroups.sortedCategories.length === 0 ? (
                <div className="text-center py-20 text-white">No products to print.</div>
              ) : (
                printGroups.sortedCategories.map(cat => (
                  <div key={cat} className="mb-12">
                    <div className="flex items-center gap-4 mb-6">
                      <h2 className="text-2xl font-bold text-brand whitespace-nowrap">{cat}</h2>
                      <div className="h-px bg-neutral-300 flex-grow mt-1"></div>
                    </div>
                    
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
          <div className="bg-black rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#1f2025]">
            <h3 className="text-xl font-bold text-white mb-2">Export PDF Catalogue</h3>
            <p className="text-sm text-neutral-400 mb-4">Select which categories to include in the generated PDF.</p>
            
            <div className="max-h-[300px] overflow-y-auto border border-[#1f2025] bg-[#0f1015] rounded-xl p-3 mb-6 space-y-2">
              <label className="flex items-center p-2 hover:bg-black rounded-lg cursor-pointer border-b border-[#1f2025] mb-2 pb-2">
                <input 
                  type="checkbox" 
                  checked={exportSelectedCategories.length === categories.length && categories.length > 0}
                  onChange={e => {
                    if (e.target.checked) {
                      setExportSelectedCategories(categories.map(c => c.id));
                    } else {
                      setExportSelectedCategories([]);
                    }
                  }}
                  className="w-4 h-4 text-brand rounded focus:ring-brand"
                />
                <span className="ml-3 font-medium text-white text-sm">Select All Categories</span>
              </label>
              
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center p-2 hover:bg-black rounded-lg cursor-pointer text-sm">
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
                  <span className="ml-3 text-neutral-200">{cat.name}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2.5 rounded-lg font-medium text-neutral-400 hover:bg-neutral-900 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (exportSelectedCategories.length === 0) {
                    toast.error('Please select at least one category to export.');
                    return;
                  }
                  setTimeout(() => {
                    window.print();
                    setIsExportModalOpen(false);
                  }, 100);
                }}
                className="px-6 py-2.5 rounded-lg font-medium bg-white text-black hover:bg-neutral-200 transition-colors shadow-sm text-sm"
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
