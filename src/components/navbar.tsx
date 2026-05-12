import Link from 'next/link'
import Image from 'next/image'

import bewave from '../../public/goaradio logo round (1).png'

type NavbarMenuType = {
  name: string
  url: string
}

export function Navbar() {
  const menus: NavbarMenuType[] = [
    {
      name: 'Get Started',
      url: '/#vantagens',
    },
    {
      name: 'Dashboard',
      url: '/#dashboard',
    },
  ]

  return (
    <header className="max-w-[1060px] w-full px-5 py-3 shadow-[0_-1px_0_1px_#33333350] bg-black/30 backdrop-blur-[10px] fixed z-40 top-[18px] left-1/2 -translate-x-1/2 flex items-center justify-between rounded-2xl">
      <Link
        href="/"
        className="flex items-center justify-center flex-shrink-0"
      >
        <div className="relative w-[52px] h-[52px] rounded-full overflow-hidden border border-[#2A2A2A] bg-[#0A0A0A]">
          <Image
            src={bewave}
            alt="Goaradio logo"
            fill
            priority
            quality={100}
            className="object-cover scale-[1.05]"
          />
        </div>
      </Link>

      <ul className="flex items-center justify-center gap-6">
        {menus.map((menu) => (
          <Link
            key={menu.name}
            href={menu.url}
            className="text-marfin hover:text-white hover:underline focus:text-white focus:underline underline-offset-2 transition-all duration-200"
          >
            <li className="text-sm font-nunito-sans font-normal">
              {menu.name}
            </li>
          </Link>
        ))}
      </ul>
    </header>
  )
}
