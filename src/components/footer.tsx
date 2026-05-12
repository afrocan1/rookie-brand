import Link from 'next/link'
import Image from 'next/image'

import bewave from '../../public/goaradio logo round (1).png'

export function Footer() {
  return (
    <footer className="max-w-[1060px] w-full mx-auto py-8 flex flex-col items-center justify-center gap-8 md:flex-row md:items-center md:justify-between text-sm mt-[100px] border-t border-[#1A1A1A]">
      <div className="flex flex-col md:flex-row items-center justify-center gap-5">
        <Link
          href="/"
          className="flex items-center justify-center flex-shrink-0"
        >
          <div className="relative w-[62px] h-[62px]">
            <Image
              src={bewave}
              alt="Goaradio logo"
              fill
              priority
              quality={100}
              className="object-contain"
            />
          </div>
        </Link>

        <div
          role="separator"
          className="hidden md:block w-[1px] h-[16px] bg-[#333]"
        ></div>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/terms-of-use"
            className="text-sm text-[#999] hover:text-marfin hover:underline focus:text-marfin focus:underline underline-offset-2 transition-all duration-200"
          >
            Terms of Use
          </Link>
        </div>
      </div>

      <p className="text-[#777] text-center">
        &copy; 2025 Goaradio. All Rights Reserved.
      </p>
    </footer>
  )
}
