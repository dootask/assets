import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { toast } from 'sonner';

// 成功通知
export const showSuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
    icon: <CheckCircle className="h-4 w-4" />,
    duration: 3000,
  });
};

// 错误通知
export const showError = (message: string, description?: string) => {
  toast.error(message, {
    description,
    icon: <XCircle className="h-4 w-4" />,
    duration: 5000,
  });
};

// 警告通知
export const showWarning = (message: string, description?: string) => {
  toast.warning(message, {
    description,
    icon: <AlertCircle className="h-4 w-4" />,
    duration: 4000,
  });
};

// 信息通知
export const showInfo = (message: string, description?: string) => {
  toast.info(message, {
    description,
    icon: <Info className="h-4 w-4" />,
    duration: 3000,
  });
};

// 加载通知
export const showLoading = (message: string) => {
  return toast.loading(message, {
    duration: Infinity,
  });
};

// 更新通知
export const updateToast = (
  toastId: string | number,
  type: 'success' | 'error' | 'warning' | 'info',
  message: string,
  description?: string
) => {
  const options = {
    description,
    duration: type === 'error' ? 5000 : 3000,
  };

  switch (type) {
    case 'success':
      toast.success(message, { ...options, id: toastId, icon: <CheckCircle className="h-4 w-4" /> });
      break;
    case 'error':
      toast.error(message, { ...options, id: toastId, icon: <XCircle className="h-4 w-4" /> });
      break;
    case 'warning':
      toast.warning(message, { ...options, id: toastId, icon: <AlertCircle className="h-4 w-4" /> });
      break;
    case 'info':
      toast.info(message, { ...options, id: toastId, icon: <Info className="h-4 w-4" /> });
      break;
  }
};

// 操作结果通知
export const showOperationResult = (
  operation: string,
  success: boolean,
  successCount?: number,
  failedCount?: number,
  errors?: Array<{ error: string }>
) => {
  if (success && failedCount === 0) {
    showSuccess(`${operation}成功`, successCount ? `成功处理 ${successCount} 项` : undefined);
  } else if (successCount && failedCount) {
    showWarning(`${operation}部分成功`, `成功 ${successCount} 项，失败 ${failedCount} 项`);
  } else {
    showError(`${operation}失败`, errors?.[0]?.error);
  }
};

// 确认操作通知
export const showConfirmation = (message: string, onConfirm: () => void, onCancel?: () => void) => {
  toast.custom(
    t => (
      <div className="max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  onConfirm();
                  toast.dismiss(t);
                }}
                className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
              >
                确认
              </button>
              <button
                onClick={() => {
                  onCancel?.();
                  toast.dismiss(t);
                }}
                className="rounded bg-gray-200 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      duration: Infinity,
    }
  );
};
