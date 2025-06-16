import Image from 'next/image'
import React from 'react'

interface ProductImageProps {
    src: string;
    alt: string;
    heightClass?: string;
    widthClass?: string;
}

const ProductImage: React.FC<ProductImageProps> = ({
    src,
    alt,
    heightClass = '',
    widthClass = ''
}) => {
    const baseURL = 'https://falctcisjrcijtumhrku.supabase.co/storage/v1/object/public/image/';

    // Si src commence par http, on le garde, sinon on le construit avec baseURL
    const formattedSrc = src.startsWith('http') ? src : `${baseURL}${src}`;

    // Si src est une URL blob (preview locale), on retourne une <img> classique
    if (src.startsWith('blob:')) {
        return (
            <div className='avatar'>
                <div className={`mask mask-squircle ${heightClass} ${widthClass}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src}
                        alt={alt}
                        className='object-cover'
                        style={{ height: '200', width: '500px', borderRadius: '1rem' }}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className='avatar'>
            <div className={`mask mask-squircle ${heightClass} ${widthClass}`}>
                <Image
                    src={formattedSrc}
                    alt={alt}
                    quality={100}
                    className='object-cover'
                    height={500}
                    width={500}
                />
            </div>
        </div>
    )
}

export default ProductImage
