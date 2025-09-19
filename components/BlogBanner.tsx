import React from 'react';
import { cn } from '@/lib/utils';

export interface BlogBannerProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'red' | 'green' | 'purple' | 'amber';
  animation?: 'pulse' | 'rotate' | 'bounce' | 'glow' | 'none';
  style?: 'modern' | 'newspaper';
  className?: string;
}

export const BlogBanner = ({
  title,
  subtitle,
  icon,
  color = 'amber',
  animation = 'none',
  style = 'modern',
  className,
}: BlogBannerProps) => {
  const isNewspaperStyle = style === 'newspaper';
  
  // Animation class based on the animation prop
  const animationClass = animation !== 'none' ? `animate-${animation}` : '';
  
  // Base classes for the banner
  const baseClasses = 'relative rounded-xl overflow-hidden banner-hover-effect';
  
  // Shadow and effect classes
  const shadowClasses = 'banner-shadow-layers';
  const effectClasses = !isNewspaperStyle ? 'banner-3d banner-pattern' : '';
  const ribbonClass = !isNewspaperStyle && Math.random() > 0.5 ? 'banner-ribbon' : '';
  const textureClass = 'banner-texture';
  
  // Color classes
  const colorClass = `banner-${color}`;
  
  // Background color based on style and color
  let bgColorClass = '';
  let textColorClass = '';
  
  switch(color) {
    case 'blue':
      bgColorClass = isNewspaperStyle ? 'bg-blue-100 dark:bg-blue-900' : 'bg-blue-600';
      textColorClass = isNewspaperStyle ? 'text-blue-900 dark:text-blue-100' : 'text-white';
      break;
    case 'red':
      bgColorClass = isNewspaperStyle ? 'bg-red-100 dark:bg-red-900' : 'bg-red-600';
      textColorClass = isNewspaperStyle ? 'text-red-900 dark:text-red-100' : 'text-white';
      break;
    case 'green':
      bgColorClass = isNewspaperStyle ? 'bg-green-100 dark:bg-green-900' : 'bg-green-600';
      textColorClass = isNewspaperStyle ? 'text-green-900 dark:text-green-100' : 'text-white';
      break;
    case 'purple':
      bgColorClass = isNewspaperStyle ? 'bg-purple-100 dark:bg-purple-900' : 'bg-purple-600';
      textColorClass = isNewspaperStyle ? 'text-purple-900 dark:text-purple-100' : 'text-white';
      break;
    case 'amber':
    default:
      bgColorClass = isNewspaperStyle ? 'bg-amber-100 dark:bg-amber-900' : 'bg-amber-600';
      textColorClass = isNewspaperStyle ? 'text-amber-900 dark:text-amber-100' : 'text-white';
      break;
  }
  
  // Font classes based on style
  const fontClass = isNewspaperStyle ? 'newspaper-title-font' : 'banner-title-font';
  
  return (
    <div 
      className={cn(
        baseClasses,
        'mb-10',
        isNewspaperStyle && 'border-2 border-slate-900 dark:border-slate-100',
        isNewspaperStyle ? 'banner-newspaper-shadow' : 'banner-modern-shadow',
        shadowClasses,
        effectClasses,
        colorClass,
        textureClass,
        ribbonClass,
        className
      )}
    >
      <div className={cn('px-4 py-3', bgColorClass)}>
        <div className="flex items-center gap-3">
          {icon && (
            <div className={cn('text-2xl', animationClass, textColorClass)}>
              {icon}
            </div>
          )}
          <div>
            <h2 className={cn('text-xl font-bold', fontClass, textColorClass)}>
              {title}
            </h2>
            {subtitle && (
              <p className={cn('text-sm mt-0.5 opacity-90', textColorClass)}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogBanner;
