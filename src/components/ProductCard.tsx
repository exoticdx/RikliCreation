import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product } from './CatalogueClient';
import { MessageCircle } from 'lucide-react';
import { STORE_CONFIG } from '@/config/store.config';

interface ProductCardProps {
  product: Product;
  onInquire: () => void;
  onAdd?: () => void;
  onImageClick?: () => void;
  isInCart?: boolean;
  priority?: boolean;
  disableLazy?: boolean;
}

export default function ProductCard({
  product,
  onInquire,
  priority = false,
  disableLazy = false,
}: ProductCardProps) {
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [useFallbackImg, setUseFallbackImg] = useState(false);

  // Auto reset isOpening if navigation finishes or user comes back
  useEffect(() => {
    if (!isOpening) return;
    const t = setTimeout(() => setIsOpening(false), 2000);
    const reset = () => setIsOpening(false);
    window.addEventListener('pageshow', reset);
    window.addEventListener('popstate', reset);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pageshow', reset);
      window.removeEventListener('popstate', reset);
    };
  }, [isOpening]);

  const displayImage = product.imageUrl;
  const canOptimizeImage = Boolean(
    displayImage &&
      (displayImage.startsWith('https://') || displayImage.startsWith('/')) &&
      !useFallbackImg
  );

  useEffect(() => {
    setIsImageLoaded(false);
    setUseFallbackImg(false);
  }, [displayImage]);

  // Preserve current query parameters (e.g. ?cat=...) or fallback to product category
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const query = search || (product.categoryId ? `?cat=${encodeURIComponent(product.categoryId)}` : '');
  const productHref = `/product/${product.id}${query}`;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    setIsOpening(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('catalogueScrollPos', window.scrollY.toString());
      window.dispatchEvent(new Event('app-nav-start'));
    }
    router.push(productHref);
  };

  const sizes = product.attributes?.sizes || product.attributes?.Size || product.attributes?.size;

  return (
    <div 
      onClick={handleCardClick}
      className="relative bg-black rounded-xl overflow-hidden shadow-sm border border-[#1f2025] hover:border-neutral-700 md:hover:shadow-md transition-all group flex flex-col h-full print:break-inside-avoid cursor-pointer"
    >
      {/* Immediate Loading Overlay on Click */}
      {isOpening && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-2.5 animate-in fade-in duration-150">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[11px] font-medium text-white tracking-widest uppercase">Opening...</span>
        </div>
      )}

      {/* Product Image */}
      <Link 
        href={productHref}
        className="relative aspect-square bg-neutral-900 w-full overflow-hidden block"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpening(true);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('catalogueScrollPos', window.scrollY.toString());
            window.dispatchEvent(new Event('app-nav-start'));
          }
        }}
      >
        {displayImage ? (
          <>
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-neutral-900 animate-pulse" />
            )}
            {canOptimizeImage ? (
              <Image
                src={displayImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                quality={75}
                loading={disableLazy || priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : 'auto'}
                decoding="async"
                onLoad={() => setIsImageLoaded(true)}
                onError={() => {
                  setUseFallbackImg(true);
                  setIsImageLoaded(true);
                }}
                className={`object-cover md:group-hover:scale-105 transition-all duration-300 ${
                  isImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ) : (
              <img 
                src={displayImage} 
                alt={product.name}
                loading={disableLazy || priority ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={() => setIsImageLoaded(true)}
                className={`w-full h-full object-cover md:group-hover:scale-105 transition-all duration-300 ${
                  isImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 font-medium text-sm">
            No Image
          </div>
        )}
      </Link>

      {/* Card Body */}
      <div className="p-3 md:p-4 flex flex-col flex-grow">
        <div className="text-[10px] md:text-xs text-neutral-400 mb-1 font-mono uppercase tracking-wider line-clamp-1">
          SKU: {product.sku}
        </div>
        
        <Link 
          href={productHref}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpening(true);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('catalogueScrollPos', window.scrollY.toString());
              window.dispatchEvent(new Event('app-nav-start'));
            }
          }}
          className="hover:text-brand transition-colors block"
        >
          <h3 className="font-medium text-white mb-1 leading-snug text-sm md:text-base line-clamp-1 md:line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        {/* Price */}
        {product.attributes?.price && (
          <div className="font-medium text-white text-sm md:text-base mb-2">
            ₹{Number(product.attributes.price).toLocaleString('en-IN')}
          </div>
        )}

        {/* Available Sizes preview if exists */}
        {sizes && (
          <div className="text-[11px] text-neutral-400 mb-2">
            <span className="text-neutral-500 font-medium">Sizes: </span>
            {sizes}
          </div>
        )}

        {/* Dynamic Attributes */}
        <div className="flex-grow">
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 mb-2">
              {STORE_CONFIG.customFields.map(field => {
                if (field.key === 'price' || field.key === 'sizes' || field.key === 'Size' || field.key === 'size') return null;
                
                const val = product.attributes![field.key];
                if (val === undefined || val === null || val === '') return null;
                
                const displayVal = typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val);
                
                return (
                  <span key={field.key} className="text-[10px] md:text-xs bg-neutral-900 text-neutral-400 px-1.5 py-0.5 rounded">
                    <span className="font-medium">{field.label}:</span> {displayVal}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex flex-col space-y-2 mt-auto z-10 relative pt-2">
          {/* Print-only WhatsApp Link */}
          <a 
            href={`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(`Hello ${STORE_CONFIG.storeName}, I want to know about ${product.name} (SKU: ${product.sku})`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden print:block text-xs font-medium underline text-center"
            style={{ color: STORE_CONFIG.colors.buttonBackground }}
          >
            Send Inquiry on WhatsApp
          </a>

          {/* Web-only Buttons */}
          <div className="print:hidden flex flex-col space-y-2">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onInquire();
              }}
              className="w-full flex items-center justify-center space-x-1.5 md:space-x-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-2 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-colors active:scale-95 shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Inquire on WhatsApp</span>
              <span className="sm:hidden">Inquire</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
