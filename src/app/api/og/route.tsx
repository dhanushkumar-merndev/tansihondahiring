import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div
          style={{
            padding: '40px',
            background: '#fff',
            borderRadius: '32px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://tansimotors.netlify.app/Tansi.png"
            width={180}
            height={180}
            alt="logo"
            style={{ objectFit: 'contain' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <p style={{ fontSize: 52, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>
            Tansi Honda
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#ef4444', margin: 0, letterSpacing: '4px', textTransform: 'uppercase' }}>
            Hiring Dashboard
          </p>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}