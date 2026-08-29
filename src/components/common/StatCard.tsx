import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  badge?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  badge,
  onClick,
  isActive = false,
}) => {
  const getThemeStyles = () => {
    switch (variant) {
      case 'success':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          accent: 'text-emerald-700',
          activeRing: isActive ? 'ring-2 ring-emerald-500 border-emerald-400' : 'border-slate-200/80',
          glow: 'hover:border-emerald-300',
        };
      case 'danger':
        return {
          iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
          accent: 'text-rose-700',
          activeRing: isActive ? 'ring-2 ring-rose-500 border-rose-400' : 'border-slate-200/80',
          glow: 'hover:border-rose-300',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
          accent: 'text-amber-700',
          activeRing: isActive ? 'ring-2 ring-amber-500 border-amber-400' : 'border-slate-200/80',
          glow: 'hover:border-amber-300',
        };
      case 'info':
        return {
          iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
          accent: 'text-blue-700',
          activeRing: isActive ? 'ring-2 ring-blue-500 border-blue-400' : 'border-slate-200/80',
          glow: 'hover:border-blue-300',
        };
      default:
        return {
          iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
          accent: 'text-slate-900',
          activeRing: isActive ? 'ring-2 ring-slate-800 border-slate-600' : 'border-slate-200/80',
          glow: 'hover:border-slate-300',
        };
    }
  };

  const theme = getThemeStyles();

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl p-5 border transition-all duration-200 shadow-xs ${
        theme.activeRing
      } ${theme.glow} ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.accent}`}>
              {value}
            </span>
            {badge && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-500 line-clamp-1">{subtitle}</p>}
        </div>

        <div className={`p-3 rounded-lg border ${theme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
