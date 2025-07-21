'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

type AlertType = 'alert' | 'confirm';
type AlertVariant = 'default' | 'destructive';

export interface AlertProps extends AlertLayoutProps {
  title?: string;
  message?: string;
  variant?: AlertVariant;
}

export interface AlertItemProps extends AlertProps {
  type?: AlertType;
  variant?: AlertVariant;
  onConfirm?: () => void;
  onClose?: () => void;
}

export interface AlertLayoutRef {
  setAlert: (alert: AlertItemProps) => void;
}

export interface AlertLayoutProps {
  confirmText?: string;
  cancelText?: string;
}

const AlertLayout = forwardRef<AlertLayoutRef, AlertLayoutProps>(
  ({ confirmText = '确定', cancelText = '取消' }, ref) => {
    const [waits, setWaits] = useState<AlertItemProps[]>([]);
    const [currentAlert, setCurrentAlert] = useState<AlertItemProps | null>(null);

    useImperativeHandle(ref, () => ({
      setAlert: alert => {
        setWaits(waits => [...waits, alert]);
      },
    }));

    useEffect(() => {
      if (currentAlert) {
        return;
      }
      const current = waits.shift();
      if (current) {
        setCurrentAlert(current);
      }
    }, [waits, currentAlert]);

    if (!currentAlert) {
      return null;
    }

    const handleClose = () => {
      currentAlert.onClose?.();
      setCurrentAlert(null);
    };

    const handleConfirm = () => {
      currentAlert.onConfirm?.();
      setCurrentAlert(null);
    };

    return (
      <AlertDialog open={!!currentAlert} onOpenChange={handleClose}>
        <AlertDialogContent
          onEscapeKeyDown={e => {
            e.preventDefault();
          }}
        >
          <div className="hidden" data-slot="dialog-close" onClick={handleClose}></div>
          <AlertDialogHeader>
            <AlertDialogTitle>{currentAlert.title}</AlertDialogTitle>
            <AlertDialogDescription>{currentAlert.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {currentAlert.type === 'confirm' && (
              <AlertDialogCancel onClick={handleClose}>{currentAlert.cancelText || cancelText}</AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={handleConfirm}
              className={cn(
                currentAlert.variant === 'destructive' &&
                  'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground'
              )}
            >
              {currentAlert.confirmText || confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
);

AlertLayout.displayName = 'AlertLayout';

export default AlertLayout;
