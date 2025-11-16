import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';
export const alt = 'Collab - Creator Management Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 72,
          background: '#f3f1ea',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            opacity: 0.05,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              background: 'repeating-linear-gradient(45deg, #000 0px, #000 2px, transparent 2px, transparent 10px)',
            }}
          />
        </div>

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: '#000',
              marginBottom: 24,
              letterSpacing: '-0.02em',
              display: 'flex',
            }}
          >
            Collab
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 36,
              color: '#52525b',
              textAlign: 'center',
              maxWidth: 900,
              lineHeight: 1.4,
              display: 'flex',
            }}
          >
            Creator Management Platform
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 24,
              color: '#71717a',
              marginTop: 16,
              display: 'flex',
            }}
          >
            Track · Manage · Collaborate
          </div>
        </div>

        {/* Bottom badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 40,
            display: 'flex',
            alignItems: 'center',
            padding: '12px 24px',
            background: '#000',
            color: '#fff',
            fontSize: 20,
            borderRadius: 12,
          }}
        >
          Multi-Tenant SaaS
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
