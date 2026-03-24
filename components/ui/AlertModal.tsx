"use client";

import React from 'react';
import { 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertModalProps {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function AlertModal({
  isOpen,
  type,
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  showCancel = false
}: AlertModalProps) {
  if (!isOpen) return null;

  const icons = {
    info: <Info className="text-blue-500" size={24} />,
    success: <CheckCircle2 className="text-green-500" size={24} />,
    warning: <AlertTriangle className="text-amber-500" size={24} />,
    error: <AlertCircle className="text-red-500" size={24} />,
  };

  const colors = {
    info: 'bg-blue-50 border-blue-100',
    success: 'bg-green-50 border-green-100',
    warning: 'bg-amber-50 border-amber-100',
    error: 'bg-red-50 border-red-100',
  };

  const buttonColors = {
    info: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    error: 'bg-red-600 hover:bg-red-700',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={cn("p-6 flex flex-col items-center text-center", colors[type])}>
          <div className="mb-4 p-3 bg-white rounded-full shadow-sm">
            {icons[type]}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{message}</p>
        </div>
        
        <div className="p-4 flex gap-3 bg-white">
          {showCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors shadow-sm",
              buttonColors[type]
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
