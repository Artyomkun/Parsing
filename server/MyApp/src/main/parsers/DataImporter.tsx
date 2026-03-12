import { useToast } from '../../renderer/components/feedback/Toaster';
import { FilePicker } from '../../renderer/components/FilePicker';
import React, { useState } from 'react';
import path from 'path';

// Define proper types for parser
type ParserType = 'csv' | 'json' | 'xml' | 'text';
interface ParserOptions {
  delimiter?: string;
  filePath?: string;
}

const DataImporter: React.FC = () => {
  const [importedData, setImportedData] = useState<any[]>([]); 
  const toast = useToast();
  
  // File filter options
  const fileOptions: App.Electron.FileDialogOptions = {
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'Text Files', extensions: ['txt'] },
    ],
    properties: ['openFile', 'multiSelections'],
  };

  const handleFilesSelected = async (paths: string[]) => {
    try {
      if (!paths.length) {
        toast('No files selected', 'warning');
        return;
      }

      // Process all selected files
      for (const filePath of paths) {
        try {
          // Get file extension safely
          const extension = path.extname(filePath).slice(1).toLowerCase();
          
          // Map file extensions to parser types
          const extensionMap: Record<string, ParserType> = {
            csv: 'csv',
            json: 'json',
            xml: 'xml',
            txt: 'text', // Map .txt to 'text' parser type
          };
          
          // Get parser type from mapping
          const parserType = extensionMap[extension];
          
          // Validate supported file types
          if (!parserType) {
            toast(`Unsupported file type: ${extension || 'unknown'}`, 'error');
            continue;
          }

          // Read file content
          const content = await window.electron.ipcRenderer.invoke(
            'file:read', 
            filePath
          );

          // Prepare parsing options
          const options: ParserOptions = {
            delimiter: parserType === 'csv' ? ',' : undefined,
            filePath  // Pass path for context
          };

          // Parse file content
          const result = await window.electron.ipcRenderer.invoke(
            'parse:data', 
            { 
              type: parserType, 
              data: content,
              options
            }
          );

          // Handle parse result
          if (result.success) {
            setImportedData(prev => [...prev, ...result.data]);
            toast(`Imported: ${path.basename(filePath)}`, 'success');
          } else {
            toast(`${path.basename(filePath)} failed: ${result.error}`, 'error');
          }
        } catch (fileError) {
          const message = fileError instanceof Error 
            ? fileError.message 
            : 'Unknown error';
          toast(`Error processing ${path.basename(filePath)}: ${message}`, 'error');
        }
      }
    } catch (globalError) {
      const message = globalError instanceof Error 
        ? globalError.message 
        : 'Critical error';
      toast(`Import failed: ${message}`, 'error');
    }
  };

  return (
    <div className="data-importer">
      <FilePicker 
        onFilesSelected={handleFilesSelected}
        options={fileOptions}
        buttonVariant="secondary"
      >
        Import Data
      </FilePicker>
      
      {importedData.length > 0 && (
        <div className="imported-data-preview mt-4">
          <h3>Imported Data Preview</h3>
          <pre>{JSON.stringify(importedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DataImporter;