 import * as React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface UrlInputProps {
  onParse: (url: string) => Promise<void>;
  loading: boolean;
}

const UrlInput: React.FC<UrlInputProps> = ({ onParse, loading }) => {
  const [url, setUrl] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onParse(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="url">Website URL</Label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
          disabled={loading}
        />
      </div>
      <Button 
        type="submit"
        disabled={loading || !url.trim()}
        className={loading ? 'opacity-75 cursor-not-allowed' : ''}
      >
        {loading ? 'Parsing...' : 'Start Parsing'}
      </Button>
    </form>
  );
};

export default UrlInput;