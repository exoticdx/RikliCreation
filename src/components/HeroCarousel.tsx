'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

interface HeroCarouselProps {
  slides: {
    title: string;
    subtitle: string;
  }[];
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!slides || slides.length === 0) return null;

  return (
    <div className="mb-6 relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {slides.map((slide, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0">
              {/* Metallic Gold Plate Container */}
              <div 
                className="relative rounded-2xl mx-4 my-2 md:mx-8 overflow-hidden h-[160px] md:h-[210px] flex flex-col justify-center select-none"
                style={{
                  background: 'linear-gradient(135deg, #a37318 0%, #d8b248 14%, #fff4b8 28%, #b8860b 46%, #fdf0a6 68%, #855306 88%, #c59828 100%)',
                  boxShadow: '0 12px 32px -4px rgba(0,0,0,0.9), inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -3px 6px rgba(40,22,2,0.85), 0 0 25px rgba(218,165,32,0.2)',
                  border: '1.5px solid #ffe89e',
                }}
              >
                {/* Subtle Metallic Brushed Sheen Overlay */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 4px)',
                  }}
                />

                {/* Inner Engraved Bezel Border Frame */}
                <div 
                  className="absolute inset-2 md:inset-3 rounded-xl pointer-events-none"
                  style={{
                    border: '1.5px solid rgba(75, 48, 5, 0.45)',
                    boxShadow: 'inset 0 1px 1.5px rgba(255,255,255,0.65), inset 0 -1px 1px rgba(0,0,0,0.5), 0 1px 1px rgba(255,255,255,0.5)',
                  }}
                />

                {/* 4 Corner Metallic Fasteners / Rivets */}
                <div className="absolute top-4 left-4 md:top-5 md:left-5 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gradient-to-br from-[#ffe58f] via-[#7d4e04] to-[#2e1800] shadow-[0_1px_2px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.8)] opacity-85" />
                <div className="absolute top-4 right-4 md:top-5 md:right-5 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gradient-to-br from-[#ffe58f] via-[#7d4e04] to-[#2e1800] shadow-[0_1px_2px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.8)] opacity-85" />
                <div className="absolute bottom-4 left-4 md:bottom-5 md:left-5 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gradient-to-br from-[#ffe58f] via-[#7d4e04] to-[#2e1800] shadow-[0_1px_2px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.8)] opacity-85" />
                <div className="absolute bottom-4 right-4 md:bottom-5 md:right-5 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gradient-to-br from-[#ffe58f] via-[#7d4e04] to-[#2e1800] shadow-[0_1px_2px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.8)] opacity-85" />

                {/* Content: Deeply Engraved / Carved Typography */}
                <div className="relative z-10 px-6 py-6 md:px-14 md:py-8 text-center flex flex-col justify-center items-center">
                  
                  {/* Carved Slide Title */}
                  <h2 
                    className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold uppercase tracking-widest font-serif mb-1.5 md:mb-2.5"
                    style={{
                      color: '#2e1902',
                      textShadow: '0 1.5px 1px rgba(255, 255, 255, 0.85), 0 -1.5px 2px rgba(15, 8, 1, 0.95), -1px 0 1px rgba(15, 8, 1, 0.4), 1px 0 1px rgba(255, 255, 255, 0.4)',
                      letterSpacing: '0.12em',
                    }}
                  >
                    {slide.title}
                  </h2>

                  {/* Decorative Minted Hallmark Divider */}
                  <div className="flex items-center justify-center space-x-2 my-1 md:my-1.5 w-full max-w-xs md:max-w-md opacity-80">
                    <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-[#4a2e04] to-transparent shadow-[0_1px_0_rgba(255,255,255,0.6)]" />
                    <span 
                      className="text-[10px] md:text-xs"
                      style={{
                        color: '#3d2503',
                        textShadow: '0 1px 0 rgba(255,255,255,0.8), 0 -1px 1px rgba(0,0,0,0.8)',
                      }}
                    >
                      ✦
                    </span>
                    <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-[#4a2e04] to-transparent shadow-[0_1px_0_rgba(255,255,255,0.6)]" />
                  </div>

                  {/* Carved Subtitle */}
                  <p 
                    className="text-xs sm:text-sm md:text-base font-semibold tracking-wider font-serif max-w-2xl px-2"
                    style={{
                      color: '#3d2706',
                      textShadow: '0 1px 1px rgba(255, 255, 255, 0.8), 0 -1px 1px rgba(20, 10, 1, 0.85)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {slide.subtitle}
                  </p>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Metallic Dots Indicator */}
      <div className="flex justify-center items-center space-x-2 mt-3">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === selectedIndex 
                ? 'w-7 bg-gradient-to-r from-[#ffe082] via-[#e5b948] to-[#aa771c] shadow-[0_0_10px_rgba(234,179,8,0.7)] border border-[#ffec9e]' 
                : 'w-2 bg-neutral-800 border border-neutral-700/60 hover:bg-neutral-700'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
