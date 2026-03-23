'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedHeroTextProps {
  titles: string[];
  interval?: number;
  className?: string;
}

function AnimatedHeroText({ titles, interval = 2000, className = '' }: AnimatedHeroTextProps) {
  const [titleNumber, setTitleNumber] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, interval);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles, interval]);

  return (
    <span className={`relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1 ${className}`}>
      &nbsp;
      <AnimatePresence mode="wait">
        {titles.map((title, index) =>
          titleNumber === index ? (
            <motion.span
              key={index}
              className="absolute font-semibold"
              initial={{ opacity: 0, y: '-100%' }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '150%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 50 }}
            >
              {title}
            </motion.span>
          ) : null
        )}
      </AnimatePresence>
    </span>
  );
}

export { AnimatedHeroText };
