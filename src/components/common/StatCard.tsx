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
          iconBg: 'bg-[#00A878]/10 text-[#00A878] border-[#00A878]/25',
          accent: 'text-[#00A878]',
          activeRing: isActive ? 'ring-2 ring-[#00A878] border-[#00A878]' : 'border-[#DCE4EC]',
          glow: 'hover:border-[#00A878]/50',
        };
      case 'danger':
        return {
          iconBg: 'bg-[#E9304F]/10 text-[#E9304F] border-[#E9304F]/25',
          accent: 'text-[#E9304F]',
          activeRing: isActive ? 'ring-2 ring-[#E9304F] border-[#E9304F]' : 'border-[#DCE4EC]',
          glow: 'hover:border-[#E9304F]/50',
        };
      case 'warning':
        return {
          iconBg: 'bg-[#FFC400]/15 text-[#B45309] border-[#FFC400]/30',
          accent: 'text-[#B45309]',
          activeRing: isActive ? 'ring-2 ring-[#FFC400] border-[#FFC400]' : 'border-[#DCE4EC]',
          glow: 'hover:border-[#FFC400]/50',
        };
      case 'info':
        return {
          iconBg: 'bg-[#1473E6]/10 text-[#1473E6] border-[#1473E6]/25',
          accent: 'text-[#1473E6]',
          activeRing: isActive ? 'ring-2 ring-[#1473E6] border-[#1473E6]' : 'border-[#DCE4EC]',
          glow: 'hover:border-[#1473E6]/50',
        };
      default:
        return {
          iconBg: 'bg-[#F5F7FA] text-[#061E2E] border-[#DCE4EC]',
          accent: 'text-[#102033]',
          activeRing: isActive ? 'ring-2 ring-[#061E2E] border-[#061E2E]' : 'border-[#DCE4EC]',
          glow: 'hover:border-[#061E2E]/30',
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
          <p className="text-xs font-bold uppercase tracking-wider text-[#587087]">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.accent}`}>
              {value}
            </span>
            {badge && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#F5F7FA] text-[#587087] border border-[#DCE4EC]">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-[#587087] line-clamp-1">{subtitle}</p>}
        </div>

        <div className={`p-3 rounded-xl border ${theme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
