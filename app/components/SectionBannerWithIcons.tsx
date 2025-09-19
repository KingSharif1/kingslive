import React from 'react';
import { SectionBanner, BannerTheme } from './SectionBanner';
import { 
  Newspaper, 
  BookOpen, 
  MessageSquare, 
  Lightbulb, 
  Compass, 
  Award, 
  Globe, 
  Code, 
  PenTool,
  Feather,
  Bookmark,
  Crown,
  Ship,
  Map,
  Scroll,
  Coffee,
  Mail
} from 'lucide-react';

// Map section names to icons and themes
const SECTION_CONFIGS: Record<string, { icon: React.ReactNode; theme: BannerTheme; style?: 'modern' | 'newspaper' }> = {
  // Modern style sections
  'weekly advice': { 
    icon: <Lightbulb size={24} className="text-blue-600" />, 
    theme: 'blue' 
  },
  'from our readers': { 
    icon: <MessageSquare size={24} className="text-amber-700" />, 
    theme: 'amber' 
  },
  'interesting reads': { 
    icon: <Globe size={24} className="text-purple-600" />, 
    theme: 'purple' 
  },
  'weekly news': { 
    icon: <Newspaper size={24} className="text-blue-600" />, 
    theme: 'blue' 
  },
  'weekly challenge': { 
    icon: <Code size={24} className="text-red-500" />, 
    theme: 'red' 
  },
  
  // Newspaper style sections (News Coo / Grand Chronicle themed)
  'royal decree': { 
    icon: <Crown size={24} className="text-amber-900 dark:text-amber-100" />, 
    theme: 'royal',
    style: 'newspaper'
  },
  'voyage log': { 
    icon: <Ship size={24} className="text-amber-900 dark:text-amber-100" />, 
    theme: 'parchment',
    style: 'newspaper'
  },
  'grand discoveries': { 
    icon: <Compass size={24} className="text-amber-900 dark:text-amber-100" />, 
    theme: 'royal',
    style: 'newspaper'
  },
  'reader\'s corner': { 
    icon: <Mail size={24} className="text-amber-900 dark:text-amber-100" />, 
    theme: 'parchment',
    style: 'newspaper'
  },
  'treasure maps': { 
    icon: <Map size={24} className="text-amber-900 dark:text-amber-100" />, 
    theme: 'royal',
    style: 'newspaper'
  },
  'captain\'s log': { 
    icon: <PenTool size={24} className="text-amber-900 dark:text-amber-100" />, 
    theme: 'parchment',
    style: 'newspaper'
  },
  'ancient scrolls': { 
    icon: <Scroll size={24} className="text-amber-900 dark:text-amber-100" />, 
    theme: 'royal',
    style: 'newspaper'
  },
  'tavern tales': { 
    icon: <Coffee size={24} className="text-amber-900 dark:text-amber-100" />, 
    theme: 'parchment',
    style: 'newspaper'
  }
};

interface SectionBannerWithIconsProps {
  title: string;
  className?: string;
  useNewspaperStyle?: boolean;
}

export const SectionBannerWithIcons = ({
  title,
  className = '',
  useNewspaperStyle = false
}: SectionBannerWithIconsProps) => {
  // Normalize the title for lookup
  const normalizedTitle = title.toLowerCase().trim();
  
  // Find the matching config or use default
  const config = SECTION_CONFIGS[normalizedTitle] || {
    icon: <Bookmark size={24} className={useNewspaperStyle ? "text-amber-900 dark:text-amber-100" : "text-blue-600"} />,
    theme: useNewspaperStyle ? 'parchment' : 'blue',
    style: useNewspaperStyle ? 'newspaper' : 'modern'
  };

  return (
    <SectionBanner
      title={title}
      icon={config.icon}
      theme={config.theme}
      style={config.style || (useNewspaperStyle ? 'newspaper' : 'modern')}
      className={className}
    />
  );
};

export default SectionBannerWithIcons;
