"use client";

/**
 * BrandBackground Component
 * 
 * Elegant background effect for dark sections with vertical gradient slits
 * and subtle circular accents following Collab brand guidelines.
 * 
 * Usage:
 * <div className="relative overflow-hidden">
 *   <BrandBackground />
 *   <div className="relative z-10">{content}</div>
 * </div>
 */

interface BrandBackgroundProps {
  variant?: 'default' | 'warm' | 'cool';
  intensity?: 'subtle' | 'medium' | 'strong';
}

export function BrandBackground({ 
  variant = 'default',
  intensity = 'medium' 
}: BrandBackgroundProps) {
  // Opacity matching reference (opacity-30 = 0.3)
  const opacityValues = {
    subtle: 0.2,
    medium: 0.3,
    strong: 0.4,
  };

  // Gradient definitions matching reference exactly: from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30]
  const slitGradients = {
    default:
      'linear-gradient(150deg, #ffffff00 0%, #000000 59%, #ffffff30 100%)',
    warm:
      'linear-gradient(150deg, #ffffff00 0%, #ffffff30 59%, #ff7316 100%)',
    cool:
      'linear-gradient(150deg, #ffffff00 0%, #ffffff30 59%, #a1a1aa 100%)',
  };

  const currentOpacity = opacityValues[intensity];

  return (
    <>
      {/* Base gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            variant === 'warm'
              ? 'linear-gradient(135deg, #201813 0%, #050505 100%)'
              : variant === 'cool'
                ? 'linear-gradient(135deg, #1a1b20 0%, #050505 100%)'
                : 'linear-gradient(135deg, #1f1f1f 0%, #050505 100%)',
        }}
      />

      {/* Soft overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.35) 50%, rgba(255,255,255,0.06) 100%)',
          opacity: 0.25,
        }}
      />

      {/* Vertical Gradient Slits */}
      <div className="absolute inset-0 flex overflow-hidden pointer-events-none backdrop-blur-2xl">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-full w-16"
            style={{
              background: slitGradients[variant],
              opacity: currentOpacity,
            }}
          />
        ))}
      </div>

      {/* Circular Accents - Bottom */}
      {/* <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden h-96">
        <div
          className="absolute inset-x-0 -bottom-40 h-72"
          style={{
            background:
              variant === 'warm'
                ? 'radial-gradient(circle at 20% 80%, rgba(249,115,22,0.7), rgba(14,10,8,0))'
                : variant === 'cool'
                  ? 'radial-gradient(circle at 30% 80%, rgba(161,161,170,0.45), rgba(15,15,16,0))'
                  : 'radial-gradient(circle at 30% 80%, rgba(255,255,255,0.25), rgba(24,24,27,0))',
          }}
        />
        <div 
          className={`
            absolute -bottom-32 -left-32
            w-80 h-80 
            ${blobColors[variant][0]}
            rounded-full 
            blur-3xl
          `}
        />
        <div 
          className={`
            absolute -bottom-24 left-1/4
            w-56 h-56 
            ${blobColors[variant][1]}
            rounded-full 
            blur-3xl
          `}
        />
        <div 
          className={`
            absolute -bottom-20 left-1/2
            w-40 h-40 
            ${blobColors[variant][2]}
            rounded-full 
            blur-2xl
          `}
        />
      </div> */}

      {/* Bottom band */}
      {/* <div
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
        style={{
          background:
            variant === 'warm'
              ? 'linear-gradient(0deg, rgba(249,115,22,0.85) 0%, rgba(5,5,5,0) 90%)'
              : variant === 'cool'
                ? 'linear-gradient(0deg, rgba(161,161,170,0.5) 0%, rgba(5,5,5,0) 90%)'
                : 'linear-gradient(0deg, rgba(255,255,255,0.35) 0%, rgba(5,5,5,0) 90%)',
        }}
      /> */}

      {/* Top Glow Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>
    </>
  );
}

