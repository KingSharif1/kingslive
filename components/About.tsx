import React from 'react'
import Image from 'next/image'
import Button from './Button'

const About = () => {
  return (
    <section id="about" className="max-container padding-container gap-20 py-10 pb-32 md:gap-28 lg:py-20">
      <div className="text-center bold-18 uppercase tracking-[1rem] text-blue-500 pb-20">About</div>
      <div className="flex flex-wrap md:flex-col gap-20 mg:gap-28 xl:flex-row">
        <div className="w-45 md:w-full flex-1 flexCenter flex-col m-auto">
          <p className="mb-8">
            <span className='font-extrabold'>Amor Fati</span> is a latin phrase which means &ldquo;Love of fate&rdquo;.
            A Stoic never complains about fate and accepts whatever fate throws his way. 
            He only focuses on what he controls and tries to make the best possible decisions.
          </p>
          <Button
            type='button'
            title='Read more'
            icon='/more.svg'
            variant='btn_dark_rounded'
          />
        </div>
        <div className="w-fit md:w-full flex-1 flexCenter">
          <Image src="/p21.png" alt="about" height={333} width={333} className="hidden w-auto rounded-full shadow-sm lg:h-auto md:object-scale-down md:h-72 md:block"/>
        </div>

      </div>
    </section>
  )
}

export default About