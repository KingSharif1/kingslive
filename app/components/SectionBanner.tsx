import React from 'react';
import Image from 'next/image';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Banner color themes
export const BANNER_THEMES = {
  blue: {
    bg: 'bg-blue-600',
    text: 'text-white',
    shadow: 'shadow-blue-700/20'
  },
  amber: {
    bg: 'bg-amber-700',
    text: 'text-white',
    shadow: 'shadow-amber-800/20'
  },
  purple: {
    bg: 'bg-purple-600',
    text: 'text-white',
    shadow: 'shadow-purple-700/20'
  },
  red: {
    bg: 'bg-red-500',
    text: 'text-white',
    shadow: 'shadow-red-600/20'
  },
  green: {
    bg: 'bg-emerald-600',
    text: 'text-white',
    shadow: 'shadow-emerald-700/20'
  },
  gray: {
    bg: 'bg-gray-700',
    text: 'text-white',
    shadow: 'shadow-gray-800/20'
  },
  // News Coo themed colors
  parchment: {
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    shadow: 'shadow-amber-900/10'
  },
  royal: {
    bg: 'bg-amber-900',
    text: 'text-amber-100',
    shadow: 'shadow-amber-950/30'
  }
};

export type BannerTheme = keyof typeof BANNER_THEMES;

interface SectionBannerProps {
  title: string;
  icon?: React.ReactNode;
  theme?: BannerTheme;
  className?: string;
  style?: 'modern' | 'newspaper';
}

export const SectionBanner = ({
  title,
  icon,
  theme = 'blue',
  className = '',
  style = 'modern'
}: SectionBannerProps) => {
  const themeStyles = BANNER_THEMES[theme];
  
  if (style === 'newspaper') {
    return (
      <div className={cn(
        'relative mb-6 rounded-sm border-2 border-amber-900 dark:border-amber-100',
        'overflow-hidden',
        className
      )}>
        <div className={cn(
          'flex items-center gap-3 px-4 py-3',
          'bg-amber-100 dark:bg-amber-900',
          'text-amber-900 dark:text-amber-100'
        )}>
          {icon && (
            <div className="flex-shrink-0 bg-white dark:bg-amber-800 rounded-full p-2 border-2 border-amber-900 dark:border-amber-100">
              {icon}
            </div>
          )}
          <h2 className={cn(
            'text-xl md:text-2xl font-bold',
            'uppercase tracking-wide',
            'ink-bleed'
          )} style={{fontFamily: 'serif'}}>
            {title}
          </h2>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-900 dark:bg-amber-100 opacity-50"></div>
      </div>
    );
  }
  
  // Default modern style (like Sloth Bytes)
  return (
    <div className={cn(
      'relative mb-6 rounded-lg overflow-hidden',
      'shadow-lg',
      themeStyles.shadow,
      className
    )}>
      <div className={cn(
        'flex items-center gap-3 px-4 py-3',
        themeStyles.bg,
        themeStyles.text
      )}>
        {icon && (
          <div className="flex-shrink-0 bg-white rounded-full p-2">
            {icon}
          </div>
        )}
        <h2 className="text-xl md:text-2xl font-bold tracking-wide drop-shadow-sm">
          {title}
        </h2>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10"></div>
    </div>
  );
};

export default SectionBanner;
