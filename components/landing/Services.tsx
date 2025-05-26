'use client';

import { Home, Building2, MonitorSmartphone, Droplets, Sun, Sparkles } from 'lucide-react';
import { motion } from '@/components/landing/motion';

export function Services() {
  const services = [
    {
      title: 'Residential Window Cleaning',
      description: 'Professional cleaning for homes of all sizes. We ensure streak-free, crystal-clear windows that enhance your home\'s appearance and let in more natural light.',
      icon: <Home className="h-10 w-10 text-[#1E90FF]" />,
      features: ['Interior & Exterior', 'Screen & Track Cleaning', 'Hard Water Stain Removal', 'Screen Repair']
    },
    {
      title: 'Commercial Window Cleaning',
      description: 'Keep your business looking professional with our commercial window cleaning services. We work efficiently to minimize disruption to your business operations.',
      icon: <Building2 className="h-10 w-10 text-[#1E90FF]" />,
      features: ['Storefronts', 'Office Buildings', 'High-Rise Windows', 'Post-Construction Cleanup']
    },
    {
      title: 'Screen & Track Cleaning',
      description: 'Remove dirt, dust, and debris from your window screens to improve airflow and enhance your view. We carefully clean each screen to extend its lifespan.',
      icon: <MonitorSmartphone className="h-10 w-10 text-[#1E90FF]" />,
      features: ['Screen Removal & Cleaning', 'Track Vacuuming', 'Dust & Debris Removal', 'Screen Reinstallation']
    },
    {
      title: 'Pressure Washing',
      description: 'Restore your property\'s exterior with our professional pressure washing services. Perfect for driveways, sidewalks, and building exteriors.',
      icon: <Droplets className="h-10 w-10 text-[#1E90FF]" />,
      features: ['Building Exteriors', 'Driveways', 'Sidewalks', 'Awnings']
    },
    {
      title: 'Solar Panel Cleaning',
      description: 'Maximize your solar panel efficiency with our specialized cleaning service. Remove dirt, dust, and debris that can reduce energy production.',
      icon: <Sun className="h-10 w-10 text-[#1E90FF]" />,
      features: ['Efficiency Boost', 'Gentle Cleaning', 'Inspection', 'Maintenance Tips']
    },
    {
      title: 'Gutter Cleaning',
      description: 'Keep your gutters flowing freely with our professional gutter cleaning service. Prevent water damage and protect your home\'s foundation.',
      icon: <Sparkles className="h-10 w-10 text-[#1E90FF]" />,
      features: ['Debris Removal', 'Downspout Cleaning', 'Inspection', 'Preventative Maintenance']
    }
  ];

  return (
    <section id="services" className="relative py-24 bg-gradient-to-b from-blue-50/80 via-white/90 to-blue-100/60 dark:from-blue-900/20 dark:via-gray-900 dark:to-blue-900/30 overflow-hidden transition-colors duration-200">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-[#1E90FF]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-200/30 rounded-full blur-2xl" />
      </div>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight transition-colors duration-200"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Our Services
          </motion.h2>
          <motion.p 
            className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-200"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Professional, reliable, and always spotless. Explore what we can do for you!
          </motion.p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="group bg-white/90 dark:bg-gray-800/90 border border-blue-100 dark:border-blue-900/50 rounded-2xl shadow-xl p-8 flex flex-col items-start transition-all duration-200 hover:shadow-2xl hover:-translate-y-1"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl shadow group-hover:bg-[#1E90FF]/10 dark:group-hover:bg-[#1E90FF]/20 transition-all">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold ml-4 text-gray-900 dark:text-white group-hover:text-[#1E90FF] transition-colors">
                  {service.title}
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed transition-colors duration-200">{service.description}</p>
              {service.features && (
                <ul className="space-y-1 mt-3 w-full">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
                      <svg className="h-4 w-4 text-[#1E90FF] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}