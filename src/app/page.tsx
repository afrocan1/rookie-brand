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
    title: 'Higher Earnings, Your Way',
    description:
      'GoaRadio pays out 75% of revenue to artists — 85% if you release exclusively with us. Every stream from every fan goes directly to you, not into a pool shared with artists you\'ve never heard of.',
  },
  {
    icon: <LuUser size={42} color="#F5F5F5" />,
    title: 'Your Fans, Your Community',
    description:
      'Invite up to 10,000 fans a month. Build a loyal audience that earns alongside you. On GoaRadio, the people who support your music are rewarded for it — which means they keep coming back.',
  },
  {
    icon: <HiOutlineLightningBolt size={42} color="#F5F5F5" />,
    title: 'Real-Time Everything',
    description:
      'Stream counts, token earnings, fan engagement — all of it, live. Know exactly who\'s listening, when they\'re listening, and what it\'s worth. No black boxes. No 90-day payment cycles.',
  },
]

export default function Home() {
  return (
    <main className="max-w-[1060px] w-full mx-auto">
      <div className="flex flex-col items-center justify-center h-[500px] sm:h-[480px] gap-2">
        <h1 className="text-[45px] font-bold text-center">
          Your music.{' '}
          <span className="gradient-text text-transparent animate-gradient">
            Your earnings.
          </span>
        </h1>

        <p className="max-w-[675px] w-full text-center text-[18px] leading-7 pb-10 md:pb-2 z-10">
          GoaRadio for Artists gives you full control over your profile, your
          catalogue, and your revenue — all in one place.
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
              Got a team or a label? Bring your whole roster.
            </h3>
            <p className="text-[15px]">
              Managing multiple artists on GoaRadio gives you a unified view
              across every profile — streams, earnings, and catalogue all in one
              dashboard. Each artist keeps their own profile and direct fan
              relationship while you oversee the full picture. Click
              &quot;Join Us&quot; and let&apos;s talk about what GoaRadio can
              do for your roster.
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
            Your Profile, Everywhere
          </h2>
          <h3 className="text-beige text-2xl font-madefor-display font-bold mb-4">
            Change it here. It goes live on GoaRadio instantly.
          </h3>
          <p className="text-[15px] leading-7">
            Update your cover art, swap your profile picture, edit your bio —
            everything you change in GoaRadio for Artists reflects immediately
            on your public page. No waiting. No approvals. Your profile is
            yours, and it moves when you move. Listeners across the platform
            always see the version of you that you chose to put forward.
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
            Know Your Numbers
          </h2>
          <h3 className="text-purple text-2xl font-madefor-display font-bold mb-4">
            A dashboard that tells you what actually matters.
          </h3>
          <p className="text-[15px] leading-7">
            See your stream count, $GOA earnings, and fan activity in real
            time. Add or remove tracks, and they show up — or disappear — on
            GoaRadio immediately. No clutter, no guesswork. Just the data you
            need to understand your audience and grow on your own terms.
          </p>
        </div>
      </section>

      <section className="w-full flex flex-col lgp:flex-row items-center justify-center lgp:justify-between gap-12 lgp:gap-20 py-[120px]">
        <div className="flex flex-col gap-3 lgp:max-w-[480px] w-full">
          <h2 className="text-white text-[28px] font-madefor-display font-bold">
            Earn More. Keep More.
          </h2>
          <h3 className="text-blue text-2xl font-madefor-display font-bold mb-4">
            The small pool model changes everything.
          </h3>
          <p className="text-[15px] leading-7 mb-5">
            Spotify splits revenue across every stream on the platform. GoaRadio
            splits each listener&apos;s subscription fee only among the artists
            they actually listened to. If a fan spends 50% of their time on
            your music, you get 50% of their share. That&apos;s the difference
            between being one in a million and being paid like someone&apos;s
            favourite.
          </p>

          <div className="w-full flex items-center gap-10 sm:gap-28">
            <div className="flex flex-col gap-2 text-white font-madefor-display font-bold text-2xl">
              <div className="flex items-center justify-start text-[38px]">
                <p className="">
                  <span className="">75</span>
                </p>
                <span>%</span>
              </div>
              <p>To Artists</p>
            </div>

            <div className="flex flex-col gap-2 text-white font-madefor-display font-bold text-2xl">
              <div className="flex items-center justify-start text-[38px]">
                <p className="">
                  <span className="">85</span>
                </p>
                <span>%</span>
              </div>
              <p>Exclusive</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center flex-grow w-full lgp:justify-between gap-8 lgp:gap-0 flex-wrap lgp:w-auto">
          <div className="max-w-[240px] w-full border border-[#333] rounded-xl text-[13px] p-3">
            <div className="flex items-center justify-between mb-3">
              <p>Big Pool Model</p>
              <span>Spotify</span>
            </div>
            Traditional Platforms
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
                  <DistributionCards name="Revenue Pooled" />
                  <span>Shared with everyone</span>

                  <DistributionCards name="Your Cut" />
                  <span>~60–70% to all artists</span>

                  <DistributionCards name="You Get a Fraction" />
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-[240px] w-full border border-[#333] rounded-xl text-[13px] p-3">
            <div className="flex items-center justify-between mb-3">
              <p>Small Pool Model</p>
              <span>GoaRadio</span>
            </div>
            GoaRadio for Artists
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
                  <DistributionCards name="Fan Subscribes" />
                  <span>Split by listening time</span>

                  <DistributionCards name="Your Share" />
                  <span>75–85% to you</span>

                  <DistributionCards name="You Get Paid Fairly" />
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
