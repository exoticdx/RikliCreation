import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from './CatalogueClient';
import { MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { STORE_CONFIG } from '@/config/store.config';

interface ProductCardProps {
  product: Product;
  onInquire: () => void;
  onAdd?: () => void;
  onImageClick?: () => void;
  isInCart?: boolean;
}

export default function ProductCard({ product, onInquire, onAdd, onImageClick, isInCart }: ProductCardProps) {
  const router = useRouter();
  const [activeColorIdx, setActiveColorIdx] = useState<number | null>(null);
  const [isOpening, setIsOpening] = useState(false);

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

  const colors = product.attributes?.colors || [];
  const displayImage = activeColorIdx !== null && colors[activeColorIdx] ? colors[activeColorIdx].imageUrl : product.imageUrl;

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click is on an interactive element (button, link, input), let it handle its own event
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    setIsOpening(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('app-nav-start'));
    }
    router.push(`/product/${product.id}`);
  };

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
        href={`/product/${product.id}`}
        className="relative aspect-square bg-neutral-900 w-full overflow-hidden block"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpening(true);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('app-nav-start'));
          }
        }}
      >
        {displayImage ? (
          <img 
            src={displayImage} 
            alt={product.name} 
            className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 font-medium text-sm">
            No Image
          </div>
        )}

        {/* Color Badge indicator if variant active */}
        {activeColorIdx !== null && colors[activeColorIdx] && (
          <span className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-sm border border-white/10 text-[10px] text-white px-2 py-0.5 rounded-full font-medium">
            {colors[activeColorIdx].name}
          </span>
        )}
      </Link>

      {/* Card Body */}
      <div className="p-3 md:p-4 flex flex-col flex-grow">
        <div className="text-[10px] md:text-xs text-neutral-400 mb-1 font-mono uppercase tracking-wider line-clamp-1">
          SKU: {product.sku}
        </div>
        
        <Link 
          href={`/product/${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpening(true);
            if (typeof window !== 'undefined') {
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
        
        {/* Color Swatches */}
        {colors.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button 
              type="button"
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                setActiveColorIdx(null); 
              }}
              className={`text-[10px] md:text-xs px-2 py-1 rounded-full border transition-colors ${
                activeColorIdx === null 
                  ? 'bg-white text-black border-white font-medium shadow-sm' 
                  : 'border-white/20 bg-white/5 text-white/50 hover:border-white/40 hover:text-white/80'
              }`}
            >
              {product.attributes?.color || 'Default'}
            </button>
            {colors.map((c: any, idx: number) => (
              <button 
                key={idx}
                type="button"
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  setActiveColorIdx(idx); 
                }}
                className={`text-[10px] md:text-xs px-2 py-1 rounded-full border transition-colors ${
                  activeColorIdx === idx 
                    ? 'bg-white text-black border-white font-medium shadow-sm' 
                    : 'border-white/20 bg-white/5 text-white/50 hover:border-white/40 hover:text-white/80'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Attributes */}
        <div className="flex-grow">
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 mb-2">
              {STORE_CONFIG.customFields.map(field => {
                if (field.key === 'price') return null; // Price is highlighted above
                
                const val = product.attributes![field.key];
                if (val === undefined || val === null || val === '') return null;
                
                let displayVal = val;
                if (field.type === 'boolean') {
                  displayVal = val ? 'Yes' : 'No';
                } else if (field.type === 'sizes_manager') {
                  if (Array.isArray(val)) {
                    const available = val.filter(s => s.inStock).map(s => s.size);
                    if (available.length === 0) return null;
                    displayVal = available.join(', ');
                  }
                }
                
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
            href={`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(`I want to know about this product, product sku is ${product.sku}`)}`}
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
              className="w-full flex items-center justify-center space-x-1.5 md:space-x-2 bg-brand md:hover:bg-brand-dark text-button-text px-2 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors active:scale-95"
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
