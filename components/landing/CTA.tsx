'use client';

import { motion } from '@/components/landing/motion';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export function CTA() {
  // Simple scroll function - identical to Hero component
  const scrollToContact = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  return (
    <section className="py-16 bg-white dark:bg-gray-900 overflow-hidden transition-colors duration-200">
      <div className="container mx-auto px-4">
        <div className="relative bg-gradient-to-r from-[#1E90FF] to-blue-600 dark:from-blue-700 dark:to-blue-900 rounded-2xl overflow-hidden shadow-xl transition-colors duration-200">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/20" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-white/20" />
            <div className="absolute right-1/4 top-1/2 w-32 h-32 rounded-full bg-white/20" />
          </div>
          
          <div className="flex flex-col md:flex-row items-center">
            {/* Left side with image */}
            <div className="md:w-2/5 p-8 md:p-12 relative hidden md:block">
              <div className="relative h-64 w-full">
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-xl overflow-hidden">
                  <Image
                    src="https://images.pexels.com/photos/209230/pexels-photo-209230.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                    alt="Clean windows"
                    fill
                    className="object-cover opacity-70 mix-blend-overlay"
                  />
                </div>
              </div>
            </div>
            
            {/* Right side with content */}
            <div className="md:w-3/5 p-8 md:p-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white transition-colors duration-200">
                  Transform Your View Today
                </h2>
                <div className="h-1 w-20 bg-white mb-6"></div>
                <p className="text-white/90 dark:text-white/80 text-lg mb-8 max-w-lg transition-colors duration-200">
                  Professional window cleaning that makes a difference. Get a free, no-obligation quote and see the clarity we can bring to your home or business.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={scrollToContact}
                    className="bg-white hover:bg-gray-100 text-[#1E90FF] font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    Get Your Free Quote
                  </Button>
                  <a
                    href="tel:214-555-1234"
                    className="border-2 border-white text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-xl transition-all duration-200 inline-flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span>Call (214) 555-1234</span>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
