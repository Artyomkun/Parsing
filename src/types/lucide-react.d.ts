// src/types/lucide-react.d.ts
declare module 'lucide-react' {
  import * as React from 'react';
  
  interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number;
    absoluteStrokeWidth?: boolean;
  }
  export const ChevronDown: React.FunctionComponent<IconProps>;
  export const ChevronUp: React.FunctionComponent<IconProps>;
  export const ChevronLeft: React.FunctionComponent<IconProps>;
  export const ChevronRight: React.FunctionComponent<IconProps>;
  export const Plus: React.FunctionComponent<IconProps>;
  export const Minus: React.FunctionComponent<IconProps>;
  export const Settings: React.FunctionComponent<IconProps>;
  export const Home: React.FunctionComponent<IconProps>;
  export const Search: React.FunctionComponent<IconProps>;
  export const User: React.FunctionComponent<IconProps>;
  export const Bell: React.FunctionComponent<IconProps>;
  export const Trash: React.FunctionComponent<IconProps>;
  export const Edit: React.FunctionComponent<IconProps>;
  export const Info: React.FunctionComponent<IconProps>;
  export const Warning: React.FunctionComponent<IconProps>;
  export const Error: React.FunctionComponent<IconProps>;
  export const Check: React.FunctionComponent<IconProps>;
  export const Close: React.FunctionComponent<IconProps>;
  export const ArrowUp: React.FunctionComponent<IconProps>;
  export const ArrowDown: React.FunctionComponent<IconProps>;
  export const ArrowLeft: React.FunctionComponent<IconProps>;
  export const ArrowRight: React.FunctionComponent<IconProps>;
  export const Circle: React.FunctionComponent<IconProps>;
  export const Square: React.FunctionComponent<IconProps>;
  export const Triangle: React.FunctionComponent<IconProps>;
  export const Star: React.FunctionComponent<IconProps>;
  export const Heart: React.FunctionComponent<IconProps>;
  export const CheckCircle: React.FunctionComponent<IconProps>;
  export const CheckSquare: React.FunctionComponent<IconProps>;
  export const XCircle: React.FunctionComponent<IconProps>;
  export const XSquare: React.FunctionComponent<IconProps>;
  export const Loader: React.FunctionComponent<IconProps>;
}