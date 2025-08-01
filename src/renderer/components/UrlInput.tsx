import React from 'react'; // Исправленный импорт
import { Button } from '@/renderer/ui/Button';
import { Input } from '@/renderer/ui/Input';
import { Label } from '@/renderer/ui/Label';

interface UrlInputProps {
  onParse: (url: string) => void;
}

const UrlInput: React.FC<UrlInputProps> = ({ onParse }) => {
  const [url, setUrl] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onParse(url);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="url">Website URL</Label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
        />
      </div>
      <Button type="submit">Start Parsing</Button>
    </form>
  );
};

export default UrlInput;