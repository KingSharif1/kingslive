'use client'

import { motion } from "framer-motion";
import { useRef } from "react";
import { Dancing_Script } from 'next/font/google';

const dancingScript = Dancing_Script({ subsets: ['latin'] });

export function AnimatedSignature() {
  const ref = useRef(null);

  const firstNameLetters = "King".split("");
  const lastNameLetters = "Sharif".split("");

  const letterVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.8,
        ease: [0.2, 0.65, 0.3, 0.9],
      },
    }),
  };

  return (
    <motion.div
      ref={ref}
      className="w-full flex flex-col justify-center items-center py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className={`${dancingScript.className} flex flex-wrap justify-center gap-1 sm:gap-2`}>
        {/* First Name */}
        <div className="flex">
          {firstNameLetters.map((letter, i) => (
            <motion.span
              key={`first-${i}`}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false }}
              variants={letterVariants}
              className="text-5xl sm:text-6xl md:text-7xl text-primary hover:text-primary/80 transition-colors relative"
              whileHover={{
                y: -5,
                scale: 1.2,
                transition: { duration: 0.2 },
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
          viewport={{ once: false }}
          transition={{ delay: 0.4, duration: 0.3 }}
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
              viewport={{ once: false }}
              variants={letterVariants}
              className="text-5xl sm:text-6xl md:text-7xl text-primary hover:text-primary/80 transition-colors relative"
              whileHover={{
                y: -5,
                scale: 1.2,
                transition: { duration: 0.2 },
              }}
            >
              {letter}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Decorative underline */}
      <motion.div
        className="mt-2 w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px]"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: false }}
        transition={{ 
          delay: 1.2,
          duration: 1,
          ease: [0.65, 0, 0.35, 1]
        }}
      >
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
      </motion.div>
    </motion.div>
  );
}
