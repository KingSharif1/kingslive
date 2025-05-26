'use client';

import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NavbarProps {
  scrollToSection: (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => void;
}

export function Navbar({ scrollToSection }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const sectionId = href.substring(1);
      scrollToSection(e, sectionId);
      setIsOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', href: '/landing-page#hero', section: 'hero' },
    { name: 'Services', href: '/landing-page#services', section: 'services' },
    { name: 'Testimonials', href: '/landing-page#testimonials', section: 'testimonials' },
    { name: 'Contact', href: '/landing-page#contact', section: 'contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 backdrop-blur-md z-50 shadow-sm transition-colors duration-200">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link 
          href="#" 
          className="font-bold text-2xl text-[#1E90FF]"
        >
          Dallas Window Cleaning
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={cn(
                'font-medium transition-colors hover:text-[#1E90FF]',
                scrolled || isOpen ? 'text-gray-800 dark:text-gray-200' : 'text-gray-800 dark:text-gray-200',
                'cursor-pointer'
              )}
            >
              {link.name}
            </a>
          ))}
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, '#contact')}
            className="bg-[#1E90FF] border rounded-xl text-white px-6 py-2  font-medium hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Get a Quote
          </a>
          <ThemeToggle />
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-800 dark:text-gray-200"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 py-4 px-4 shadow-lg">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="font-medium text-gray-800 dark:text-gray-200 hover:text-[#1E90FF] transition-colors block py-2"
              >
                {link.name}
              </a>
            ))}
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, '#contact')}
              className="bg-[#1E90FF] border rounded-2xl text-white px-6 py-2 font-medium hover:bg-blue-600 transition-colors text-center block"
            >
              Get a Quote
            </a>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="font-medium text-gray-800 dark:text-gray-200">Theme</span>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}