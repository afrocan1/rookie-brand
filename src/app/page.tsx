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
    title: 'Lower Fees, Higher Earnings',
    description:
      'Cutting costs is the first step to increasing your earnings. Take advantage of our competitive commission, high-quality services, and deep knowledge of the digital market to expand your content globally.',
  },
  {
    icon: <LuUser size={42} color="#F5F5F5" />,
    title: 'Dedicated Support',
    description:
      'Our support team will help you every step of the way. We are committed to solving any issue or question that may arise, ensuring you have all the support you need for your success.',
  },
  {
    icon: <HiOutlineLightningBolt size={42} color="#F5F5F5" />,
    title: 'Faster Approval Time',
    description:
      'Get your content into stores quickly, taking advantage of new promotion and production opportunities. Our team is dedicated to approving your content in less than 24 hours.',
  },
]

export default function Home() {
  return (
    <main className="max-w-[1060px] w-full mx-auto">
      <div className="flex flex-col items-center justify-center h-[500px] sm:h-[480px] gap-2">
        <h1 className="text-[45px] font-bold text-center">
          The future of{' '}
          <span className="gradient-text text-transparent animate-gradient">
            distribution
          </span>
        </h1>

        <p className="max-w-[675px] w-full text-center text-[18px] leading-7 pb-10 md:pb-2 z-10">
          The Audience Economy facilitates the connection between artists and
          major digital platforms, offering global distribution and specialized
          support.
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
              Label? Explore All the Benefits for Your Artists
            </h3>
            <p className="text-[15px]">
              Bringing your catalog to the Audience Economy offers countless
              benefits. Take advantage of our competitive commission,
              high-quality services, and deep understanding of the digital
              market to expand your reach globally. Our platform ensures better
              earnings, faster approvals, and dedicated support to make sure
              your artists have everything they need at every stage. Click on
              &quot;Join Us&quot; and discover everything the Audience Economy
              can do to take your artists to the next level.
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
            Distribute Globally
          </h2>
          <h3 className="text-beige text-2xl font-madefor-display font-bold mb-4">
            We deliver your content to more than 75 stores worldwide
          </h3>
          <p className="text-[15px] leading-7">
            The Audience Economy partners with the leading music distribution
            platforms around the world, including Spotify, YouTube, Deezer, and
            many others. We offer numerous advantages to maximize the visibility
            of your content. Our platform ensures a strong and efficient
            relationship with all stores, allowing fast and reliable deliveries.
            With the Audience Economy, you&apos;ll enjoy a superior experience,
            dedicated support, and access to a vast global network.
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
            Stay Updated
          </h2>
          <h3 className="text-purple text-2xl font-madefor-display font-bold mb-4">
            Simple and Intuitive Dashboard
          </h3>
          <p className="text-[15px] leading-7">
            The Audience Economy was developed to simplify and focus on what
            truly matters for our clients. Every step, from uploading your first
            track to distribution in stores, comes with interactive and
            real-time tutorials. We don&apos;t display unnecessary or cluttered
            information on your dashboard, always ensuring 24/7 uptime. We
            provide update alerts and partnership programs available on our
            Marketplace, accessible directly from your dashboard.
          </p>
        </div>
      </section>

      <section className="w-full flex flex-col lgp:flex-row items-center justify-center lgp:justify-between gap-12 lgp:gap-20 py-[120px]">
        <div className="flex flex-col gap-3 lgp:max-w-[480px] w-full">
          <h2 className="text-white text-[28px] font-madefor-display font-bold">
            Turn 15 Days Into 1
          </h2>
          <h3 className="text-blue text-2xl font-madefor-display font-bold mb-4">
            We Value Efficiency
          </h3>
          <p className="text-[15px] leading-7 mb-5">
            Say goodbye to the standard distribution process. With the Audience
            Economy, you can license your content in just a few hours without
            worrying about the long approval times other distributors require.
            License your content and see it available in selected stores the
            same day.
          </p>

          <div className="w-full flex items-center gap-10 sm:gap-28">
            <div className="flex flex-col gap-2 text-white font-madefor-display font-bold text-2xl">
              <div className="flex items-center justify-start text-[38px]">
                <p className="">
                  <span className="">150</span>
                </p>
                <span>+</span>
              </div>
              <p>Countries</p>
            </div>

            <div className="flex flex-col gap-2 text-white font-madefor-display font-bold text-2xl">
              <div className="flex items-center justify-start text-[38px]">
                <p className="">
                  <span className="">2</span>
                </p>
                <span>B+</span>
              </div>
              <p>Streams</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center flex-grow w-full lgp:justify-between gap-8 lgp:gap-0 flex-wrap lgp:w-auto">
          <div className="max-w-[240px] w-full border border-[#333] rounded-xl text-[13px] p-3">
            <div className="flex items-center justify-between mb-3">
              <p>Standard Distribution</p>
              <span>10 days</span>
            </div>
            Other Distributors
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
                  <DistributionCards name="Approval" />
                  <span>3 days</span>

                  <DistributionCards name="Upload" />
                  <span>7 days</span>

                  <DistributionCards name="Available in Stores" />
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-[240px] w-full border border-[#333] rounded-xl text-[13px] p-3">
            <div className="flex items-center justify-between mb-3">
              <p>Future of Distribution</p>
              <span>1 day</span>
            </div>
            Audience Economy
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
                  <DistributionCards name="Approval" />
                  <span>120 minutes</span>

                  <DistributionCards name="Upload" />
                  <span>1 day</span>

                  <DistributionCards name="Available in Stores*" />
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
