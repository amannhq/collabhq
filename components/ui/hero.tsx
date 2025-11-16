"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Mockup, MockupFrame } from "@/components/ui/mockup"

interface HeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  subtitle?: string
  eyebrow?: string
  ctaText?: string
  ctaLink?: string
  mockupImage?: {
    src: string
    alt: string
    width: number
    height: number
  }
}

const Hero = React.forwardRef<HTMLDivElement, HeroProps>(
  ({ className, title, subtitle, eyebrow, ctaText, ctaLink, mockupImage, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center bg-[#f3f1ea] pb-0 w-full", className)}
        {...props}
      >
        <div className="w-full max-w-[1400px] mx-auto flex flex-col items-center">
          {eyebrow && (
            <p 
              className="font-sans uppercase tracking-[0.3em] leading-[133%] text-center text-[13px] sm:text-[15px] mt-12 sm:mt-16 md:mt-20 lg:mt-24 mb-4 sm:mb-6 text-[#000000]/70 animate-appear opacity-0 font-medium"
            >
              {eyebrow}
            </p>
          )}

          <h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight sm:leading-[1.15] text-center px-4 sm:px-8 lg:px-16 text-[#000000] animate-appear opacity-0 delay-100 max-w-5xl mx-auto"
          >
            {title}
          </h1>

          {subtitle && (
            <p 
              className="text-base sm:text-lg md:text-xl lg:text-[22px] text-center font-sans font-normal px-4 sm:px-8 lg:px-16 mt-4 sm:mt-5 mb-8 sm:mb-10 leading-relaxed text-[#000000]/80 animate-appear opacity-0 delay-300 max-w-3xl mx-auto"
            >
              {subtitle}
            </p>
          )}

          {ctaText && ctaLink && (
            <Link href={ctaLink} className="animate-appear opacity-0 delay-500">
              <div 
                className="inline-flex items-center bg-[#000000] text-[#ffffff] rounded-xl hover:bg-[#000000]/90 transition-all hover:scale-105 font-sans px-6 py-3.5 shadow-lg shadow-black/10"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-base sm:text-[17px] font-medium whitespace-nowrap">{ctaText}</span>
                  <svg 
                    width="28" 
                    height="12" 
                    viewBox="0 0 36 15" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-7 h-3"
                  >
                    <path 
                      d="M35.7071 8.20711C36.0976 7.81658 36.0976 7.18342 35.7071 6.79289L29.3431 0.428932C28.9526 0.0384078 28.3195 0.0384078 27.9289 0.428932C27.5384 0.819457 27.5384 1.45262 27.9289 1.84315L33.5858 7.5L27.9289 13.1569C27.5384 13.5474 27.5384 14.1805 27.9289 14.5711C28.3195 14.9616 28.9526 14.9616 29.3431 14.5711L35.7071 8.20711ZM0 8.5H35V6.5H0V8.5Z" 
                      fill="white"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          )}
        </div>

        {mockupImage && (
          <div className="mt-12 sm:mt-16 w-full relative animate-appear opacity-0 delay-700">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
              <MockupFrame size="large" className="w-full">
                <Mockup type="responsive" className="w-full">
                  <Image
                    src={mockupImage.src}
                    alt={mockupImage.alt}
                    width={mockupImage.width}
                    height={mockupImage.height}
                    className="w-full h-auto rounded-lg object-contain"
                    priority
                  />
                </Mockup>
              </MockupFrame>
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 w-full h-[200px] sm:h-[250px] md:h-[303px] pointer-events-none"
              style={{
                background: "linear-gradient(to top, #f3f1ea 0%, rgba(243, 241, 234, 0.8) 50%, rgba(243, 241, 234, 0) 100%)",
                zIndex: 10,
              }}
            />
          </div>
        )}
      </div>
    )
  }
)
Hero.displayName = "Hero"

export { Hero }
