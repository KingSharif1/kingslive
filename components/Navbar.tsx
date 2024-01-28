"use client"
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NAV_LINKS } from '@/constants';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { FiMenu, FiX } from "react-icons/fi";
import ThemeSwitch from './ThemeSwitch';

const Navbar = () => {
  const pathname = usePathname();
  const [isMenuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  return (
    <header>
      <nav className='flex padding-container sticky m-2.5  z-30 w-full rounded-lg  shadow-xl ring-1 ring-slate-100 dark:ring-slate-950 py-3 lg:py-2.5 lg:p-2'>
        <div className='flexBetween w-[99%]'>
          <Link href='/' className='bold-28 capitalize relative'>
            Ki<span className='text-blue-700'>ng Sh</span>arif
            <span className='absolute top-[-0.3rem] right-[-1rem] h-5 w-5 linearGrandient rounded-full -z-10>'></span>
          </Link>


          <ul className={clsx('hidden h-full gap-6 lg:flex px-6 py-3 flex-row-reverse items-center', { 'hidden': isMenuOpen })}>
            {NAV_LINKS.map((link) => (
              <Link
                href={link.href}
                key={link.key}
                className='dark:text-white  flexCenter text-[15px] font-[500] text-black hover:bg-blue-500 hover:text-white px-4 py-1 rounded-full cursor-pointer transition-all duration-300'
                replace
              >
                {link.label}
              </Link>
            ))}
          </ul>

          {isMenuOpen ? (
            <div className='rounded-lg pt-3.5 pr-7 flex flex-col justify-start content-end flex-wrap items-end fixed top-0 right-0 w-80 gap-y-8 h-full bg-white lg:hidden transition-transform duration-300 transform translate-x-0'>
              <FiX className='text-4xl' onClick={toggleMenu} />
              <div className='w-[inherit]'>
                <ul className='text-lg h-full flex flex-wrap flex-col content-around items-center gap-y-[25px]'>
                  {NAV_LINKS.map((link) => (
                    <Link
                      href={link.href}
                      key={link.key}
                      className='text-black hover:bg-blue-500 hover:text-white rounded-full px-4 py-2 @apply transition-all duration-[.3s] relative'
                      onClick={toggleMenu}
                    >
                      {link.label}
                    </Link>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <FiMenu className='inline-block cursor-pointer text-4xl lg:hidden' onClick={toggleMenu} />
          )}
        </div>

        <div className='flex w-[2%] items-center'>   <ThemeSwitch></ThemeSwitch>  </div>
      </nav>
    </header>


  );
};

export default Navbar;