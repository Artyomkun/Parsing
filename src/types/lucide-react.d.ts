// src/types/lucide-react.d.ts
declare module 'lucide-react' {
  import * as React from 'react';
  interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number;
  }
  export const ChevronDown: React.FC<IconProps>;
  export const ChevronUp:   React.FC<IconProps>;
  // при необходимости добавьте и другие иконки:
  // export const X: React.FC<IconProps>;
  // export const Y: React.FC<IconProps>;
  // …
  export default {} as Record<string, React.FC<IconProps>>;
}
