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
      imageUrl: '/images/chetzy.jpeg',
      alt: 'chetzy jpeg',
    },
    {
      imageUrl: '/images/ellson clark.jpg',
      alt: 'ellson clark jpg',
    },
    {
      imageUrl: '/images/faith o'fidel.jpg',
      alt: 'Faith',
    },
    {
      imageUrl: '/images/gucci pucci.jpg',
      alt: 'gucci pucci jpg',
    },
    {
      imageUrl: '/images/shaypee.jpeg',
      alt: 'shaypee',
    },
  ]

  return (
    <div className="container-carousel mt-[50px]">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {images.map((image) => (
            <div
              key={image.alt}
              className="flex-[0_0_45%] md:flex-[0_0_20%] min-w-0 flex items-center justify-center"
            >
              <div className="relative w-[90px] h-[90px] md:w-[110px] md:h-[110px] rounded-full overflow-hidden">
                <Image
                  src={image.imageUrl}
                  alt={image.alt}
                  fill
                  quality={100}
                  priority
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
