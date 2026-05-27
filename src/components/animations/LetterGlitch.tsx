import React, { useState, useEffect, useRef } from 'react';

interface LetterGlitchProps {
  text: string;
  speed?: number;
  className?: string;
  glitchTrigger?: 'hover' | 'always' | 'onload';
}

const LetterGlitch: React.FC<LetterGlitchProps> = ({
  text,
  speed = 40,
  className = '',
  glitchTrigger = 'always',
}) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = '!@#$%^&*()_+{}[]|;:,.<>?0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_';
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isGlitching = useRef(false);

  const triggerGlitch = () => {
    if (isGlitching.current) return;
    isGlitching.current = true;
    let iteration = 0;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      setDisplayText(() =>
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );
      
      if (iteration >= text.length) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        isGlitching.current = false;
        setDisplayText(text);
      }
      
      iteration += 1 / 3;
    }, speed);
  };

  useEffect(() => {
    if (glitchTrigger === 'always') {
      const glitcheTimer = setInterval(triggerGlitch, 6000);
      triggerGlitch();
      return () => {
        clearInterval(glitcheTimer);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      triggerGlitch();
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [text, speed, glitchTrigger]);

  const handleMouseEnter = () => {
    if (glitchTrigger === 'hover') {
      triggerGlitch();
    }
  };

  return (
    <span className={className} onMouseEnter={handleMouseEnter}>
      {displayText}
    </span>
  );
};

export default LetterGlitch;
