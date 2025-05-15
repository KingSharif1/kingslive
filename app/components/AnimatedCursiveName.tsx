"use client";

import { motion } from "framer-motion";
import { Dancing_Script } from 'next/font/google';

const dancingScript = Dancing_Script({ subsets: ['latin'], weight: ["400"] });

const name = "King Sharif";

export default function AnimatedCursiveName() {
  return (
    <div className={`inline-block ${dancingScript.className} select-none`}>
      {name.split("").map((letter, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07, duration: 0.5, type: "tween", ease: "easeOut" }}
          className="text-4xl sm:text-5xl md:text-6xl text-primary"
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </div>
  );
}
