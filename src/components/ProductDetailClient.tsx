'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MessageCircle, 
  Share2, 
  Copy, 
  Check, 
  ZoomIn, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  ShieldCheck,
  Truck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Product } from './CatalogueClient';
import { STORE_CONFIG } from '@/config/store.config';
import ImageModal from './ImageModal';
import ProductCard from './ProductCard';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts?: Product[];
}

export default function ProductDetailClient({ product, relatedProducts = [] }: ProductDetailClientProps) {
  const primaryColorName = product.attributes?.color || 'Primary Color';
  const colorVariants: { name: string; imageUrl: string }[] = Array.isArray(product.attributes?.colors) 
    ? product.attributes.colors 
    : [];
  const galleryImages: string[] = Array.isArray(product.attributes?.gallery) 
    ? product.attributes.gallery 
    : [];

  // Build the complete list of photos, associating each with its color name
  const allPhotos = useMemo(() => {
    const list: { id: string; label: string; url: string; colorName?: string; isColor: boolean }[] = [];

    if (product.imageUrl) {
      list.push({
        id: 'primary',
        label: primaryColorName,
        url: product.imageUrl,
        colorName: primaryColorName,
        isColor: true
      });
    }

    colorVariants.forEach((c, idx) => {
      if (c.imageUrl) {
        list.push({
          id: `color-${idx}`,
          label: c.name || `Color ${idx + 1}`,
          url: c.imageUrl,
          colorName: c.name || `Color ${idx + 1}`,
          isColor: true
        });
      }
    });

    galleryImages.forEach((url, idx) => {
      if (url && !list.some(p => p.url === url)) {
        list.push({
          id: `gallery-${idx}`,
          label: `Photo ${idx + 1}`,
          url,
          isColor: false
        });
      }
    });

    return list;
  }, [product.imageUrl, primaryColorName, colorVariants, galleryImages]);

  // State
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>(primaryColorName);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isCopiedSku, setIsCopiedSku] = useState(false);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);

  // Available Sizes from attributes if any
  const availableSizes = useMemo(() => {
    const sizeVal = product.attributes?.Size || product.attributes?.size;
    if (!sizeVal) return [];
    if (Array.isArray(sizeVal)) {
      return sizeVal.map(s => (typeof s === 'object' && s !== null ? s.size : String(s)));
    }
    if (typeof sizeVal === 'string') {
      return sizeVal.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [String(sizeVal)];
  }, [product.attributes]);

  // Handle color selection
  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName);
    const photoIdx = allPhotos.findIndex(p => p.colorName?.toLowerCase() === colorName.toLowerCase());
    if (photoIdx !== -1) {
      setActivePhotoIndex(photoIdx);
    }
  };

  // Handle thumbnail click
  const handlePhotoSelect = (idx: number) => {
    setActivePhotoIndex(idx);
    const photo = allPhotos[idx];
    if (photo && photo.colorName) {
      setSelectedColor(photo.colorName);
    }
  };

  const handleNextPhoto = () => {
    if (allPhotos.length <= 1) return;
    const nextIdx = (activePhotoIndex + 1) % allPhotos.length;
    handlePhotoSelect(nextIdx);
  };

  const handlePrevPhoto = () => {
    if (allPhotos.length <= 1) return;
    const prevIdx = (activePhotoIndex - 1 + allPhotos.length) % allPhotos.length;
    handlePhotoSelect(prevIdx);
  };

  const handleCopySku = () => {
    navigator.clipboard.writeText(product.sku);
    setIsCopiedSku(true);
    toast.success('SKU copied to clipboard');
    setTimeout(() => setIsCopiedSku(false), 2000);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      if (navigator.share) {
        navigator.share({
          title: `${product.name} | ${STORE_CONFIG.storeName}`,
          text: `Check out ${product.name} (SKU: ${product.sku}) on ${STORE_CONFIG.storeName}`,
          url: window.location.href,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Product link copied to clipboard');
      }
    }
  };

  const activePhoto = allPhotos[activePhotoIndex] || allPhotos[0];

  // WhatsApp Inquiry URL
  const whatsappUrl = useMemo(() => {
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const lines = [
      `Hello ${STORE_CONFIG.storeName},`,
      `I am interested in this product:`,
      `• *Product:* ${product.name}`,
      `• *SKU:* ${product.sku}`,
      `• *Color:* ${selectedColor || 'Default'}`,
    ];
    if (selectedSize) {
      lines.push(`• *Size:* ${selectedSize}`);
    }
    if (product.attributes?.price) {
      lines.push(`• *Price:* ₹${Number(product.attributes.price).toLocaleString('en-IN')}`);
    }
    if (pageUrl) {
      lines.push(`• *Link:* ${pageUrl}`);
    }
    lines.push(`Please share details and availability.`);
    return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  }, [product, selectedColor, selectedSize]);

  // Collect all image URLs for zoom modal
  const zoomImages = useMemo(() => {
    return allPhotos.map(p => p.url).filter(Boolean);
  }, [allPhotos]);

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-[#1f2025] px-4 md:px-8 h-[68px] md:h-[76px] flex items-center justify-between">
        <div className="flex items-center space-x-3 md:space-x-4">
          <Link 
            href="/"
            onClick={() => {
              setIsNavigatingBack(true);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('app-nav-start'));
              }
            }}
            className="flex items-center space-x-1.5 text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 border border-[#1f2025] transition-colors text-xs md:text-sm font-medium"
          >
            {isNavigatingBack ? (
              <div className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Back to Catalogue</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="h-4 w-px bg-[#1f2025]"></div>
          <Link href="/" className="flex items-center space-x-2">
            <img src="/Logo.png" alt={STORE_CONFIG.storeName} className="h-8 md:h-9 w-auto object-contain" />
            <span className="font-serif font-bold text-base md:text-lg text-white tracking-tight hidden md:inline">
              {STORE_CONFIG.storeName}
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleShare}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 border border-[#1f2025] rounded-lg transition-colors text-xs font-medium flex items-center space-x-1.5"
            title="Share Product"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-brand hover:bg-brand-dark text-button-text px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Inquire</span>
          </a>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-xs md:text-sm text-neutral-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          {product.attributes?.parent_category && (
            <>
              <span className="text-neutral-400">{product.attributes.parent_category}</span>
              <span>/</span>
            </>
          )}
          {product.category?.name && (
            <>
              <span className="text-neutral-400">{product.category.name}</span>
              <span>/</span>
            </>
          )}
          <span className="text-white font-medium truncate max-w-[200px]">{product.name}</span>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LEFT COLUMN: Main Photo & All Color Photos */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            
            {/* Main Photo Viewport */}
            <div className="relative aspect-[3/4] md:aspect-square w-full bg-[#0f1015] rounded-2xl overflow-hidden border border-[#1f2025] group shadow-xl">
              {activePhoto?.url ? (
                <img 
                  src={activePhoto.url} 
                  alt={`${product.name} - ${activePhoto.label}`}
                  className="w-full h-full object-cover transition-transform duration-500 cursor-zoom-in"
                  onClick={() => setIsZoomOpen(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-500 text-sm">
                  No Image Available
                </div>
              )}

              {/* Active Color Tag on Photo */}
              {activePhoto?.colorName && (
                <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-medium text-white flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand"></span>
                  <span>Color: {activePhoto.colorName}</span>
                </div>
              )}

              {/* Zoom Trigger Button */}
              {activePhoto?.url && (
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/70 backdrop-blur-md text-white hover:bg-black border border-white/10 transition-colors shadow-md"
                  title="Click to Zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              )}

              {/* Prev / Next Arrows */}
              {allPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handlePrevPhoto(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black text-white border border-white/10 transition-colors opacity-90 md:opacity-0 md:group-hover:opacity-100 shadow-lg"
                    aria-label="Previous Photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleNextPhoto(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black text-white border border-white/10 transition-colors opacity-90 md:opacity-0 md:group-hover:opacity-100 shadow-lg"
                    aria-label="Next Photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Photo Counter */}
              {allPhotos.length > 1 && (
                <div className="absolute bottom-4 right-4 z-10 bg-black/75 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-md text-[11px] font-mono text-neutral-300">
                  {activePhotoIndex + 1} / {allPhotos.length}
                </div>
              )}
            </div>

            {/* ALL PHOTOS OF COLOURS SHOWCASE SECTION */}
            <div className="bg-[#0f1015] border border-[#1f2025] rounded-2xl p-4 md:p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-brand" />
                  <h3 className="font-semibold text-sm md:text-base text-white">
                    All Color Photos & Gallery
                  </h3>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  {allPhotos.length} {allPhotos.length === 1 ? 'photo' : 'photos'}
                </span>
              </div>

              {allPhotos.length === 0 ? (
                <p className="text-xs text-neutral-500 py-2">No additional color photos uploaded.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {allPhotos.map((photo, idx) => {
                    const isActive = idx === activePhotoIndex;
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => handlePhotoSelect(idx)}
                        className={`group flex flex-col items-center rounded-xl p-1.5 border text-left transition-all ${
                          isActive 
                            ? 'border-brand bg-brand/10 ring-1 ring-brand shadow-lg' 
                            : 'border-[#1f2025] bg-black hover:border-neutral-600'
                        }`}
                      >
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-neutral-900 mb-1.5">
                          <img 
                            src={photo.url} 
                            alt={photo.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                          {isActive && (
                            <div className="absolute top-1 right-1 bg-brand text-black rounded-full p-0.5">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className={`text-[11px] font-medium truncate w-full text-center px-1 ${
                          isActive ? 'text-brand font-semibold' : 'text-neutral-300 group-hover:text-white'
                        }`}>
                          {photo.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Product Details, Description & WhatsApp Inquiry */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* Title & SKU & Price Box */}
            <div className="bg-[#0f1015] border border-[#1f2025] rounded-2xl p-6 shadow-md space-y-4">
              
              {/* Category & Badge */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {product.attributes?.parent_category && (
                    <span className="text-xs bg-neutral-900 border border-[#1f2025] text-neutral-300 px-2.5 py-1 rounded-md font-medium">
                      {product.attributes.parent_category}
                    </span>
                  )}
                  {product.category?.name && (
                    <span className="text-xs bg-brand/10 border border-brand/20 text-brand px-2.5 py-1 rounded-md font-medium">
                      {product.category.name}
                    </span>
                  )}
                </div>

                {/* In Stock Badge */}
                <span className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>In Stock</span>
                </span>
              </div>

              {/* Product Name */}
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight font-serif leading-tight">
                {product.name}
              </h1>

              {/* SKU & Copy Action */}
              <div className="flex items-center justify-between text-xs py-2 px-3 bg-black rounded-xl border border-[#1f2025]">
                <div className="flex items-center space-x-2">
                  <span className="text-neutral-400 font-medium">Product SKU:</span>
                  <span className="font-mono font-bold text-white tracking-wider">{product.sku}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySku}
                  className="flex items-center space-x-1 text-neutral-400 hover:text-white transition-colors"
                  title="Copy SKU"
                >
                  {isCopiedSku ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{isCopiedSku ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Price */}
              {product.attributes?.price ? (
                <div className="pt-2 border-t border-[#1f2025]">
                  <div className="text-xs text-neutral-400 mb-0.5">Wholesale / Unit Price</div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-white tracking-tight">
                      ₹{Number(product.attributes.price).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">(Exclusive of taxes)</span>
                  </div>
                </div>
              ) : null}

              {/* Color Selection Swatches */}
              <div className="pt-3 border-t border-[#1f2025] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs md:text-sm font-medium text-neutral-300">
                    Selected Color: <span className="text-white font-bold">{selectedColor}</span>
                  </label>
                  <span className="text-[11px] text-neutral-500">
                    {1 + colorVariants.length} Available
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Primary Color Pill */}
                  <button
                    type="button"
                    onClick={() => handleColorSelect(primaryColorName)}
                    className={`text-xs px-3.5 py-1.5 rounded-full border transition-all flex items-center space-x-1.5 ${
                      selectedColor === primaryColorName
                        ? 'border-brand bg-brand/10 text-brand font-semibold shadow-sm'
                        : 'border-[#1f2025] bg-black text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-brand"></span>
                    <span>{primaryColorName}</span>
                  </button>

                  {/* Other Color Variants */}
                  {colorVariants.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleColorSelect(c.name)}
                      className={`text-xs px-3.5 py-1.5 rounded-full border transition-all flex items-center space-x-1.5 ${
                        selectedColor === c.name
                          ? 'border-brand bg-brand/10 text-brand font-semibold shadow-sm'
                          : 'border-[#1f2025] bg-black text-neutral-400 hover:border-neutral-600'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selector if available */}
              {availableSizes.length > 0 && (
                <div className="pt-3 border-t border-[#1f2025] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs md:text-sm font-medium text-neutral-300">
                      Select Size {selectedSize && <span className="text-brand font-bold">({selectedSize})</span>}
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size === selectedSize ? '' : size)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selectedSize === size
                            ? 'bg-brand text-button-text border-brand font-bold shadow-md'
                            : 'bg-black text-neutral-300 border-[#1f2025] hover:border-neutral-600'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Primary Call to Action: WhatsApp Inquiry */}
              <div className="pt-4 border-t border-[#1f2025] space-y-2.5">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2.5 bg-brand hover:bg-brand-dark text-button-text py-3.5 px-6 rounded-xl font-medium text-sm md:text-base transition-transform active:scale-[0.98] shadow-lg shadow-brand/10"
                >
                  <MessageCircle className="w-5 h-5 shrink-0" />
                  <span>Inquire on WhatsApp</span>
                </a>
                <p className="text-[11px] text-center text-neutral-400">
                  Direct message with SKU, selected color & size pre-filled.
                </p>
              </div>

            </div>

            {/* PRODUCT DESCRIPTION SECTION */}
            <div className="bg-[#0f1015] border border-[#1f2025] rounded-2xl p-6 shadow-md space-y-3">
              <h3 className="font-semibold text-base text-white border-b border-[#1f2025] pb-2.5">
                Product Description
              </h3>

              {product.description && product.description.trim() ? (
                <div className="text-neutral-300 text-sm leading-relaxed whitespace-pre-line space-y-2">
                  {product.description}
                </div>
              ) : (
                <div className="text-neutral-500 text-sm italic py-2">
                  Premium quality craftsmanship from {STORE_CONFIG.storeName}. Contact us on WhatsApp for custom design inquiries, fabric specifications, or bulk order pricing.
                </div>
              )}

              {/* Dynamic Specifications */}
              {STORE_CONFIG.customFields.length > 0 && (
                <div className="pt-4 border-t border-[#1f2025] space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Specifications
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {STORE_CONFIG.customFields.map(f => {
                      if (f.key === 'price' || f.key === 'Size' || f.key === 'size') return null;
                      const val = product.attributes?.[f.key];
                      if (val === undefined || val === null || val === '') return null;
                      const display = typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val);
                      return (
                        <div key={f.key} className="bg-black p-2.5 rounded-lg border border-[#1f2025]">
                          <span className="text-neutral-400 block text-[10px] uppercase font-medium">{f.label}</span>
                          <span className="text-white font-medium">{display}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Trust & Guarantee Badges */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#0f1015] border border-[#1f2025] rounded-xl p-3 flex items-center space-x-2.5 text-neutral-300">
                <ShieldCheck className="w-5 h-5 text-brand shrink-0" />
                <span>Direct Manufacturer Quality Guaranteed</span>
              </div>
              <div className="bg-[#0f1015] border border-[#1f2025] rounded-xl p-3 flex items-center space-x-2.5 text-neutral-300">
                <Truck className="w-5 h-5 text-brand shrink-0" />
                <span>Pan-India Wholesale Delivery</span>
              </div>
            </div>

          </div>

        </div>

        {/* RELATED PRODUCTS SECTION */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-10 border-t border-[#1f2025]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white font-serif">More from Rikli Creation</h2>
                <p className="text-xs text-neutral-400 mt-1">Explore similar items from our collection</p>
              </div>
              <Link 
                href="/" 
                className="text-xs md:text-sm font-medium text-brand hover:underline flex items-center space-x-1"
              >
                <span>View Full Catalogue</span>
                <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.slice(0, 4).map(p => (
                <ProductCard 
                  key={p.id}
                  product={p}
                  onInquire={() => {
                    const message = `Hello Rikli Creation, I want to know more about ${p.sku} (${p.name})`;
                    const url = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
                    window.open(url, '_blank');
                  }}
                  onAdd={() => {}}
                  onImageClick={() => {}}
                  isInCart={false}
                />
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Fullscreen Zoom Modal */}
      {isZoomOpen && (
        <ImageModal
          product={product}
          images={zoomImages}
          initialIndex={activePhotoIndex}
          onClose={() => setIsZoomOpen(false)}
        />
      )}
    </div>
  );
}
