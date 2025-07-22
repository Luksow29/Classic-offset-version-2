import React from 'react';
import { ChevronDown } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: SelectOption[];
  error?: string;
  className?: string;
  placeholder?: string;
  helperText?: string;
}

const Select: React.FC<SelectProps> = ({
  id,
  label,
  options,
  error,
  className = '',
  placeholder,
  helperText,
  ...props
}) => {
  return (
    <div className={twMerge("w-full", className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">
          {label} {props.required && <span className="text-destructive">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={twMerge(`
            h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm 
            ring-offset-background placeholder:text-muted-foreground 
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
            disabled:cursor-not-allowed disabled:opacity-50 transition-colors
            ${error ? 'border-destructive focus-visible:ring-destructive' : ''}
            pr-10
          `, className)}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-muted-foreground">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default Select;