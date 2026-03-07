"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertModal, AlertType } from '@/components/ui/AlertModal';

interface AlertOptions {
  confirmText?: string;
  cancelText?: string;
  type?: AlertType;
}

interface AlertContextType {
  showAlert: (title: string, message: string, type?: AlertType) => Promise<void>;
  showConfirm: (title: string, message: string, options?: AlertOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: AlertType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    showCancel: boolean;
    resolve: (val: any) => void;
  } | null>(null);

  const showAlert = useCallback((title: string, message: string, type: AlertType = 'info') => {
    return new Promise<void>((resolve) => {
      setModal({
        isOpen: true,
        type,
        title,
        message,
        showCancel: false,
        resolve: () => {
          setModal(null);
          resolve();
        },
      });
    });
  }, []);

  const showConfirm = useCallback((title: string, message: string, options?: AlertOptions) => {
    return new Promise<boolean>((resolve) => {
      setModal({
        isOpen: true,
        type: options?.type || 'warning',
        title,
        message,
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        showCancel: true,
        resolve: (val: boolean) => {
          setModal(null);
          resolve(val);
        },
      });
    });
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {modal && (
        <AlertModal
          isOpen={modal.isOpen}
          type={modal.type}
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          showCancel={modal.showCancel}
          onConfirm={() => modal.resolve(true)}
          onCancel={() => modal.resolve(false)}
        />
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
