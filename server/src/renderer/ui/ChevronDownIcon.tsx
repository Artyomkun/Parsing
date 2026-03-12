import * as React from "react";

interface ChevronDownIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

const ChevronDownIcon: React.FC<ChevronDownIconProps> = ({
  size = 24,
  color = "currentColor",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export default ChevronDownIcon;