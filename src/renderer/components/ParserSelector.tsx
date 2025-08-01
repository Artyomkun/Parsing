import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/index';
import { SelectItem } from '../ui';


interface ParserSelectorProps {
  onParse: (config: { type: string; data: string }) => Promise<void>;
  loading: boolean;
}

const ParserSelector: React.FC<ParserSelectorProps> = ({ onParse, loading }) => {
  const [type, setType] = React.useState<string>('csv');
  const [inputData, setInputData] = React.useState<string>('');

  const handleParseClick = () => {
    if (inputData) {
      onParse({ type, data: inputData });
    }
  };

  return (
    <div className={cn('space-y-4')}>
      <SelectPrimitive.Root disabled={loading} onValueChange={setType}>
        <SelectPrimitive.Trigger className={cn('w-full p-2 border rounded')}>
          <SelectPrimitive.Value placeholder="Select parser type" />
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Content>
          <SelectPrimitive.Viewport>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Root>
      <textarea
        className={cn('w-full p-2 border rounded')}
        placeholder="Enter data to parse"
        value={inputData}
        onChange={(e) => setInputData(e.target.value)}
        disabled={loading}
      />
      <button
        onClick={handleParseClick}
        disabled={loading || !inputData}
        className={cn('px-4 py-2 bg-blue-500 text-white rounded', { 'opacity-50': loading || !inputData })}
      >
        {loading ? 'Parsing...' : 'Parse'}
      </button>
    </div>
  );
};

export default ParserSelector;