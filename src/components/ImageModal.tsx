import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Product } from './CatalogueClient';

interface ImageModalProps {
  product: Product;
  onClose: () => void;
  images?: string[];
  initialIndex?: number;
}

export default function ImageModal({ product, onClose, images: propImages, initialIndex = 0 }: ImageModalProps) {
  const defaultImages = [product.imageUrl];
  if (product.attributes?.gallery && Array.isArray(product.attributes.gallery)) {
    defaultImages.push(...product.attributes.gallery);
  }
  if (product.attributes?.colors && Array.isArray(product.attributes.colors)) {
    product.attributes.colors.forEach((c: any) => {
      if (c.imageUrl && !defaultImages.includes(c.imageUrl)) {
        defaultImages.push(c.imageUrl);
      }
    });
  }

  const images = propImages && propImages.length > 0 ? propImages : defaultImages.filter(Boolean);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-[110] p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex-1 w-full relative flex items-center justify-center p-4">
        {images.length > 1 && (
          <button onClick={handlePrev} className="absolute left-4 z-[110] p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors">
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        <TransformWrapper
          key={currentIndex} // Reset zoom on image change
          initialScale={1}
          minScale={1}
          maxScale={5}
          centerZoomedOut={true}
          centerOnInit={true}
          wheel={{ step: 0.1 }}
          doubleClick={{ step: 0.5 }}
        >
          <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src={images[currentIndex]} 
              alt={`${product.name} - Image ${currentIndex + 1}`} 
              className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
              style={{ maxHeight: '80vh' }}
              draggable={false}
            />
          </TransformComponent>
        </TransformWrapper>

        {images.length > 1 && (
          <button onClick={handleNext} className="absolute right-4 z-[110] p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors">
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="h-24 bg-black/50 p-4 flex items-center justify-center gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all shrink-0 ${idx === currentIndex ? 'border-amber-400 opacity-100 scale-105' : 'border-transparent opacity-50 hover:opacity-100'}`}
            >
              <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
