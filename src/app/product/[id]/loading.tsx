import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { STORE_CONFIG } from '@/config/store.config';

export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-black text-white pb-20 animate-in fade-in duration-200">
      {/* Header Placeholder */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-[#1f2025] px-4 md:px-8 h-[68px] md:h-[76px] flex items-center justify-between">
        <div className="flex items-center space-x-3 md:space-x-4">
          <Link 
            href="/"
            className="flex items-center space-x-1.5 text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 border border-[#1f2025] transition-colors text-xs md:text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Catalogue</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="h-4 w-px bg-[#1f2025]"></div>
          <div className="flex items-center space-x-2">
            <img src="/Logo.png" alt={STORE_CONFIG.storeName} className="h-8 md:h-9 w-auto object-contain opacity-80" />
            <span className="font-serif font-bold text-base md:text-lg text-white tracking-tight hidden md:inline">
              {STORE_CONFIG.storeName}
            </span>
          </div>
        </div>

        {/* Loading Indicator in Header */}
        <div className="flex items-center space-x-2 text-xs text-neutral-400 font-medium">
          <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
          <span className="hidden sm:inline">Loading details...</span>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center space-x-2 mb-6">
          <div className="h-4 w-12 bg-neutral-900 rounded animate-pulse"></div>
          <span className="text-neutral-600">/</span>
          <div className="h-4 w-20 bg-neutral-900 rounded animate-pulse"></div>
          <span className="text-neutral-600">/</span>
          <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse"></div>
        </div>

        {/* 2-Column Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LEFT COLUMN: Main Image Skeleton & Color Gallery Skeleton */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            
            {/* Main Image Box */}
            <div className="relative aspect-[3/4] md:aspect-square w-full bg-[#0f1015] rounded-2xl overflow-hidden border border-[#1f2025] shadow-xl flex flex-col items-center justify-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 border-3 border-brand border-t-transparent rounded-full animate-spin"></div>
                <div className="text-xs font-medium text-neutral-400 tracking-wider uppercase animate-pulse">
                  Loading Product Images...
                </div>
              </div>

              {/* Shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>

            {/* Colors Showcase Skeleton */}
            <div className="bg-[#0f1015] border border-[#1f2025] rounded-2xl p-4 md:p-6 shadow-md">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex flex-col items-center space-y-2 p-1.5 rounded-xl border border-[#1f2025] bg-black">
                    <div className="aspect-square w-full rounded-lg bg-neutral-900 animate-pulse"></div>
                    <div className="h-3 w-12 bg-neutral-900 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Product Details Skeleton */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* Info Card Skeleton */}
            <div className="bg-[#0f1015] border border-[#1f2025] rounded-2xl p-6 shadow-md space-y-4">
              
              {/* SKU Skeleton */}
              <div className="h-3.5 w-24 bg-neutral-900 rounded animate-pulse"></div>

              {/* Title Skeleton */}
              <div className="space-y-2">
                <div className="h-7 w-3/4 bg-neutral-900 rounded-lg animate-pulse"></div>
                <div className="h-7 w-1/2 bg-neutral-900 rounded-lg animate-pulse"></div>
              </div>

              {/* Price */}
              <div className="pt-3 border-t border-[#1f2025] space-y-1">
                <div className="h-3 w-28 bg-neutral-900 rounded animate-pulse"></div>
                <div className="h-8 w-36 bg-neutral-900 rounded-lg animate-pulse"></div>
              </div>

              {/* Color Swatches Skeleton */}
              <div className="pt-3 border-t border-[#1f2025] space-y-2">
                <div className="h-4 w-32 bg-neutral-900 rounded animate-pulse"></div>
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-neutral-900 rounded-full animate-pulse"></div>
                  <div className="h-8 w-20 bg-neutral-900 rounded-full animate-pulse"></div>
                  <div className="h-8 w-20 bg-neutral-900 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Size Buttons Skeleton */}
              <div className="pt-3 border-t border-[#1f2025] space-y-2">
                <div className="h-4 w-24 bg-neutral-900 rounded animate-pulse"></div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(s => (
                    <div key={s} className="h-8 w-10 bg-neutral-900 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </div>

              {/* WhatsApp Button Skeleton */}
              <div className="pt-4 border-t border-[#1f2025]">
                <div className="h-14 w-full bg-neutral-900 rounded-xl border border-[#1f2025] flex items-center justify-center animate-pulse">
                  <div className="w-5 h-5 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="text-sm font-medium text-neutral-500">Preparing product details...</span>
                </div>
              </div>

            </div>

            {/* Description Card Skeleton */}
            <div className="bg-[#0f1015] border border-[#1f2025] rounded-2xl p-6 shadow-md space-y-3">
              <div className="h-5 w-40 bg-neutral-900 rounded animate-pulse border-b border-[#1f2025] pb-2"></div>
              <div className="space-y-2 pt-2">
                <div className="h-3.5 w-full bg-neutral-900 rounded animate-pulse"></div>
                <div className="h-3.5 w-5/6 bg-neutral-900 rounded animate-pulse"></div>
                <div className="h-3.5 w-4/6 bg-neutral-900 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Guarantee Badges Skeleton */}
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 bg-[#0f1015] border border-[#1f2025] rounded-xl animate-pulse"></div>
              <div className="h-12 bg-[#0f1015] border border-[#1f2025] rounded-xl animate-pulse"></div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
