import React, { useState } from 'react';
import { Product } from './CatalogueClient';
import { X, Send } from 'lucide-react';
import { generateWhatsAppLink } from '@/lib/whatsapp';
import toast from 'react-hot-toast';

interface InquiryModalProps {
  product: Product;
  onClose: () => void;
}

export default function InquiryModal({ product, onClose }: InquiryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    mobile: '',
    quantity: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = `*New Inquiry*\n\n*Product:* ${product.name}\n*SKU:* ${product.sku}\n*Quantity:* ${formData.quantity}\n\n*Customer Details:*\nName: ${formData.name}\nCompany: ${formData.company || 'N/A'}\nMobile: ${formData.mobile}`;
    const link = generateWhatsAppLink(message);
    window.open(link, '_blank');
    toast.success('Redirecting to WhatsApp...');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in animate-duration-200">
      <div className="bg-[#0f1015] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 animate-duration-200">
        <div className="flex justify-between items-center p-4 border-b border-[#1f2025] bg-black/50">
          <h3 className="font-semibold text-brand">Inquire about Product</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-900 rounded-full text-neutral-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 bg-black flex gap-4 items-center">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-900 shrink-0">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-mono">SKU: {product.sku}</div>
            <div className="font-medium text-brand leading-tight">{product.name}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Name *</label>
            <input required type="text" className="w-full bg-black text-white border border-[#1f2025] rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" 
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Company Name</label>
            <input type="text" className="w-full bg-black text-white border border-[#1f2025] rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" 
              value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Mobile Number *</label>
            <input required type="tel" className="w-full bg-black text-white border border-[#1f2025] rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" 
              value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Quantity</label>
            <input type="number" min="1" className="w-full bg-black text-white border border-[#1f2025] rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" 
              value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 1})} />
          </div>
          
          <button type="submit" className="w-full flex items-center justify-center space-x-2 bg-brand hover:bg-brand-dark text-white px-4 py-3 rounded-xl font-medium transition-colors mt-6">
            <Send className="w-4 h-4" />
            <span>Submit to WhatsApp</span>
          </button>
        </form>
      </div>
    </div>
  );
}
