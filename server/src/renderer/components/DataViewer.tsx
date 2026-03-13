import * as React from 'react';

interface DataViewerProps {
  data: any;
  loading: boolean;
}

export const DataViewer: React.FC<DataViewerProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        Нет данных для отображения
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-hidden">
      <pre className="p-4 max-h-[60vh] overflow-auto text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};