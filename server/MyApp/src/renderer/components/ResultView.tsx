import React from 'react';
import Papa from 'papaparse';
import { CodeIcon } from '../ui/icons/icons';
import { TableIcon } from '../ui/icons/TableIcon';
import { saveAs } from 'file-saver';

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
      setFilteredData(data.slice(0, 500));
    } else {
      setFilteredData([]);
    }
  }, [data]);

  const exportToFile = (fileType: 'csv' | 'json' | 'text') => {
    if (!filteredData.length) return;

    let fileContent: string;
    let fileName: string;

    switch (fileType) {
      case 'csv':
        fileContent = Papa.unparse(filteredData);
        fileName = 'parsed_data.csv';
        break;
      case 'json':
        fileContent = JSON.stringify(filteredData, null, 2);
        fileName = 'parsed_data.json';
        break;
      case 'text':
        fileContent = filteredData.map(item => 
          typeof item === 'string' ? item : JSON.stringify(item)
        ).join('\n');
        fileName = 'parsed_data.txt';
        break;
      default:
        return;
    }

    const blob = new Blob([fileContent], { 
      type: fileType === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' 
    });
    saveAs(blob, fileName);
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

    switch (viewMode) {
      case 'table':
        if (!filteredData || typeof filteredData[0] !== 'object') {
          return <p>Данные не в табличном формате. Используйте JSON или Text view для просмотра.</p>;
        }

        const allKeys = Array.from(new Set(filteredData.flatMap(item => typeof item === 'object' ? Object.keys(item) : [])));

        return (
          <div className="table-wrapper overflow-x-auto">
            <table className="data-table w-full border-collapse">
              <thead>
                <tr>
                  {allKeys.map(key => (
                    <th key={key} className="p-2 border bg-gray-100 font-semibold text-left">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {allKeys.map(key => (
                      <td key={`${index}-${key}`} className="p-2 border">
                        {item && key in item 
                          ? (item[key] !== null && item[key] !== undefined ? String(item[key]) : <span className="text-gray-400 italic">N/A</span>)
                          : <span className="text-gray-400 italic">N/A</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'json':
        return (
          <div className="bg-gray-50 p-4 rounded overflow-auto max-h-[500px]">
            <pre className="text-sm whitespace-pre-wrap break-words">{JSON.stringify(filteredData, null, 2)}</pre>
          </div>
        );

      case 'text':
        return (
          <div className="bg-gray-50 p-4 rounded overflow-auto max-h-[500px]">
            {filteredData.map((item, index) => (
              <div key={index} className="mb-2 last:mb-0">{typeof item === 'string' ? item : JSON.stringify(item)}</div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="result-view-container bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex space-x-1">
          {['table', 'json', 'text'].map(mode => (
            <button
              key={mode}
              className={`p-2 rounded-md ${viewMode === mode ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={() => setViewMode(mode as 'table' | 'json' | 'text')}
              title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} View`}
            >
              {mode === 'table' ? <TableIcon size={20} /> : <CodeIcon size={20} />}
            </button>
          ))}
        </div>

        <div className="flex space-x-2">
          <button 
            className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600 disabled:opacity-50"
            onClick={() => exportToFile('csv')}
            disabled={!filteredData.length}
            title="Export to CSV"
          >
            <SheetIcon size={16} /> CSV
          </button>
          <button 
            className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
            onClick={() => exportToFile('json')}
            disabled={!filteredData.length}
            title="Export to JSON"
          >
            <CodeIcon size={16} /> JSON
          </button>
          <button 
            className="flex items-center gap-1 bg-purple-500 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-600 disabled:opacity-50"
            onClick={() => exportToFile('text')}
            disabled={!filteredData.length}
            title="Export to Text"
          >
            <FileTextIcon size={16} /> TXT
          </button>
        </div>
      </div>

      <div className="result-content min-h-[300px]">
        {renderContent()}
      </div>
    </div>
  );
};

// Иконки
const FileTextIcon: React.FC<IconProps> = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const SheetIcon: React.FC<IconProps> = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="9" x2="9" y2="21" />
    <line x1="15" y1="9" x2="15" y2="21" />
  </svg>
);

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export default ResultView;
