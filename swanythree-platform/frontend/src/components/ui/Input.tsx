import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-st3-cream/70 mb-1">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-st3-cream/40">{icon}</div>
          )}
          <input
            ref={ref}
            className={`w-full ${icon ? 'pl-10' : ''} ${error ? 'border-red-500/50 focus:ring-red-500/30' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
