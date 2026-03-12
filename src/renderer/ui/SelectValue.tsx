import React from 'react';
import { type OptionType } from '../../types/types'; 

interface SelectValueProps {
  value: OptionType | OptionType[] | null;
  placeholder?: string;
  isMulti?: boolean;
  renderOption?: (option: OptionType) => React.ReactNode;
}

const SelectValue: React.FC<SelectValueProps> = ({
  value,
  placeholder = 'Select...',
  isMulti = false,
  renderOption,
}) => {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return <span className="select-value placeholder">{placeholder}</span>;
  }

  if (isMulti && Array.isArray(value)) {
    return (
      <div className="select-value multi-value">
        {value.map((option, index) => (
          <span key={`${option.value}-${index}`} className="multi-value-item">
            {renderOption ? renderOption(option) : option.label}
          </span>
        ))}
      </div>
    );
  }

  const singleValue = value as OptionType;
  return (
    <span className="select-value single-value">
      {renderOption ? renderOption(singleValue) : singleValue.label}
    </span>
  );
};

export default SelectValue;