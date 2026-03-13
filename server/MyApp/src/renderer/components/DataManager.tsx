import React, { useState } from 'react';
import { Button } from '../ui/icons/Button';
import { PhotoIcon } from '../ui/icons/PhotoIcon'; 
import { useToast } from './feedback/Toaster';
import { FilePicker } from './FilePicker';

// Declare API interface globally
declare global {
  interface Window {
    electron: {
      ipcRenderer: any;
      fileApi: {
        saveFile: (content: string, options: any) => Promise<string | null>;
        openDialog: (options: any) => Promise<string[]>;
      };
    };
  }
}

const DataManager: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const handleFilesSelected = (paths: string[]) => {
    toast(`Выбрано ${paths.length} файл(ов)`, 'info');
    
    if (paths.length > 0) {
      setData({
        files: paths,
        timestamp: new Date().toISOString(),
        size: `${paths.length * 100} KB`
      });
    }
  };

  const handleSave = async () => {
    if (!data) {
      toast('Нет данных для сохранения', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      const content = JSON.stringify(data, null, 2);
      
      // Check API availability
      if (!window.electron?.fileApi?.saveFile) {
        throw new Error('File API не доступен');
      }
      
      const savedPath = await window.electron.fileApi.saveFile(content, {
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });
      
      if (savedPath) {
        toast(`Данные сохранены по пути: ${savedPath}`, 'success');
      }
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      toast(`Ошибка сохранения: ${message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Управление данными</h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-3">Импорт данных</h3>
        <FilePicker 
          onFilesSelected={handleFilesSelected}
          options={{
            filters: [{ name: 'Изображения', extensions: ['png', 'jpg'] }],
            properties: ['openFile', 'multiSelections']
          }}
        >
          <PhotoIcon className="mr-2" />
          Выбрать изображения
        </FilePicker>
      </div>
      
      {data && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h3 className="font-medium mb-2">Предварительный просмотр:</h3>
          <pre className="text-sm overflow-auto max-h-40">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
      
      <div>
        <h3 className="text-lg font-medium mb-3">Экспорт данных</h3>
        <Button 
          variant="primary"
          onClick={handleSave}
          disabled={!data || isSaving}
        >
          {isSaving ? (
            <span className="flex items-center">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Сохранение...
            </span>
          ) : (
            'Сохранить как JSON'
          )}
        </Button>
      </div>
    </div>
  );
};

export default DataManager;