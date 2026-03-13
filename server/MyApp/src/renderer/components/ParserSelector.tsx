import React from 'react';
import { ChevronDown } from 'lucide-react'; 
import * as SelectPrimitive from "@radix-ui/react-select";

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
    <div className="space-y-4">
      <SelectPrimitive.Root value={type} onValueChange={setType} disabled={loading}>
        <SelectPrimitive.Trigger
          className={`flex items-center justify-between w-full p-2 border rounded ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          } bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          <SelectPrimitive.Value placeholder="Select parser type" />
          <SelectPrimitive.Icon>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="overflow-hidden bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <SelectPrimitive.Viewport className="p-1">
              <SelectPrimitive.Group>
                <SelectPrimitive.SelectItem value="csv">CSV</SelectPrimitive.SelectItem>
                <SelectPrimitive.SelectItem value="html">HTML</SelectPrimitive.SelectItem>
                <SelectPrimitive.SelectItem value="json">JSON</SelectPrimitive.SelectItem>
              </SelectPrimitive.Group>
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      <textarea
        className={`w-full p-2 border rounded min-h-[100px] ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        } bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        placeholder="Enter data to parse"
        value={inputData}
        onChange={(e) => setInputData(e.target.value)}
        disabled={loading}
      />

      <button
        onClick={handleParseClick}
        disabled={loading || !inputData}
        className={`px-4 py-2 bg-blue-500 text-white rounded w-full transition-colors duration-200 ${
          loading || !inputData ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        }`}
      >
        {loading ? 'Parsing...' : 'Parse'}
      </button>
    </div>
  );
};

export default ParserSelector;