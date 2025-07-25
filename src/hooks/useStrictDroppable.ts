import { useEffect, useState } from 'react';

export const useStrictDroppable = (loading: boolean) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let animationFrame: number;

    if (!loading) {
      animationFrame = requestAnimationFrame(() => {
        setEnabled(true);
      });
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      setEnabled(false);
    };
  }, [loading]);

  return [enabled];
};
