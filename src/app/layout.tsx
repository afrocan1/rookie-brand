/* eslint-disable camelcase */
/* eslint-disable react-refresh/only-export-components */
import './global.css'
import type { Metadata } from 'next'
import {
  Nunito_Sans,
  Wix_Madefor_Display,
  Wix_Madefor_Text,
} from 'next/font/google'
import { Navbar } from '../components/navbar'
import { Footer } from '../components/footer'
import { NavbarVisibilityWrapper } from '../components/NavbarVisibilityWrapper'

export const metadata: Metadata = {
  title: 'Goaradio for Artists',
  description:
    'Goaradio for Artists helps creators grow their audience, track engagement, and earn through a listener-first streaming ecosystem built around artists and fans.',
  keywords: [
    'Goaradio',
    'Goaradio for Artists',
    'music streaming',
    'artist platform',
    'listen to earn',
    'music distribution',
    'artist dashboard',
    'music discovery',
    'streaming platform',
    'creator economy',
    'web3 music',
    'artist rewards',
    'fan engagement',
  ],
  authors: [
    {
      name: 'Goaradio',
      url: 'https://goaradio.org',
    },
  ],
  creator: 'Goaradio',
  publisher: 'Goaradio',
  applicationName: 'Goaradio for Artists',
  icons: {
    icon: '/goaradio logo round (1).png',
    apple: '/goaradio logo round (1).png',
    shortcut: '/goaradio logo round (1).png',
  },
  openGraph: {
    title: 'Goaradio for Artists',
    description:
      'Build deeper fan connections, track real engagement, and grow your audience with Goaradio for Artists.',
    siteName: 'Goaradio',
    type: 'website',
    images: [
      {
        url: '/goaradio logo round (1).png',
        width: 512,
        height: 512,
        alt: 'Goaradio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Goaradio for Artists',
    description:
      'A streaming platform built around artists, listeners, and real engagement.',
    images: ['/goaradio logo round (1).png'],
  },
}

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-nunito-sans',
})
const madeforDisplay = Wix_Madefor_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-madefor-display',
})
const madeforText = Wix_Madefor_Text({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        id="root"
        className={`${madeforText.className} ${madeforDisplay.variable} ${nunitoSans.variable} bg-black text-marfin min-h-screen flex flex-col justify-between px-5`}
      >
        <NavbarVisibilityWrapper>
          <Navbar />
        </NavbarVisibilityWrapper>

        {children}

        <NavbarVisibilityWrapper>
          <Footer />
        </NavbarVisibilityWrapper>
      </body>
    </html>
  )
}
