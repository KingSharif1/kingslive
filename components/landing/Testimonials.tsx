'use client';

import { motion } from '@/components/landing/motion';
import { Star } from 'lucide-react';

export function Testimonials() {
  const testimonials = [
    {
      name: 'John S.',
      role: 'Homeowner',
      content:
        'Best window cleaning service in Dallas! They were professional, thorough, and left my windows sparkling clean. The team was respectful of my property and finished the job quickly. Highly recommend!',
      rating: 5,
    },
    {
      name: 'Sarah M.',
      role: 'Business Owner',
      content:
        'We\'ve used Dallas Window Cleaning for our office building for two years now. Their attention to detail is impressive and their prices are fair. Our customers always comment on how clean our windows look!',
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="py-16 md:py-20 bg-gradient-to-b from-white via-blue-50/60 to-white dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-900 transition-colors duration-200">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight transition-colors duration-200">
            What Our Customers Say
          </h2>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-white/80 dark:bg-gray-800/80 shadow-lg transition-colors duration-200">
          <div className="flex items-center h-40 md:h-48 animate-marquee whitespace-nowrap will-change-transform">
            {testimonials.concat(testimonials).map((testimonial, index) => (
              <div
                key={index}
                className="flex items-center min-w-[500px] md:min-w-[650px] px-12 py-8 mx-6 bg-blue-50/90 dark:bg-blue-900/30 rounded-2xl shadow-lg border border-blue-100 dark:border-blue-900/50 transition-colors duration-200"
              >
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-[#1E90FF] text-white rounded-full h-20 w-20 flex items-center justify-center font-bold text-2xl shadow-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 text-yellow-400 fill-yellow-400 mr-1" />
                    ))}
                  </div>
                  <div className="text-gray-800 dark:text-white font-semibold text-xl md:text-2xl leading-snug mb-2 max-w-[400px] md:max-w-[500px] truncate transition-colors duration-200">
                    "{testimonial.content}"
                  </div>
                  <div className="text-base text-gray-500 dark:text-gray-400 mt-2 transition-colors duration-200">- {testimonial.name}, {testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 32s linear infinite;
          }
        `}</style>
      </div>
    </section>
  );
}