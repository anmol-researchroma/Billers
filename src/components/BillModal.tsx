'use client';

import React from 'react';
import { Download, Printer, Check, X, PlusCircle } from 'lucide-react';
import { Company } from '@/types/billing';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewBill: () => void;
  onDownloadAgain: () => void;
  onPrint: () => void;
  imageUrl: string | null;
  company: Company;
  invoiceNumber: string;
}

export const BillModal: React.FC<BillModalProps> = ({
  isOpen,
  onClose,
  onNewBill,
  onDownloadAgain,
  onPrint,
  imageUrl,
  company,
  invoiceNumber,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-[#10182A] border border-[#26344A] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#26344A] bg-[#10182A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center justify-center shadow-xs">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#F1F5F9]">
                Bill Generated &amp; Downloaded!
              </h3>
              <p className="text-xs text-[#94A3B8] font-mono">
                Saved as: <strong className="text-[#00C8FF]">Bill_{company}_{invoiceNumber}.png</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#F1F5F9] rounded-lg hover:bg-[#151F33] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Screenshot Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex items-center justify-center bg-[#080D19]/90">
          {imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt={`Bill ${invoiceNumber}`}
              className="max-w-full max-h-[60vh] object-contain rounded-xl border border-[#26344A] shadow-2xl"
            />
          ) : (
            <div className="p-8 text-[#94A3B8] text-sm">Preparing screenshot preview...</div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 p-3.5 sm:p-4 border-t border-[#26344A] bg-[#10182A]">
          <button
            type="button"
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs sm:text-sm font-bold text-[#F1F5F9] bg-[#151F33] hover:bg-[#1A263D] border border-[#26344A] transition-colors cursor-pointer"
            onClick={onDownloadAgain}
          >
            <Download className="w-4 h-4 text-[#00C8FF]" />
            <span>Download PNG Again</span>
          </button>

          <button
            type="button"
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs sm:text-sm font-bold text-[#F1F5F9] bg-[#151F33] hover:bg-[#1A263D] border border-[#26344A] transition-colors cursor-pointer"
            onClick={onPrint}
          >
            <Printer className="w-4 h-4 text-[#3B82F6]" />
            <span>Print Invoice</span>
          </button>

          <button
            type="button"
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-xs sm:text-sm font-bold text-[#080D19] bg-[#10B981] hover:bg-[#059669] shadow-md shadow-[#10B981]/20 transition-colors cursor-pointer active:scale-95"
            onClick={() => {
              onNewBill();
              onClose();
            }}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Start Next Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
