import React from 'react';
import { motion } from 'framer-motion';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    success, 
    helperText, 
    icon, 
    className = '', 
    wrapperClassName = '',
    ...props 
  }, ref) => {
    const inputId = props.id || label?.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className={`w-full ${wrapperClassName}`}>
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-slate-400">
                {icon}
              </div>
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={`
              input w-full
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              ${success ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''}
              ${className}
            `}
            {...props}
          />
          
          {(error || success) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {error && (
                <ErrorIcon className="w-5 h-5 text-red-500" />
              )}
              {success && (
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              )}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2"
          >
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <ErrorIcon className="w-4 h-4" />
                {error}
              </p>
            )}
            {!error && helperText && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {helperText}
              </p>
            )}
          </motion.div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
