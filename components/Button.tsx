import Image from 'next/image';
import React from 'react';

type ButtonProps = {
    type: 'button' | 'submit';
    title: string;
    icon?: string;
    variant: string;
    onClick?: () => void;
    href?: string; // Optional href link
}

const Button = ({type, title, icon, variant, onClick, href}: ButtonProps) => {
  const buttonContent = (
    <>
      <label className='font-[500] whitespace-nowrap cursor-pointer'>
        {title} 
      </label>
      {icon && <Image src={icon} alt={title} width={16} height={16}/>} 
    </>
  );

  if (href) {
    return (
      <a href={href} className={`flexCenter gap-2 rounded-full border ${variant}`} onClick={onClick}>
        {buttonContent}
      </a>
    );
  } else {
    return (
      <button className={`flexCenter gap-2 rounded-full border ${variant}`} type={type} onClick={onClick}>
        {buttonContent}
    </button>
    );
  }
}

export default Button;
