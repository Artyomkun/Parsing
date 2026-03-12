import * as React from 'react';
import { CSSProperties } from 'react';

const SimpleLoader: React.FC = () => {
  // Стили как объекты CSSProperties
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    width: '100%',
  };

  const spinnerContainerStyle: CSSProperties = {
    position: 'relative',
    width: '80px',
    height: '80px',
    marginBottom: '20px',
  };

  const createCircleStyle = (color: string, delay: number): CSSProperties => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    border: '8px solid transparent',
    borderRadius: '50%',
    animation: `spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) ${delay}s infinite`,
    borderTopColor: color,
  });

  const textStyle: CSSProperties = {
    fontSize: '18px',
    color: '#555',
    fontWeight: 500,
    textAlign: 'center',
    marginTop: '10px',
  };

  // Keyframes как строку для тега style
  const keyframesStyle = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return (
    <div style={containerStyle}>
      {/* Вставка keyframes через тег style */}
      <style>{keyframesStyle}</style>
      
      <div style={spinnerContainerStyle}>
        <div style={createCircleStyle('#646cff', -0.45)}></div>
        <div style={createCircleStyle('#42b883', -0.3)}></div>
        <div style={createCircleStyle('#ff7e5f', -0.15)}></div>
        <div style={createCircleStyle('#ffcc00', 0)}></div>
      </div>
      <p style={textStyle}>Загрузка...</p>
    </div>
  );
};

export default SimpleLoader;