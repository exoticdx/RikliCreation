'use client';

import { Toaster, ToastBar, toast } from "react-hot-toast";
import { X } from "lucide-react";

export default function ClientToaster() {
  return (
    <Toaster position="bottom-center">
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <>
              {icon}
              {message}
              {t.type !== 'loading' && (
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="ml-2 p-1 rounded-full text-neutral-400 hover:text-neutral-300 hover:bg-[#1a1b23] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
