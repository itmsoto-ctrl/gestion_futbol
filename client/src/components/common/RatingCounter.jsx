// 📄 src/components/common/RatingCounter.jsx
import React, { useState, useEffect, useRef, memo } from 'react';
import { animate } from 'framer-motion';

const RatingCounter = memo(({ targetValue, animateOnInit = true }) => {
  // Si animateOnInit es true, empezamos en 0. Si no, en el valor final.
  const [displayValue, setDisplayValue] = useState(animateOnInit ? 0 : targetValue);
  const animatedRef = useRef(false);

  useEffect(() => {
    // Si no queremos animar o el valor es 0, mostramos directo y salimos
    if (!animateOnInit || targetValue === 0) {
        setDisplayValue(targetValue);
        return;
    }

    // Reiniciamos la referencia para que vuelva a animar si cambia de vista
    animatedRef.current = false;

    if (!animatedRef.current) {
      animatedRef.current = true;
      const controls = animate(0, targetValue, {
        duration: 1.5, // ⏳ 1.5 segundos de subida (puedes ajustarlo)
        ease: [0.33, 1, 0.68, 1], // Efecto de frenada suave al final
        onUpdate: (v) => setDisplayValue(Math.floor(v)),
      });
      return () => controls.stop();
    }
  }, [targetValue, animateOnInit]);

  return <span>{displayValue}</span>;
});

export default RatingCounter;