import { Cards, CardsProps } from '../components/cards'
import { CTAButton } from '../components/cta-button'
import { ImageCarousel } from '../components/image-carousel'

import { AiOutlinePercentage } from 'react-icons/ai'
import { LuUser } from 'react-icons/lu'
import { HiOutlineLightningBolt } from 'react-icons/hi'
import { IoArrowForwardCircleOutline } from 'react-icons/io5'
import { FaRegCircle } from 'react-icons/fa'
import Spline from '@splinetool/react-spline/next'

import Image from 'next/image'

const infoCards: CardsProps[] = [
  {
    icon: <AiOutlinePercentage size={42} color="#F5F5F5" />,
    title: 'Fairer Revenue Distribution',
    description:
      'Goaradio uses a listener-first payout model designed to give artists a larger share of revenue based on real fan engagement, not platform-wide stream pools.',
  },
  {
    icon: <LuUser size={42} color="#F5F5F5" />,
    title: 'Built Around Artists',
    description:
      'From audience growth tools to real-time insights, Goaradio for Artists gives you direct access to the people supporting your music every day.',
  },
  {
    icon: <HiOutlineLightningBolt size={42} color="#F5F5F5" />,
    title: 'Instant Global Reach',
    description:
      'Release music, podcasts, and audio experiences to a growing global audience while keeping full visibility over streams, rewards, and engagement.',
  },
]

export default function Home() {
  return (
    <main className="max-w-[1060px] w-full mx-auto">
      <div className="flex flex-col items-center justify-center h-[500px] sm:h-[480px] gap-2">
        <h1 className="text-[45px] font-bold text-center">
          Goaradio{' '}
          <span className="gradient-text text-transparent animate-gradient">
            for Artists
          </span>
        </h1>

        <p className="max-w-[675px] w-full text-center text-[18px] leading-7 pb-10 md:pb-2 z-10">
          Build deeper fan connections, earn from real engagement, and grow your
          audience on a streaming platform designed around artists.
        </p>

        <CTAButton />
      </div>

      <section className="w-full pb-[120px]">
        <ImageCarousel />
      </section>

      <section className="w-full flex flex-col items-center justify-center lgp:items-start lgp:justify-start gap-8 lgp:gap-6 py-[120px]">
        <div className="w-full flex items-center justify-center gap-8 lgp:justify-between lgp:gap-0 flex-wrap">
          {infoCards.map((card) => (
            <Cards
              key={card.title}
              icon={card.icon}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>

        <div className="bg-marfin text-black rounded-3xl p-8 flex flex-col md:flex-row items-center justify-center gap:6 md:justify-between md:gap-10">
          <div className="flex flex-col gap-2 max-w-[915px]">
            <h3 className="text-[18px] font-madefor-display font-bold text-black">
              Everything Artists Need In One Place
            </h3>

            <p className="text-[15px]">
              Goaradio for Artists gives creators access to audience insights,
              royalty tracking, engagement tools, and a listener-first streaming
              model built for long-term growth. Whether you are building an
              independent catalog or scaling an established fanbase, Goaradio
              helps you reach listeners globally while creating stronger artist
              and fan relationships inside one connected ecosystem.
            </p>
          </div>

          <div className="md:h-full hidden md:block">
            <IoArrowForwardCircleOutline size={40} />
          </div>
        </div>
      </section>

      <section
        id="vantagens"
        className="w-full flex flex-col lgp:flex-row items-center justify-center lgp:justify-between gap-12 lgp:gap-34 py-[120px]"
      >
        <div className="flex flex-col gap-3 lgp:max-w-[480px] w-full">
          <h2 className="text-white text-[28px] font-madefor-display font-bold">
            Reach Fans Worldwide
          </h2>

          <h3 className="text-beige text-2xl font-madefor-display font-bold mb-4">
            A new generation streaming platform built for discovery
          </h3>

          <p className="text-[15px] leading-7">
            Goaradio connects artists with listeners through a transparent and
            community-driven ecosystem. Fans are rewarded for listening while
            artists earn based on real engagement. From curated playlists to
            personalized recommendations and interactive discovery tools,
            Goaradio creates more opportunities for your music to travel further
            and reach the right audience.
          </p>
        </div>

        <div className="max-w-[500px] w-full max-h-[500px] aspect-square rounded-2xl bg-[#333] flex items-center justify-center shadow-[0_0_64px_5px_#1F59D620]">
          <div className="w-[calc(100%-2px)] h-[calc(100%-2px)] rounded-2xl overflow-hidden relative">
            <Spline scene="https://prod.spline.design/QZL1XGoS5efv23NY/scene.splinecode" />
          </div>
        </div>
      </section>

      <section
        id="dashboard"
        className="w-full flex flex-col-reverse lgp:flex-row items-center justify-center lgp:justify-between gap-12 lgp:gap-4 py-[120px]"
      >
        <div className="image-wrapper">
          <div className="w-[calc(100%-2px)] h-[calc(100%-2px)] z-20 relative rounded-2xl overflow-hidden bg-[#111]">
            <Image
              src="/images/dark-background.png"
              alt="Image with a black background and a metallic blue gradient"
              className="object-scale-down"
              objectFit="cover"
              quality={100}
              fill
              sizes="(min-width: 726px) 70vw, 100vw"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 lgp:max-w-[480px] w-full">
          <h2 className="text-white text-[28px] font-madefor-display font-bold">
            Real-Time Artist Insights
          </h2>

          <h3 className="text-purple text-2xl font-madefor-display font-bold mb-4">
            Understand Your Audience Better
          </h3>

          <p className="text-[15px] leading-7">
            Track streams, monitor listener activity, measure fan engagement,
            and follow your growth from one clean dashboard. Goaradio for
            Artists keeps the experience simple while giving creators access to
            the data that matters most. Stay updated with audience trends,
            playlist performance, release activity, and ecosystem rewards in
            real time.
          </p>
        </div>
      </section>

      <section className="w-full flex flex-col lgp:flex-row items-center justify-center lgp:justify-between gap-12 lgp:gap-20 py-[120px]">
        <div className="flex flex-col gap-3 lgp:max-w-[480px] w-full">
          <h2 className="text-white text-[28px] font-madefor-display font-bold">
            Built For Long-Term Growth
          </h2>

          <h3 className="text-blue text-2xl font-madefor-display font-bold mb-4">
            More Than Just Streaming
          </h3>

          <p className="text-[15px] leading-7 mb-5">
            Goaradio combines streaming, community, and rewards into one
            ecosystem. Artists can grow loyal fanbases, unlock new revenue
            opportunities, and build stronger relationships with listeners who
            actively support their music. Every stream becomes part of a more
            transparent and artist-focused future.
          </p>

          <div className="w-full flex items-center gap-10 sm:gap-28">
            <div className="flex flex-col gap-2 text-white font-madefor-display font-bold text-2xl">
              <div className="flex items-center justify-start text-[38px]">
                <p>
                  <span>150</span>
                </p>

                <span>+</span>
              </div>

              <p>Countries</p>
            </div>

            <div className="flex flex-col gap-2 text-white font-madefor-display font-bold text-2xl">
              <div className="flex items-center justify-start text-[38px]">
                <p>
                  <span>75%</span>
                </p>

                <span>+</span>
              </div>

              <p>Artist Revenue Share</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center flex-grow w-full lgp:justify-between gap-8 lgp:gap-0 flex-wrap lgp:w-auto">
          <div className="max-w-[240px] w-full border border-[#333] rounded-xl text-[13px] p-3">
            <div className="flex items-center justify-between mb-3">
              <p>Traditional Streaming</p>

              <span>Big Pool</span>
            </div>

            {'Other Platforms'}

            <div className="flex items-center mt-6 gap-3">
              <div className="pl-2 flex flex-col items-center justify-center">
                <Circle />

                <DashedLine />

                <Circle />

                <DashedLine />

                <Circle />
              </div>

              <div className="flex-grow flex flex-col items-start justify-center">
                <div className="flex flex-col items-center justify-center gap-8">
                  <DistributionCards name="Platform Pooling" />

                  <span>Shared revenue</span>

                  <DistributionCards name="Lower Artist Share" />

                  <span>Industry standard</span>

                  <DistributionCards name="Limited Fan Connection" />
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-[240px] w-full border border-[#333] rounded-xl text-[13px] p-3">
            <div className="flex items-center justify-between mb-3">
              <p>Goaradio Model</p>

              <span>Listener First</span>
            </div>

            {'Goaradio'}

            <div className="flex items-center mt-6 gap-3">
              <div className="pl-2 flex flex-col items-center justify-center">
                <Circle />

                <DashedLine />

                <Circle />

                <DashedLine />

                <Circle />
              </div>

              <div className="flex-grow flex flex-col items-start justify-center">
                <div className="flex flex-col items-center justify-center gap-8">
                  <DistributionCards name="Direct Artist Support" />

                  <span>Fan-based payouts</span>

                  <DistributionCards name="Higher Revenue Share" />

                  <span>Up to 85%</span>

                  <DistributionCards name="Rewarded Fan Engagement" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function DistributionCards({ name }: { name: string }) {
  return (
    <div className="w-[154px] py-2 border border-[#333] rounded-3xl flex items-center justify-center text-[13px]">
      {name}
    </div>
  )
}

function Circle() {
  return (
    <div role="figure" className="flex items-center justify-center py-4">
      <FaRegCircle size={13} className="text-white" />
    </div>
  )
}

function DashedLine() {
  return (
    <div
      role="figure"
      className="border border-dashed border-white h-[75px]"
    ></div>
  )
}
