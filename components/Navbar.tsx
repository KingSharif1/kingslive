import { NAV_LINKS } from '@/constants'
import { link } from 'fs'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export const Navbar = () => {
  return (
    <nav className='padding-container relative z-30 rounded-lg bg-white shadow-xl ring-1 ring-slate-100 '>\
      <div className="flexBetween max-container">
        <Link href="/" className='bold-28 capitalize relative'>
          Ki<span className='text-blue-700'>ng</span><span className='absolute top-[-0.3rem] right-[-1rem] h-5 w-5 
          linearGrandient rounded-full -z-10>'></span>
        </Link>

        <ul className='hidden h-full gap-6 lg:flex px-6 py-3'>
          {
            NAV_LINKS.map((link) => (
              <Link href={link.href} key={link.key} className='flexCenter text-[15px] font-[500] text-black
              hover:bg-blue-500 hover:text-white px-4 py-1 rounded-full cursor-pointer transition-all duration-300'>
                {link.label}
               </Link>
            ))
          }
        </ul>
        <Image
          src={"menu.svg"}
          alt='meun'
          width={28}
          height={28}
          className='inline-block cursor-pointer lg:hidden'
        />
      </div>  
    </nav>
  )
}
export default Navbar