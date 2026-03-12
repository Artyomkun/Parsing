import * as React from "react";

interface ChevronRightIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

const ChevronRightIcon: React.FC<ChevronRightIconProps> = ({
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
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export default ChevronRightIcon;