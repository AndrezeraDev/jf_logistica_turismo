import { InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full h-10 px-3.5 rounded-xl
          bg-white/[0.05] border border-white/10
          text-sm text-ink-100 placeholder-ink-400
          focus:outline-none focus:border-accent/60 focus:bg-white/[0.08]
          transition-all duration-150
          ${className}`}
        {...rest}
      />
    );
  },
);
