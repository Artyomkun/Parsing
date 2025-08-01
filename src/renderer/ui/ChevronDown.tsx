import React from 'react';

interface ChevronUpProps {
  size?: number;
  color?: string;
  className?: string;
}

const ChevronUp: React.FC<ChevronUpProps> = ({
  size = 24,
  color = 'currentColor',
  className = ''
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
    className={className}
    aria-hidden="true"
  >
    <path d="M18 15l-6-6-6 6" />
  </svg>
);

export default ChevronUp;