import React from 'react';

type BigComponentProps = {
  title?: string;
};

const BigComponent: React.FC<BigComponentProps> = ({ title = 'Заголовок по умолчанию' }) => {
  return (
    <div>
      <h2>{title}</h2>
      <p>Это большой компонент, загружаемый динамически.</p>
    </div>
  );
};

export default BigComponent;
