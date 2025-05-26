'use client';

import { motion, HTMLMotionProps, Variants } from 'framer-motion';

// Re-export motion from framer-motion
export { motion };

// Create motion variants for common animations
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1]
    }
  },
};

// Create a custom motion component with proper TypeScript support
type MotionTag = 'div' | 'section' | 'span' | 'h1' | 'h2' | 'h3' | 'p';

type MotionProps = HTMLMotionProps<'div'> & {
  as?: MotionTag;
  variants?: Variants;
  initial?: string | boolean | Variants;
  animate?: string | boolean | Variants;
  whileInView?: string | boolean | Variants;
  viewport?: {
    once?: boolean;
    amount?: number;
    margin?: string;
  };
};

export const Motion: React.FC<MotionProps> = ({
  children,
  as = 'div',
  variants,
  initial = 'hidden',
  animate = 'visible',
  whileInView,
  viewport = { once: true, amount: 0.1 },
  ...props
}) => {
  let MotionComponent: React.ElementType;
  switch (as) {
    case 'section':
      MotionComponent = motion.section;
      break;
    case 'span':
      MotionComponent = motion.span;
      break;
    case 'h1':
      MotionComponent = motion.h1;
      break;
    case 'h2':
      MotionComponent = motion.h2;
      break;
    case 'h3':
      MotionComponent = motion.h3;
      break;
    case 'p':
      MotionComponent = motion.p;
      break;
    default:
      MotionComponent = motion.div;
  }
  return (
    <MotionComponent
      variants={variants}
      initial={initial}
      animate={animate}
      whileInView={whileInView}
      viewport={viewport}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

// Export motion components
export default motion;