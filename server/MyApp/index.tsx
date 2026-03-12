import { useState } from 'react';
import ParserSelector from './src/renderer/components/ParserSelector';

const App = () => {
  const [parseResult, setParseResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [history, setHistory] = useState<Array<{
    type: string;
    data: string;
    result: string;
    timestamp: Date;
  }>>([]);

  const handleParse = async (config: { type: string; data: string }) => {
    try {
      setIsParsing(true);
      setError(null);
      
      // Вызываем функцию парсинга
      const result = await parseData(config.type, config.data);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error: ${message}`);
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const clearResults = () => {
    setParseResult(null);
    setError(null);
  };

  const copyToClipboard = async () => {
    if (parseResult) {
      try {
        await navigator.clipboard.writeText(parseResult);
      } catch (err) {
        setError('Failed to copy to clipboard');
      }
    }
  };

  function cn(arg0: string): string | undefined {
    throw new Error('Function not implemented.');
  }

  return (
    <div className={cn('container mx-auto p-4 max-w-4xl')}>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Data Parser Pro</h1>
        <p className="text-gray-600">
          Convert between various data formats with powerful parsing capabilities
        </p>
      </header>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <ParserSelector 
          onParse={handleParse} 
          loading={isParsing} 
        />
      </div>

      {(parseResult || error) && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {error ? 'Error Details' : 'Parsing Result'}
            </h2>
            <div className="flex space-x-2">
              {parseResult && (
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                >
                  Copy
                </button>
              )}
              <button
                onClick={clearResults}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
              >
                Clear
              </button>
            </div>
          </div>

          {error ? (
            <div className="p-4 bg-red-50 border-l-4 border-red-500">
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <div className="relative">
              {isParsing ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-sm max-h-96">
                  {parseResult}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Parsing History</h2>
          <div className="space-y-3">
            {history.map((item, index) => (
              <div 
                key={index} 
                className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setParseResult(item.result);
                  setError(null);
                }}
              >
                <div className="flex justify-between">
                  <span className="font-medium text-gray-800 capitalize">{item.type}</span>
                  <span className="text-sm text-gray-500">
                    {item.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate mt-1">
                  {item.data.substring(0, 100)}{item.data.length > 100 ? '...' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

function parseData(type: string, data: string) {
  throw new Error('Function not implemented.');
}
