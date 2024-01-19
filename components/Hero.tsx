"use client"
import Image from 'next/image'
import React from 'react'
import { Typewriter } from 'react-simple-typewriter'
import Button from './Button'

const Hero = () => {
  return (
    <section className='max-container padding-container flex flex-col flexCenter gap-20 py-10 pb-32 
    md:gap-28 lg:py-20 lg:flex-row'>
      <span className='max-container absolute top-64 left-44 h-[144px] w-[777px] bg-blue-400 
      rounded-full shadow-lg blur-[7rem] -z-10'></span>

      {/* LEFT */}
      <div className='relative z-20 flex flex-1 flex-col pt-16'>
        <h4 className='bold-20'>Hello,</h4>
        <h1 className='bold-48 lg:bold-64 relative'>I&apos;m King Sharif</h1>
        <h2 className='bold-28 lg:blod-32 text-[1.8rem] capitalize'>
          A {''}
          <span>
            <Typewriter
              words={['Student', 'Software Engineer', 'Entrepreneur', 'Youtuber']}
              loop={true}
              cursor
              cursorStyle=''
              typeSpeed={70}
              deleteSpeed={50}
              delaySpeed={1000}
            />
          </span>
        </h2>
        <p className='regular-16 max-w-[555px] my-4'> 
          <span className='font-extrabold'>Amor Fati</span> is a latin phrase which means &ldquo;Love of fate&rdquo;.
          A Stoic never complains about fate and accepts whatever fate throws his way. 
          He only focuses on what he controls and tries to make the best possible decisions.
        </p>

        {/* 5 star rating with num of review */}
        {/* <div className='my-5 flex flex-wrap gap-5'>
          <div className='flex items-center gap-2'>
            {
              Array(5).fill(1).map((_, index) => (
                <Image src={"/star.svg"} key={index} alt='star' height={24} width={24} />
              ))
            }
          </div>
          <p className='bold-18 lg:bold-20'> 1100+ <span className='regular-16 lg:regular-20'> Excellent Reviews</span></p>
        </div> */}
        {/* Button part */}
        <div className='flexStart gap-1 pt-6 '>
          {/* resume download */}
          <Button
            type='button'
            title='Download CV'
            icon='/download.svg'
            variant='btn_dark_rounded'
          />
          {/* redirect to contact page */}
          <Button
            type='button'
            title='Contact me'
            icon='/arrow-right.svg'
            variant='btn_white_rounded'
          />
        </div>
      </div>

      {/* Image to the Right */}
      <div className='flex flex-1 xl:flexEnd'>
        <Image src='/p1.PNG' alt='bg' width={488} height={488} className='w-auto'/>
      </div>
    </section>
  )
}

export default Hero