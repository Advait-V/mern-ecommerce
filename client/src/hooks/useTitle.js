// src/hooks/useTitle.js
// Custom hook — sets the browser tab title on any page

import { useEffect } from 'react';

const useTitle = (title) => {
  useEffect(() => {
    document.title = `${title} | MERNShop`;
    // Cleanup: reset title when component unmounts
    return () => { document.title = 'MERNShop'; };
  }, [title]);
};

export default useTitle;