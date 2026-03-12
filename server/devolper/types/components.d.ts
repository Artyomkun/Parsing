import React from 'react';
import Parsing from './parsing';

declare namespace Components {
  // Пропсы для компонента парсера
  export interface ParserProps {
    onParse: (config: Parsing.ParseConfig) => Promise<string>;
    loading: boolean;
  }

  // Пропсы для кнопки
  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
  }

  // Пропсы для карточки
  export interface CardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
  }
}

export default Components;