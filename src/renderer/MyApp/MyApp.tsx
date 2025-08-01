import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './index';
import { parse } from 'papaparse';
import { load } from 'cheerio';

const handleParse = async (config: { type: string; data: string }): Promise<string> => {
  const { type, data } = config;
  switch (type) {
    case 'csv':
      return new Promise((resolve, reject) => {
        parse(data, {
          complete: (result) => resolve(JSON.stringify(result.data, null, 2)),
          error: (error: { message: any; }) => reject(error.message),
        });
      });
    case 'html':
      const $ = load(data);
      const text = $('body').text().trim();
      return Promise.resolve(text || 'No content found');
    case 'json':
      try {
        const parsed = JSON.parse(data);
        return Promise.resolve(JSON.stringify(parsed, null, 2));
      } catch (error) {
        return Promise.reject('Invalid JSON format');
      }
    default:
      return Promise.reject('Unknown parser type');
  }
};

const Root: React.FC = () => <App onParse={handleParse} loading={false} />;

const root = createRoot(document.getElementById('root')!);
root.render(<Root />);

export { App };
