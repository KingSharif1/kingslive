import { motion } from '@/components/landing/motion';
import Link from 'next/link';
import { Facebook, Instagram, Mail, Phone } from 'lucide-react';

interface FooterProps {
  scrollToSection: (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => void;
}

export function Footer({ scrollToSection }: FooterProps) {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const sectionId = href.substring(1);
      scrollToSection(e, sectionId);
    }
  };
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Dallas Window Cleaning</h3>
            <p className="text-gray-300 mb-4">
              Professional window cleaning services for residential and commercial properties in Dallas.
            </p>
            <div className="flex space-x-4">
              <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="h-6 w-6 text-gray-300 hover:text-[#1E90FF] transition-colors" />
              </Link>
              <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="h-6 w-6 text-gray-300 hover:text-[#1E90FF] transition-colors" />
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#" 
                  onClick={(e) => handleNavClick(e, '#')}
                  className="text-gray-300 hover:text-[#1E90FF] transition-colors block py-1"
                >
                  Home
                </a>
              </li>
              <li>
                <a 
                  href="#services" 
                  onClick={(e) => handleNavClick(e, '#services')}
                  className="text-gray-300 hover:text-[#1E90FF] transition-colors block py-1"
                >
                  Services
                </a>
              </li>
              <li>
                <a 
                  href="#testimonials" 
                  onClick={(e) => handleNavClick(e, '#testimonials')}
                  className="text-gray-300 hover:text-[#1E90FF] transition-colors block py-1"
                >
                  Testimonials
                </a>
              </li>
              <li>
                <a 
                  href="#contact" 
                  onClick={(e) => handleNavClick(e, '#contact')}
                  className="text-gray-300 hover:text-[#1E90FF] transition-colors block py-1"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-[#1E90FF]" />
                <span>info@dallaswindowcleaning.com</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-[#1E90FF]" />
                <span>214-555-1234</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-gray-400">© {currentYear} Dallas Window Cleaning. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}