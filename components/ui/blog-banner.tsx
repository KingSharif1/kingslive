import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// Import icons
import { 
  BookOpen, Code, Lightbulb, Star, 
  Coffee, Zap, Heart, Trophy, Music,
  Rocket, Camera, Palette, Globe, MessageCircle
} from 'lucide-react';

// Define banner variants using CVA
const bannerVariants = cva(
  "relative rounded-xl overflow-hidden banner-hover-effect mb-12", 
  {
    variants: {
      variant: {
        modern: "banner-modern-shadow banner-3d banner-pattern",
        newspaper: "border-2 border-slate-900 dark:border-slate-100 banner-newspaper-shadow banner-cartoon-shadow banner-cartoon",
        cartoon: "banner-cartoon-shadow banner-cartoon",
      },
      color: {
        blue: "banner-blue",
        red: "banner-red",
        green: "banner-green",
        purple: "banner-purple",
        amber: "banner-amber",
      },
      hasRibbon: {
        true: "banner-ribbon",
        false: "",
      },
      hasTexture: {
        true: "banner-texture",
        false: "",
      },
      hasShadowLayers: {
        true: "banner-shadow-layers",
        false: "",
      },
    },
    defaultVariants: {
      variant: "modern",
      color: "amber",
      hasRibbon: false,
      hasTexture: true,
      hasShadowLayers: true,
    },
  }
);

// Define banner content variants
const bannerContentVariants = cva("px-6 py-4 rounded-xl", {
  variants: {
    variant: {
      modern: "",
      newspaper: "",
      cartoon: "",
    },
    color: {
      blue: "bg-blue-600 text-white dark:bg-blue-900 dark:text-blue-100",
      red: "bg-red-600 text-white dark:bg-red-900 dark:text-red-100",
      green: "bg-green-600 text-white dark:bg-green-900 dark:text-green-100",
      purple: "bg-purple-600 text-white dark:bg-purple-900 dark:text-purple-100",
      amber: "bg-amber-600 text-white dark:bg-amber-900 dark:text-amber-100",
    },
  },
  defaultVariants: {
    variant: "modern",
    color: "amber",
  },
  compoundVariants: [
    {
      variant: "cartoon",
      color: "blue",
      class: "bg-blue-500 text-white",
    },
    {
      variant: "newspaper",
      color: "blue",
      class: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100",
    },
    {
      variant: "cartoon",
      color: "red",
      class: "bg-red-500 text-white",
    },
    {
      variant: "newspaper",
      color: "red",
      class: "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100",
    },
    {
      variant: "cartoon",
      color: "green",
      class: "bg-green-500 text-white",
    },
    {
      variant: "newspaper",
      color: "green",
      class: "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100",
    },
    {
      variant: "cartoon",
      color: "purple",
      class: "bg-purple-500 text-white",
    },
    {
      variant: "newspaper",
      color: "purple",
      class: "bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100",
    },
    {
      variant: "cartoon",
      color: "amber",
      class: "bg-amber-500 text-white",
    },
    {
      variant: "newspaper",
      color: "amber",
      class: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
    },
  ],
});

// Define animation variants
const animationVariants = {
  pulse: "animate-pulse",
  rotate: "animate-rotate",
  bounce: "animate-bounce",
  glow: "animate-glow",
  none: "",
};

// Define icon mapping
const iconMapping: Record<string, React.ReactNode> = {
  introduction: <BookOpen className="h-6 w-6" />,
  summary: <Star className="h-6 w-6" />,
  code: <Code className="h-6 w-6" />,
  example: <Lightbulb className="h-6 w-6" />,
  note: <Coffee className="h-6 w-6" />,
  important: <Zap className="h-6 w-6" />,
  tip: <Heart className="h-6 w-6" />,
  achievement: <Trophy className="h-6 w-6" />,
  music: <Music className="h-6 w-6" />,
  idea: <Rocket className="h-6 w-6" />,
  photo: <Camera className="h-6 w-6" />,
  art: <Palette className="h-6 w-6" />,
  world: <Globe className="h-6 w-6" />,
  discussion: <MessageCircle className="h-6 w-6" />,
};

// Define banner props
export interface BlogBannerProps extends VariantProps<typeof bannerVariants> {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  animation?: keyof typeof animationVariants;
  className?: string;
  iconName?: string;
}

// Add styles to document head
export function addBannerStyles() {
  if (typeof document !== 'undefined') {
    // Check if styles are already added
    if (!document.getElementById('blog-banner-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'blog-banner-styles';
      styleElement.textContent = `
        /* Import Google Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Permanent+Marker&family=Press+Start+2P&family=Abril+Fatface&family=Bangers&family=Comic+Neue:wght@700&display=swap');
        
        /* Animation keyframes */
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        /* Cartoon specific styles */
        .banner-cartoon {
          position: relative;
          transform: rotate(0.5deg);
          overflow: visible;
        }
        
        .banner-cartoon::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='none'/%3E%3Cpath d='M7 7l86 0M7 93l86 0M7 7l0 86M93 7l0 86' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-dasharray='1, 6' fill='none'/%3E%3C/svg%3E");
          opacity: 0.1;
          pointer-events: none;
          z-index: 1;
        }
        
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.7)); }
          50% { filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.9)); }
        }
        
        /* Banner title fonts */
        .banner-title-font {
          font-family: 'Bebas Neue', sans-serif;
          letter-spacing: 1.5px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
          font-size: 1.75rem;
          line-height: 1.2;
        }
        
        .newspaper-title-font {
          font-family: 'Abril Fatface', serif;
          letter-spacing: 0.8px;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.35);
          font-size: 1.65rem;
          line-height: 1.3;
        }
        
        .cartoon-title-font {
          font-family: 'Bangers', cursive;
          letter-spacing: 1px;
          text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.2);
          font-size: 1.8rem;
          line-height: 1.2;
          transform: rotate(-1deg);
        }
        
        /* Shadow effects */
        .banner-modern-shadow {
          box-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.15),
            0 6px 12px -2px rgba(0, 0, 0, 0.1),
            0 12px 16px -4px rgba(0, 0, 0, 0.08),
            0 20px 24px -6px rgba(0, 0, 0, 0.06);
        }
        
        .banner-newspaper-shadow {
          box-shadow: 
            0 2px 3px rgba(0, 0, 0, 0.15),
            0 5px 8px -1px rgba(0, 0, 0, 0.12),
            0 10px 12px -2px rgba(0, 0, 0, 0.1),
            0 16px 20px -4px rgba(0, 0, 0, 0.08);
        }
        
        .banner-cartoon-shadow {
          box-shadow: 
            8px 8px 0 rgba(0, 0, 0, 0.2);
          border: 3px solid #000;
          border-radius: 12px;
        }
        
        /* Enhanced 3D banner effect */
        .banner-3d {
          position: relative;
          z-index: 1;
          margin-bottom: 20px !important;
          transform-style: preserve-3d;
          perspective: 1200px;
          transform: perspective(1200px) rotateX(2.5deg);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        /* SVG pattern backgrounds */
        .banner-pattern {
          position: relative;
          overflow: hidden;
        }
        
        .banner-pattern::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.15;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
        }
        
        /* Ribbon corner effect */
        .banner-ribbon {
          position: relative;
          overflow: hidden;
        }
        
        .banner-ribbon::after {
          content: '';
          position: absolute;
          top: -10px;
          right: -10px;
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.5);
          transform: rotate(45deg);
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
          z-index: 5;
        }
        
        /* Shadow layers with improved depth */
        .banner-shadow-layers {
          position: relative;
        }
        
        .banner-shadow-layers::after {
          content: '';
          position: absolute;
          z-index: -1;
          bottom: -8px;
          left: 8px;
          right: -8px;
          height: calc(100% - 2px);
          background: rgba(0, 0, 0, 0.25);
          border-radius: 0.75rem;
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
          transform: translateZ(-15px);
          filter: blur(1px);
        }
        
        .banner-shadow-layers::before {
          content: '';
          position: absolute;
          z-index: -2;
          bottom: -16px;
          left: 16px;
          right: -16px;
          height: calc(100% - 4px);
          border-radius: 0.75rem;
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
          transform: translateZ(-30px);
          filter: blur(2px);
        }
        
        /* Enhanced color variations with gradients */
        .banner-blue::before {
          background: linear-gradient(135deg, #1e40af, #3b82f6, #93c5fd);
        }
        
        .banner-red::before {
          background: linear-gradient(135deg, #7f1d1d, #dc2626, #fca5a5);
        }
        
        .banner-green::before {
          background: linear-gradient(135deg, #14532d, #10b981, #86efac);
        }
        
        .banner-purple::before {
          background: linear-gradient(135deg, #581c87, #8b5cf6, #c4b5fd);
        }
        
        .banner-amber::before {
          background: linear-gradient(135deg, #78350f, #d97706, #fcd34d);
        }
        
        /* Texture overlay for banners */
        .banner-texture {
          position: relative;
        }
        
        .banner-texture::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
          opacity: 0.3;
          pointer-events: none;
          z-index: 1;
        }
        
        /* Hover effect */
        .banner-hover-effect {
          transition: all 0.3s ease;
          position: relative;
        }
        
        .banner-hover-effect:hover {
          transform: translateY(-2px) scale(1.01);
        }
        
        .banner-hover-effect:hover.banner-modern-shadow {
          box-shadow: 
            0 4px 6px rgba(0, 0, 0, 0.12),
            0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 15px 20px -5px rgba(0, 0, 0, 0.08);
        }
        
        .banner-hover-effect:hover.banner-newspaper-shadow {
          box-shadow: 
            0 3px 5px rgba(0, 0, 0, 0.15),
            0 8px 12px -3px rgba(0, 0, 0, 0.12),
            0 12px 18px -5px rgba(0, 0, 0, 0.1);
        }
        
        .banner-hover-effect:hover.banner-cartoon-shadow {
          box-shadow: 
            10px 10px 0 rgba(0, 0, 0, 0.25);
          transform: translateY(-4px) scale(1.01);
        }
        
        /* Animation classes */
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .animate-rotate {
          animation: rotate 10s linear infinite;
        }
        
        .animate-bounce {
          animation: bounce 2s ease infinite;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `;
      document.head.appendChild(styleElement);
    }
  }
}

export const BlogBanner = React.forwardRef<HTMLDivElement, BlogBannerProps>(
  ({ 
    title, 
    subtitle, 
    icon, 
    iconName,
    animation = 'none', 
    variant = 'modern',
    color = 'amber',
    hasRibbon = false,
    hasTexture = true,
    hasShadowLayers = true,
    className 
  }, ref) => {
    // Add styles to document head on component mount
    React.useEffect(() => {
      addBannerStyles();
    }, []);
    
    // Get icon from mapping if iconName is provided
    const iconElement = icon || (iconName && iconMapping[iconName.toLowerCase()]);
    
    // Get font class based on variant
    const fontClass = 
      variant === 'newspaper' ? 'newspaper-title-font' : 
      variant === 'cartoon' ? 'cartoon-title-font' : 
      'banner-title-font';
    
    // Get animation class
    const animationClass = animationVariants[animation];
    
    return (
      <div 
        ref={ref}
        className={cn(
          bannerVariants({ 
            variant, 
            color, 
            hasRibbon, 
            hasTexture, 
            hasShadowLayers 
          }),
          className
        )}
      >
        <div className={cn(bannerContentVariants({ variant, color }))}>
          <div className="flex items-center gap-3">
            {iconElement && (
              <div className={cn('text-3xl', animationClass)}>
                {iconElement}
              </div>
            )}
            <div>
              <h2 className={cn('font-bold', fontClass)}>
                {title}
              </h2>
              {subtitle && (
                <p className="text-base mt-1 opacity-90 font-medium">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

BlogBanner.displayName = 'BlogBanner';

export default BlogBanner;
