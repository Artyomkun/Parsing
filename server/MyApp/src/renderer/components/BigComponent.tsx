import React from 'react';

type BigComponentProps = {
  title?: string;
};

const BigComponent: React.FC<BigComponentProps> = ({ title = 'Заголовок по умолчанию' }) => {
  return (
    <div className="p-4 bg-gray-100 rounded-md shadow-md">
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      <p className="text-gray-600">Это большой компонент, загружаемый динамически.</p>
    </div>
  );
};

export default BigComponent;