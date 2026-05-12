'use client'

import useEmblaCarousel from 'embla-carousel-react'
import Autoscroll from 'embla-carousel-auto-scroll'
import Image from 'next/image'

type ImageTypes = {
  imageUrl: string
  alt: string
}

export function ImageCarousel() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    Autoscroll({
      speed: 1,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    }),
  ])

  const images: ImageTypes[] = [
    {
      imageUrl: '/images/amayli.jpeg',
      alt: 'amayli jpeg',
    },
    {
      imageUrl: '/images/tidal.png',
      alt: 'Tidal logo',
    },
    {
      imageUrl: '/images/apple-music.png',
      alt: 'Apple Music logo',
    },
    {
      imageUrl: '/images/deezer.png',
      alt: 'Deezer logo',
    },
    {
      imageUrl: '/images/tiktok.png',
      alt: 'TikTok logo',
    },
    {
      imageUrl: '/images/youtube.png',
      alt: 'Youtube logo',
    },
  ]

  return (
    <div className="container-carousel mt-[50px]">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {images.map((image) => (
            <div
              key={image.alt}
              className="flex-[0_0_40%] md:flex-[0_0_18%] min-w-0 flex items-center justify-center"
            >
              <div className="relative w-[110px] h-[110px] rounded-full overflow-hidden border border-[#2A2A2A] bg-[#0D0D0D] shadow-[0_0_40px_0px_#1F59D620] flex items-center justify-center">
                <Image
                  src={image.imageUrl}
                  alt={image.alt}
                  fill
                  quality={100}
                  priority
                  className="object-contain p-5"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
