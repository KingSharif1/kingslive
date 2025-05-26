'use client';

import { useEffect } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Services } from '@/components/landing/Services';
import { Testimonials } from '@/components/landing/Testimonials';
import { CTA } from '@/components/landing/CTA';
import { ContactForm } from '@/components/landing/ContactForm';
import { Footer } from '@/components/landing/Footer';

const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
  e.preventDefault();
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
    // Update URL without page reload
    window.history.pushState({}, '', `/landing-page#${sectionId}`);
  }
};

export default function LandingPage() {
  // Handle initial scroll if there's a hash in the URL
  useEffect(() => {
    const handleInitialScroll = () => {
      if (window.location.hash) {
        const element = document.getElementById(window.location.hash.substring(1));
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    };
    
    handleInitialScroll();
  }, []);

  return (
    <main className="min-h-screen">
      <Navbar scrollToSection={scrollToSection} />
      <Hero />
      <Services />
      <Testimonials />
      <CTA />
      <ContactForm />
      <Footer scrollToSection={scrollToSection} />
    </main>
  );
}
