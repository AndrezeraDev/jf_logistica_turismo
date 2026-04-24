import { PropsWithChildren } from 'react';

export function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
}: PropsWithChildren<{
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}>) {
  return (
    <div className={`glass rounded-2xl p-4 shadow-glass ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between mb-3">
          <div>
            {title && <div className="text-[15px] font-semibold text-ink-100">{title}</div>}
            {subtitle && <div className="text-[12px] text-ink-400 mt-0.5">{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
