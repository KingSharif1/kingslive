import Image from 'next/image';

type ButtonProps = {
    type: 'button' | 'submit';
    title: string;
    icon?: string;
    variant: string;
    onClick?: () => void;
}

const Button = ({type, title, icon, variant, onClick} : ButtonProps) => {
  return (
    <button className={`flexCenter gap-2 rounded-full border ${variant}`} type={type} onClick={onClick}>
      <label className='font-[500] whitespace-nowrap cursor-pointer'>
      {title} 
      </label>
      {icon && <Image src={icon} alt={title} width={16} height={16}/>} 
    </button>
  )
}

export default Button