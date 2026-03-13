import React from 'react';
import { Button } from '../ui/icons/Button';
import { Input } from '../ui/icons/Input';
import { Label } from '../ui/icons/Label';

interface UrlInputProps {
  onParse: (url: string) => Promise<void>;
  loading: boolean;
}

const UrlInput: React.FC<UrlInputProps> = ({ onParse, loading }) => {
  const [url, setUrl] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      setError(null);
      try {
        await onParse(url.trim());
      } catch (err) {
        setError('Ошибка при обработке URL. Проверьте, пожалуйста, правильность ввода.');
      }
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
          onChange={(e) => setUrl(e.target.value)}
          required
          disabled={loading}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "url-error" : undefined}
        />
        {error && <span id="url-error" className="text-red-500 text-sm">{error}</span>}
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