'use client'
import { FiArrowRight } from 'react-icons/fi'

export function CTAButton() {
  function handleClick() {
    const navBtn = document.querySelector('header button[title="Get Started"]') as HTMLButtonElement
    if (navBtn) navBtn.click()
  }

  return (
    <div className="button-wrapper">
      <button
        onClick={handleClick}
        className="w-[calc(100%-2px)] h-[calc(100%-2px)] absolute z-30 top-[1px] left-[1px] text-sm bg-black flex items-center justify-center gap-5 rounded-3xl focus:outline-none"
      >
        Get Started
        <FiArrowRight size={18} />
      </button>
    </div>
  )
}
