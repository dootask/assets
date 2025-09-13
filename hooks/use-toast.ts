import { showError, showInfo, showSuccess } from '@/lib/notifications';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export interface Toast {
  (props: ToastProps): void;
}

export const useToast = () => {
  const toast: Toast = ({ title, description, variant = 'default' }) => {
    switch (variant) {
      case 'destructive':
        showError(title, description);
        break;
      case 'success':
        showSuccess(title, description);
        break;
      default:
        showInfo(title, description);
        break;
    }
  };

  return { toast };
};
