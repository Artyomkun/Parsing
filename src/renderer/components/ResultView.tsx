import React from 'react';
import Papa from 'papaparse';

import { CodeIcon } from '../icons';
import { TableIcon } from '../ui';

interface ResultViewProps {
  data: any[] | null;
  loading: boolean;
  error: string | null;
}

const ResultView: React.FC<ResultViewProps> = ({ data, loading, error }) => {
  const [viewMode, setViewMode] = React.useState<'table' | 'json' | 'text'>('table');
  const [filteredData, setFilteredData] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (data) {
      // Ограничиваем количество строк для производительности
      setFilteredData(data.slice(0, 500));
    } else {
      setFilteredData([]);
    }
  }, [data]);

  const isTabularData = () => {
    if (!filteredData.length) return false;
    const firstItem = filteredData[0];
    return typeof firstItem === 'object' && !Array.isArray(firstItem);
  };

  const exportToCSV = () => {
    if (!filteredData.length) return;
    
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'parsed_data.csv');
  };

  const exportToJSON = () => {
    if (!filteredData.length) return;
    
    const json = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, 'parsed_data.json');
  };

  const exportToText = () => {
    if (!filteredData.length) return;
    
    let text = '';
    if (typeof filteredData[0] === 'string') {
      text = filteredData.join('\n');
    } else {
      text = filteredData.map(item => JSON.stringify(item)).join('\n');
    }
    
    const blob = new Blob([text], { type: 'text/plain' });
    saveAs(blob, 'parsed_data.txt');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10">
          <div className="text-destructive bg-destructive/10 p-4 rounded-lg inline-block">
            <p className="font-medium">Ошибка парсинга:</p>
            <p>{error}</p>
          </div>
        </div>
      );
    }

    if (!filteredData.length) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          <p>Данные для отображения отсутствуют</p>
          <p className="text-sm mt-2">Выполните парсинг, чтобы увидеть результаты</p>
        </div>
      );
    }

    // Добавляем рендеринг данных
    return (
      <div>
        <p>Data will be rendered here based on view mode: {viewMode}</p>
        {/* Добавьте здесь реальный рендеринг данных */}
      </div>
    );
  }

  // Возвращаем JSX из компонента
  return (
    <div className="result-view-container">
      <div className="flex justify-between items-center mb-4">
        <div className="view-mode-selector">
          <button 
            className={`p-2 rounded ${viewMode === 'table' ? 'bg-primary text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('table')}
          >
            <TableIcon size={20} />
          </button>
          <button 
            className={`p-2 rounded ${viewMode === 'json' ? 'bg-primary text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('json')}
          >
            <CodeIcon size={20} />
          </button>
          <button 
            className={`p-2 rounded ${viewMode === 'text' ? 'bg-primary text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('text')}
          >
            <FileTextIcon size={20} />
          </button>
        </div>
        
        <div className="export-buttons">
          <button 
            className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded text-sm"
            onClick={exportToCSV}
            disabled={!filteredData.length}
          >
            <SheetIcon size={16} /> CSV
          </button>
          <button 
            className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1.5 rounded text-sm"
            onClick={exportToJSON}
            disabled={!filteredData.length}
          >
            <CodeIcon size={16} /> JSON
          </button>
          <button 
            className="flex items-center gap-1 bg-purple-500 text-white px-3 py-1.5 rounded text-sm"
            onClick={exportToText}
            disabled={!filteredData.length}
          >
            <FileTextIcon size={16} /> TXT
          </button>
        </div>
      </div>
      
      {renderContent()}
    </div>
  );
};
export const FileTextIcon = (props: IconProps) => {
  const { size, width, height, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size ?? 16}
      height={height ?? size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
};
export const SheetIcon = (props: IconProps) => {
  const { size, width, height, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size ?? 16}
      height={height ?? size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="9" x2="9" y2="21" />
      <line x1="15" y1="9" x2="15" y2="21" />
    </svg>
  );
};
export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
};

export default ResultView;

function saveAs(blob: Blob, arg1: string) {
  throw new Error('Function not implemented.');
}
