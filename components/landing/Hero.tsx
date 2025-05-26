'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from '@/components/landing/motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Hero() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Array of background images for the slideshow
  const backgroundImages = [
    "https://images.pexels.com/photos/209230/pexels-photo-209230.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    "https://images.pexels.com/photos/273669/pexels-photo-273669.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    "https://images.pexels.com/photos/380330/pexels-photo-380330.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    "https://images.pexels.com/photos/3223552/pexels-photo-3223552.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
  ];

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Effect for image slideshow
  useEffect(() => {
    if (!isLoading) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
          prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000); // Change image every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [isLoading, backgroundImages.length]);

  const scrollToContact = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!isMounted) return null;

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 bg-gradient-to-br from-blue-100/60 via-white/80 to-blue-200/60 dark:from-blue-900/30 dark:via-gray-900/80 dark:to-blue-800/30 overflow-hidden transition-colors duration-200">
      {/* Background image with gradient and blur overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {backgroundImages.map((image, index) => (
          <div key={index} className="absolute inset-0">
            <Image
              src={image}
              alt={`Window cleaning showcase ${index + 1}`}
              fill
              priority={index === 0}
              className={cn(
                "object-cover transition-opacity duration-1500",
                currentImageIndex === index ? "opacity-100" : "opacity-0",
                isLoading ? "opacity-0" : ""
              )}
              onLoadingComplete={() => {
                if (index === 0) setIsLoading(false);
              }}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-blue-700/40 to-transparent backdrop-contrast-150"></div>
      </div>
      <div className="container mx-auto px-4 relative z-10 flex justify-center">
        <motion.div 
          className="w-full max-w-2xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-lg rounded-3xl shadow-2xl p-10 md:p-14 flex flex-col items-center text-center border border-white/40 dark:border-gray-700/40 transition-colors duration-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight text-gray-900 dark:text-white drop-shadow-xl transition-colors duration-200">
            Sparkling Clean Windows, <span className="text-[#1E90FF]">Every Time</span>
          </h1>
          <p className="text-lg md:text-2xl mb-10 text-gray-800/90 dark:text-gray-200/90 transition-colors duration-200">
            Professional window cleaning for homes & businesses. Book now for a brighter, clearer view.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Button 
              onClick={scrollToContact}
              className="bg-[#1E90FF] hover:bg-blue-600 text-white font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:scale-105 transition-all duration-200 w-full sm:w-auto"
              size="lg"
            >
              Get a Free Quote
            </Button>
            <Button 
              variant="outline" 
              className="bg-white/80 border-2 border-[#1E90FF] text-[#1E90FF] hover:bg-blue-50 font-semibold px-8 py-4 text-lg rounded-xl shadow w-full sm:w-auto"
              size="lg"
              asChild
            >
              <a href="tel:214-555-1234">
                Call Now
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}