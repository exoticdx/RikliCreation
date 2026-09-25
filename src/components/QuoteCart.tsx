import React, { useState } from 'react';
import { CartItem } from './CatalogueClient';
import { X, Minus, Plus, Trash2, Send } from 'lucide-react';
import { generateWhatsAppLink } from '@/lib/whatsapp';
import toast from 'react-hot-toast';

interface QuoteCartProps {
  cart: CartItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
}

export default function QuoteCart({ cart, onClose, onRemove, onUpdateQuantity }: QuoteCartProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    mobile: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let message = `*New Bulk Quote Request*\n\n*Customer Details:*\nName: ${formData.name}\nCompany: ${formData.company || 'N/A'}\nMobile: ${formData.mobile}\n\n*Requested Items:*\n`;
    
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.product.name} (SKU: ${item.product.sku}) - Qty: ${item.quantity}\n`;
    });

    const link = generateWhatsAppLink(message);
    window.open(link, '_blank');
    toast.success('Redirecting to WhatsApp...');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in animate-duration-300">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right animate-duration-300">
        <div className="flex justify-between items-center p-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold text-brand">
            {step === 1 ? 'Quote List' : 'Your Details'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4">
          {step === 1 && (
            <>
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-4">
                  <div className="p-4 bg-neutral-50 rounded-full">
                    <Trash2 className="w-8 h-8 opacity-50" />
                  </div>
                  <p>Your quote list is empty.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, idx) => (
                    <div key={`${item.product.id}-${idx}`} className="flex gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <div className="w-20 h-20 bg-white rounded-lg overflow-hidden shrink-0">
                        {item.product.imageUrl && (
                          <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="text-xs text-neutral-400 font-mono">SKU: {item.product.sku}</div>
                          <div className="font-medium text-brand text-sm leading-snug line-clamp-2">{item.product.name}</div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center bg-white border border-neutral-200 rounded-lg">
                            <button onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)} className="p-1 hover:bg-neutral-50 text-neutral-500">
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <button onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)} className="p-1 hover:bg-neutral-50 text-neutral-500">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button onClick={() => {
                            onRemove(item.product.id);
                            toast.success('Removed from Quote List');
                          }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <form id="bulk-quote-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label>
                <input required type="text" className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Company Name</label>
                <input type="text" className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none" 
                  value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Mobile Number *</label>
                <input required type="tel" className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none" 
                  value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
              </div>
            </form>
          )}
        </div>

        <div className="p-4 border-t border-neutral-100 bg-neutral-50">
          {step === 1 ? (
            <button 
              disabled={cart.length === 0}
              onClick={() => setStep(2)}
              className="w-full bg-brand hover:bg-brand-dark disabled:bg-neutral-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-medium transition-colors"
            >
              Request Bulk Quote
            </button>
          ) : (
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-white border border-neutral-300 text-neutral-700 py-3.5 rounded-xl font-medium"
              >
                Back
              </button>
              <button 
                type="submit"
                form="bulk-quote-form"
                className="flex-2 flex items-center justify-center space-x-2 bg-brand hover:bg-brand-dark text-button-text py-3.5 px-6 rounded-xl font-medium"
              >
                <Send className="w-4 h-4" />
                <span>Send via WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
