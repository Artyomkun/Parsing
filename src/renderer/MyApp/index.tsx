import React, { FC, useState } from 'react';
import { cn } from '@/lib';
import ParserSelector from '../components/ParserSelector';


interface Props {
  onParse: (config: { type: string; data: string }) => Promise<string>;
  loading: boolean;
}

const MyApp: FC = () => (
  <div className={cn('container')}>
    <h1>My App</h1>
  </div>
);

const App: React.FC<Props> = ({ onParse, loading }) => {
  const [parseResult, setParseResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async (config: { type: string; data: string }) => {
    try {
      setError(null);
      const result = await onParse(config);
      setParseResult(result);
    } catch (err) {
      setError(`Error: ${err}`);
      setParseResult(null);
    }
  };

  return (
    <div className={cn('container mx-auto p-4')}>
      <h1 className="text-2xl font-bold mb-4">Parsing App</h1>
      <ParserSelector onParse={handleParse} loading={loading} />
      {parseResult && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p>{parseResult}</p>
        </div>
      )}
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default App;