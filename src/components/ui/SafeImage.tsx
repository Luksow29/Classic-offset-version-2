import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    fallbackSrc?: string;
    width?: number;
    height?: number;
    priority?: boolean;
}

const SafeImage: React.FC<SafeImageProps> = ({
    src,
    alt,
    fallbackSrc = '/placeholder-image.png', // Ensure you have a placeholder or similar
    width,
    height,
    priority = false,
    className,
    ...props
}) => {
    const [imgSrc, setImgSrc] = useState<string>(src);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Basic Supabase Storage Transformation Logic
        // Only applies if the URL is from our Supabase project and "transform" isn't already there
        // Note: Supabase Storage optimization requires Pro plan or specific setup, but basic resizing is often supported via query params if configured.
        // For now, we'll just stick to native optimizations unless we detect a transformable URL.

        // Check if it is a supabase storage url
        const isSupabase = src.includes('supabase.co/storage/v1/object/public');

        // Example transformation (width/height) - this depends on Supabase Image Transformation feature being enabled
        if (isSupabase && (width || height) && !src.includes('?')) {
            // const transformParams = [];
            // if (width) transformParams.push(`width=${width}`);
            // if (height) transformParams.push(`height=${height}`);
            // if (transformParams.length > 0) {
            //    setImgSrc(`${src}?${transformParams.join('&')}`);
            //    return;
            // }
        }

        setImgSrc(src);
        setError(false);
    }, [src, width, height]);

    const handleError = () => {
        if (!error) {
            setError(true);
            setImgSrc(fallbackSrc);
        }
    };

    return (
        <img
            src={imgSrc}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            width={width}
            height={height}
            className={className}
            onError={handleError}
            {...props}
        />
    );
};

export default SafeImage;
