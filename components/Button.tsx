import Image from 'next/image';
import React from 'react'

type ButtonProps = {
    type: 'button' | 'submit';
    title: string;
    icon?: string;
    variant: string;
}

const Button = ({type, title, icon, variant} : ButtonProps) => {
  return (
    <button className={'flextCenter gap-2 rounded-full border ${variant}'} type={type}>
        
        <label className='font-[500] whitespace-nowrap cursor-pointer'>
        {title}    
        </label>
        {icon && <Image src={icon} alt={title} width={20} height={14}/>} 
    </button>
  )
}

export default Button