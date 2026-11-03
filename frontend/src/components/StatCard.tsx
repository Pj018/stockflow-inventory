import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'brand';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'bg-white border-slate-200 text-slate-900',
    brand: 'bg-white border-blue-200 text-blue-900 shadow-sm',
    warning: 'bg-amber-50/50 border-amber-200 text-amber-950',
    success: 'bg-emerald-50/50 border-emerald-200 text-emerald-950',
  };

  const iconBgStyles = {
    default: 'bg-slate-100 text-slate-600',
    brand: 'bg-blue-100 text-blue-600',
    warning: 'bg-amber-100 text-amber-600',
    success: 'bg-emerald-100 text-emerald-600',
  };

  return (
    <div
      className={`p-6 rounded-xl border transition-all duration-200 shadow-sm hover:shadow ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconBgStyles[variant]}`}>{icon}</div>
      </div>
    </div>
  );
};
