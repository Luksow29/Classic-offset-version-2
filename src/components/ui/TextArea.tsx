import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label?: string;
  error?: string;
  className?: string;
  helperText?: string;
}

const TextArea: React.FC<TextAreaProps> = ({
  id,
  label,
  error,
  className = '',
  helperText,
  ...props
}) => {
  return (
    <div className={twMerge("w-full", className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          {label} {props.required && <span className="text-destructive">*</span>}
        </label>
      )}
      <textarea
        id={id}
        className={twMerge(`
          w-full px-3 py-2 rounded-md border border-input bg-background text-foreground
          placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 
          focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed 
          disabled:opacity-50 transition-colors resize-y
          ${error ? 'border-destructive focus-visible:ring-destructive' : ''}
        `)}
        {...props}
      />
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default TextArea;