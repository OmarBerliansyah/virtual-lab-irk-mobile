import Toast from 'react-native-toast-message';

interface ToastOptions {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

export function useToast() {
  const toast = ({ title, description, type = 'success' }: ToastOptions) => {
    Toast.show({
      type: type === 'error' ? 'error' : type === 'info' ? 'info' : 'success',
      text1: title,
      text2: description,
      position: 'top',
      visibilityTime: 4000,
    });
  };

  return { toast };
}
