import * as React from 'react';
import  { useState } from 'react';

const App = ({ onParse, loading }) => {
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [error, setError] = useState('');

  const handleParseClick = async () => {
    if (!inputData.trim()) {
      setError('Please enter data to parse');
      return;
    }

    setError('');
    setOutputData('Parsing...');

    try {
      const result = await onParse({
        type: selectedFormat,
        data: inputData
      });
      setOutputData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parsing failed');
      setOutputData('');
    }
  };

  return (
    <div className="app-container">
      <h1>Data Parser</h1>
      
      <div className="format-selector">
        <label htmlFor="format">Select format:</label>
        <select
          id="format"
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
        >
          <option value="json">JSON</option>
          <option value="xml">XML</option>
          <option value="yaml">YAML</option>
          <option value="csv">CSV</option>
          <option value="html">HTML</option>
          <option value="ini">INI</option>
          <option value="json2xml">JSON to XML</option>
          <option value="xml2json">XML to JSON</option>
          <option value="json2yaml">JSON to YAML</option>
          <option value="yaml2json">YAML to JSON</option>
          <option value="xml2yaml">XML to YAML</option>
          <option value="yaml2xml">YAML to XML</option>
        </select>
      </div>

      <div className="input-output-container">
        <div className="input-section">
          <h2>Input</h2>
          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="Enter your data here..."
            rows={10}
          />
        </div>

        <div className="output-section">
          <h2>Output</h2>
          {loading ? (
            <div className="loading">Parsing...</div>
          ) : (
            <pre>{outputData}</pre>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <button 
        onClick={handleParseClick} 
        disabled={loading}
        className="parse-button"
      >
        Parse Data
      </button>
    </div>
  );
};

export default App;