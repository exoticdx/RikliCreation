import React, { useState } from 'react';
import { Product } from './CatalogueClient';
import { MessageCircle, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { STORE_CONFIG } from '@/config/store.config';

interface ProductCardProps {
  product: Product;
  onInquire: () => void;
  onAdd: () => void;
  onImageClick: () => void;
  isInCart: boolean;
}

export default function ProductCard({ product, onInquire, onAdd, onImageClick, isInCart }: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    onAdd();
    setIsAdded(true);
    toast.success('Added to Quote List');
    setTimeout(() => setIsAdded(false), 2000);
  };

  const showAddedState = isInCart || isAdded;

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-neutral-100 md:hover:shadow-md transition-shadow group flex flex-col h-full print:break-inside-avoid">
      <div 
        className="relative aspect-square bg-neutral-100 w-full overflow-hidden cursor-pointer"
        onClick={onImageClick}
      >
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 font-medium text-sm">
            No Image
          </div>
        )}
      </div>
      <div className="p-3 md:p-4 flex flex-col flex-grow">
        <div className="text-[10px] md:text-xs text-neutral-400 mb-1 font-mono uppercase tracking-wider line-clamp-1">SKU: {product.sku}</div>
        <h3 className="font-medium text-brand mb-1 leading-snug text-sm md:text-base line-clamp-1 md:line-clamp-2">{product.name}</h3>
        
        {/* Price */}
        {product.attributes?.price && (
          <div className="font-medium text-brand text-sm md:text-base mb-2">
            ₹{Number(product.attributes.price).toLocaleString('en-IN')}
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
                  if (available.length === 0) return null; // Don't show if all sizes out of stock
                  displayVal = available.join(', ');
                }
              }
              
              return (
                <span key={field.key} className="text-[10px] md:text-xs bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">
                  <span className="font-medium">{field.label}:</span> {displayVal}
                </span>
              );
            })}
          </div>
        )}
        </div>
        
        <div className="flex flex-col space-y-2 mt-auto z-10 relative pt-2">
          
          {/* Print-only WhatsApp Link */}
          <a 
            href={`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(`I want to know about this product, product sku is ${product.sku}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden print:block text-xs font-medium underline text-center"
            style={{ color: STORE_CONFIG.themeColor }}
          >
            Send Inquiry on WhatsApp
          </a>

          {/* Web-only Buttons */}
          <div className="print:hidden flex flex-col space-y-2">
            <button 
              type="button"
              onClick={onInquire}
              className="w-full flex items-center justify-center space-x-1.5 md:space-x-2 bg-brand md:hover:bg-brand-dark text-white px-2 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Inquire on WhatsApp</span>
              <span className="sm:hidden">Inquire</span>
            </button>
            {/* "Add to Quote" disabled for this catalogue as requested */}
          </div>
        </div>
      </div>
    </div>
  );
}
