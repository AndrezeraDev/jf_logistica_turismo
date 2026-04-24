import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'secondary';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent hover:bg-accent-hover text-white shadow-[0_8px_20px_rgba(10,132,255,0.35)]',
  secondary:
    'bg-white/[0.08] hover:bg-white/[0.14] text-ink-100 border border-white/10',
  ghost: 'bg-transparent hover:bg-white/[0.08] text-ink-100',
  danger: 'bg-red-500/90 hover:bg-red-500 text-white',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] rounded-[10px]',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-12 px-5 text-[15px] rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'secondary', size = 'md', loading, className = '', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 font-medium
      transition-all duration-150 ease-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
      ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      )}
      {children}
    </button>
  );
});
