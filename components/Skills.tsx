import { SKILLS } from '@/constants'
import React from 'react'
import Image from 'next/image'

/** to add more skill on /constants/index */
const Skills = () => {
  return (
    <section id="skills" className="max-container padding-container gap-20 py-10 pb-32 md:gap-28 lg:py-20 xl:flex-row">
      {/* Title */}
      <div className="text-center bold-18 uppercase tracking-[1rem] text-blue-500 pb-20">Skills</div>
      <ul className=" grid md:mt-10 md:grid-cols-2 lg:grid-cols-3 md:gap-12">
        {
          SKILLS.map((skill) => (
            <SkillItem 
              key={skill.title}
              icon={skill.icon}
              title={skill.title}
              description={skill.description}
            />
          ))
        }
        
      </ul>
    </section>
  )
}

export default Skills

type SkillItem = {
  title: string;
  icon: string;
  description: string;

}
const SkillItem = ({title, icon, description}: SkillItem) => {
  return(
    <li className='relative flex w-full flex-1 flex-col items-center text-center shadow-[0_35px_450px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_6px_0px_rgba(0,0,0,0.5)]
      rounded-2xl p-10 hover:bg-blue-500 group duration-[950ms] transition'>
      <div className='rounded-full p-5 bg-blue-500 absolute -top-8 group-hover:bg-black'>
        <Image src={icon} alt='map' width={28} height={28}/>
      </div>
      <h3 className='bold-20 lg:bold-22 mt-6 capitalize group-hover:text-white'>{title}</h3>
      <p className='regular-16 text-gray-30 mt-4 group-hover:text-white'>{description}</p>
    </li>
  )
}