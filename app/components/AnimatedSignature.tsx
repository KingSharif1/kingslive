'use client'

import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef } from "react";
import { Dancing_Script } from 'next/font/google';

const dancingScript = Dancing_Script({ subsets: ['latin'], weight: ['400'] });

export function AnimatedSignature() {
  const ref = useRef(null);
  const controls = useAnimationControls();
  const svgControls = useAnimationControls();

  const firstNameLetters = "King".split("");
  const lastNameLetters = "Sharif".split("");

  useEffect(() => {
    // Start the SVG path animation after the letters appear
    const timer = setTimeout(() => {
      svgControls.start("visible");
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [svgControls]);

  const letterVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.08,
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1.0], // Improved easing curve
      },
    }),
  };

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 1.5, ease: "easeInOut" },
        opacity: { duration: 0.3 }
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      className="w-full flex flex-col justify-center items-center py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className={`${dancingScript.className} flex flex-wrap justify-center gap-1 sm:gap-2 relative`}>
        {/* First Name */}
        <div className="flex">
          {firstNameLetters.map((letter, i) => (
            <motion.span
              key={`first-${i}`}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={letterVariants}
              className="text-5xl sm:text-6xl md:text-7xl text-primary dark:text-primary hover:text-primary/80 transition-colors relative"
              whileHover={{
                y: -5,
                scale: 1.05,
                color: "#300066", // Indigo color on hover
                transition: { duration: 0.2, type: "spring", stiffness: 300 },
              }}
            >
              {letter}
            </motion.span>
          ))}
        </div>

        {/* Space */}
        <motion.span 
          className="text-5xl sm:text-6xl md:text-7xl text-primary/50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.35, duration: 0.3 }}
        >
          &nbsp;
        </motion.span>

        {/* Last Name */}
        <div className="flex">
          {lastNameLetters.map((letter, i) => (
            <motion.span
              key={`last-${i}`}
              custom={i + firstNameLetters.length + 1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={letterVariants}
              className="text-5xl sm:text-6xl md:text-7xl text-primary dark:text-primary/20 hover:text-primary/80 transition-colors relative"
              whileHover={{
                y: -5,
                scale: 1.1,
                color: "#300066", // Indigo color on hover
                transition: { duration: 0.2, type: "spring", stiffness: 300 },
              }}
            >
              {letter}
            </motion.span>
          ))}
        </div>
      </div>

      {/* SVG Signature Underline */}
      <div className="mt-2 w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] h-[40px] overflow-visible">
        <motion.svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 400 40" 
          initial="hidden"
          animate={svgControls}
          className="overflow-visible"
        >
          <motion.path
            d="M20,20 C60,5 120,40 180,20 S300,0 380,20"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="text-primary"
            variants={pathVariants}
          />
          
          {/* Small decorative dot at the end */}
          <motion.circle 
            cx="380" 
            cy="20" 
            r="3"
            className="fill-primary"
            initial={{ scale: 0, opacity: 0 }}
            animate={svgControls}
            variants={{
              hidden: { scale: 0, opacity: 0 },
              visible: { 
                scale: 1, 
                opacity: 1,
                transition: { delay: 1.5, duration: 0.3 } 
              }
            }}
          />
        </motion.svg>
      </div>
    </motion.div>
  );
}
