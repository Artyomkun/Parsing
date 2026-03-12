import * as React from "react";

export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
};

const CheckIcon: React.FC<IconProps> = (props) => {
  const { 
    size = 16, 
    width, 
    height, 
    color = "currentColor", 
    strokeWidth = 2,
    ...rest 
  } = props;
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size}
      height={height ?? size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M20 6L9 17L4 12" />
    </svg>
  );
};

export default CheckIcon;