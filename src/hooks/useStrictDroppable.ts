import { useEffect, useState } from 'react';

// This hook is no longer needed with @dnd-kit, but keeping for backward compatibility
// @hello-pangea/dnd handles strict mode better than react-beautiful-dnd
export const useStrictDroppable = (loading: boolean) => {
  const [enabled, setEnabled] = useState(true); // Always enabled with @dnd-kit

  useEffect(() => {
    if (!loading) {
      setEnabled(true);
    }
  }, [loading]);

  return [enabled];
};
