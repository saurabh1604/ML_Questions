import { useEffect, useState, useRef } from 'react';

export const useResizeObserver = (ref) => {
    const [dimensions, setDimensions] = useState(null);

    useEffect(() => {
        if (!ref.current) return;

        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [ref]);

    return dimensions;
};
