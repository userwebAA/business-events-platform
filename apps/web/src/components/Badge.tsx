import React from 'react';
import { Badge as BadgeType, getBadgeConfig } from 'shared';

interface BadgeProps {
  type: BadgeType['type'];
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function Badge({ type, size = 'md', showIcon = true }: BadgeProps) {
  const config = getBadgeConfig(type);
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${config.bgColor} ${config.color} ${sizeClasses[size]}`}
      title={config.description}
    >
      {showIcon && config.icon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
}
