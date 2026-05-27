import React from 'react';
import { motion, Variants } from 'motion/react';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  animationDelayFactor?: number;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 0,
  animationDelayFactor = 0.03,
}) => {
  const letters = text.split('');

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: animationDelayFactor,
        delayChildren: delay,
      },
    },
  };

  const childVariants: Variants = {
    hidden: {
      opacity: 0,
      y: '50%',
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 14,
        stiffness: 110,
      },
    },
  };

  return (
    <motion.span
      className={`inline-flex flex-wrap overflow-hidden ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {letters.map((char, index) => (
        <motion.span
          key={index}
          className="inline-block whitespace-pre"
          variants={childVariants}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
};

export default SplitText;
