import { message } from 'antd';

export function useNotifier() {
  const [messageApi, contextHolder] = message.useMessage();

  const notifySuccess = (content: string, onClose?: () => void) => {
    messageApi.open({
      type: 'success',
      content,
      duration: 1.2,
      onClose,
    });
  };

  const notifyError = (content: string, onClose?: () => void) => {
    messageApi.open({
      type: 'error',
      content,
      duration: 1.2,
      onClose,
    });
  };

  const notifyWarning = (content: string, onClose?: () => void) => {
    messageApi.open({
      type: 'warning',
      content,
      duration: 1.2,
      onClose,
    });
  };

  const notifyLoading = (content: string, onClose?: () => void) => {
    messageApi.open({
      type: 'loading',
      content: content,
      duration: 2.5,
      onClose
    });
  };

  return {
    contextHolder,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyLoading
  };
}
