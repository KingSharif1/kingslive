import { PORTFOLIO } from '@/constants'
import Image from 'next/image'
import React from 'react'
import Button from './Button'

const Portfolio = () => {
  return (
    <section id="portfolio" className="max-container padding-container gap-20 py-10 pb-32 md:gap-28 lg:py-20 xl:flex-row bg[]#f7f7f7">
    {/* Title */}
      <div className="text-center bold-18 uppercase tracking-[1rem] text-blue-500 pb-20">Portfolio</div>
      <ul className='my-7 grid gap-x-14 gap-y-12 md:grid-cols-2 xl:grid-cols-3 w-full m-auto'>
        {
          PORTFOLIO.map((portfolio) => (
              <PortfolioItem
              key={portfolio.title}
              imgURL={portfolio.ImgURL}
              title={portfolio.title}
              description={portfolio.description}
              />
          ))
        }
      </ul>

    </section> 
  )
}

export default Portfolio

type PortfolioItem ={
  title:string;
  imgURL: string;
  description: string;
}

const PortfolioItem = ({title, imgURL, description} : PortfolioItem) =>{
  return(
    <li className='relative felx w-full flex-1 felx-col rounded-lg border-x border-b overflow-y-visible group'>
      <div className="group-hover:scale-110 transition-all duration-500">
          <Image src={imgURL} alt='map' width={444} height={444} />
      <div className='px-6 py-4 '>
        <h3 className='bold-18 lg:bold-20 my-4 capitalize'>{title}</h3>
        <p className='regular-16 text-gray-30 mb-4'>{description}</p>
        <div className='flex'>

          <Button
            type='button'
            title='Read More'
            icon='/download.svg'
            variant='btn_dark_rounded'
          />
          <Button
          type='button'
          title='View Code'
          icon='/github.svg'
          variant='btn_white_rounded'
        />
        </div>
      </div>
      </div>
    </li>
  )
}