import React from 'react';
import { Button } from '../ui/icons/Button';


// Определение типов для вариантов кнопки
type ButtonVariant = 
  | 'default' 
  | 'link' 
  | 'primary' 
  | 'destructive' 
  | 'outline' 
  | 'secondary' 
  | 'ghost';

type ButtonSize = 
  | 'default' 
  | 'sm' 
  | 'md' 
  | 'lg' 
  | 'icon';

interface FilePickerProps {
  onFilesSelected: (paths: string[]) => void;
  options?: Electron.OpenDialogOptions;
  buttonVariant?: ButtonVariant;
  buttonSize?: ButtonSize;
  children?: React.ReactNode;
}

export const FilePicker: React.FC<FilePickerProps> = ({
  onFilesSelected,
  options,
  buttonVariant = 'primary',
  buttonSize = 'sm',
  children,
}) => {
  const handleClick = async () => {
    try {
      // Используем метод openFileDialog вместо fileApi
      if (window.electronAPI?.openFileDialog) {
        const paths = await window.electronAPI.openFileDialog(options);
        if (paths && paths.length > 0) {
          onFilesSelected(paths);
        }
      } else {
        console.error('Electron API is not available');
        // Фолбэк для веб-среды
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = options?.properties?.includes('multiSelections') || false;
        input.onchange = () => {
          if (input.files) {
            const paths = Array.from(input.files).map(file => file.name);
            onFilesSelected(paths);
          }
        };
        input.click();
      }
    } catch (error) {
      console.error('File dialog error:', error);
    }
  };

  return (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      onClick={handleClick}
    >
      {children || 'Select Files'}
    </Button>
  );
};