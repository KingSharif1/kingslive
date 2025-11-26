'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function FlipCard() {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="flex items-center justify-center perspective">
      <div className="relative w-full max-w-sm">
        {/* Lanyard */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 64 }}
          className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-amber-600 to-amber-700 dark:from-amber-500 dark:to-amber-600 rounded-full -top-16 shadow-lg"
        />

        {/* Badge Container */}
        <div
          className="relative w-full aspect-[3/4] cursor-pointer"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front of Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-white dark:bg-slate-200 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center border-4 border-slate-800 dark:border-slate-900"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 h-20 rounded-t-2xl border-b-4 border-slate-800 flex items-center justify-center">
              <p className="text-white text-sm font-bold tracking-widest">DEVELOPER</p>
            </div>

            {/* Profile section */}
            <div className="mt-16 flex flex-col items-center w-full flex-1 justify-center">
              <div className="relative w-32 h-32 mb-4 animate-slide-in-up">
                <div className="absolute inset-0 rounded-full shadow-lg border-4 border-slate-800 overflow-hidden">
                  <img
                    src="/images/profile-light.jpg"
                    alt="King Sharif"
                    className="w-full h-full object-cover block dark:hidden"
                  />
                  <img
                    src="/images/profile-dark.jpg"
                    alt="King Sharif"
                    className="w-full h-full object-cover hidden dark:block"
                  />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 text-center mb-1 animate-slide-in-down">King Sharif</h1>
              <p className="text-sm font-semibold text-blue-600 text-center mb-2 animate-slide-in-up">Full Stack Developer</p>
              <p className="text-xs text-slate-500 text-center italic animate-slide-in-down">Click to flip</p>
            </div>

            {/* Bottom bar with ID number */}
            <div className="absolute bottom-0 left-0 right-0 bg-slate-100 dark:bg-slate-300 h-12 rounded-b-2xl border-t-4 border-slate-800 flex items-center justify-center">
              <p className="text-slate-800 text-xs font-mono font-bold tracking-wider">ID: 001-DEV-KS</p>
            </div>
          </motion.div>

          {/* Back of Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center border-4 border-slate-600"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-600 to-emerald-700 h-16 rounded-t-2xl border-b-4 border-slate-600 flex items-center justify-center">
              <p className="text-white text-sm font-bold tracking-widest">STATS</p>
            </div>

            {/* Stats section */}
            <div className="mt-12 flex flex-col items-center w-full flex-1 justify-center space-y-4 px-4">
              <div className="text-center w-full pb-3 border-b border-slate-600 animate-slide-in-left">
                <p className="text-3xl font-bold text-blue-400 mb-1">5+</p>
                <p className="text-xs text-slate-300 font-medium">Years Experience</p>
              </div>
              <div className="text-center w-full pb-3 border-b border-slate-600 animate-slide-in-right">
                <p className="text-3xl font-bold text-emerald-400 mb-1">15+</p>
                <p className="text-xs text-slate-300 font-medium">Projects</p>
              </div>
              <div className="text-center w-full animate-slide-in-left">
                <p className="text-3xl font-bold text-amber-400 mb-1">100%</p>
                <p className="text-xs text-slate-300 font-medium">Satisfaction</p>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-slate-700 dark:bg-slate-600 h-10 rounded-b-2xl border-t-4 border-slate-600 flex items-center justify-center">
              <p className="text-slate-300 text-xs font-mono font-bold">Flip for Info</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
