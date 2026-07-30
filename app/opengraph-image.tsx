import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const imageBuffer = readFileSync(join(process.cwd(), 'public', 'santorini-og-frame.jpg'));
  const backgroundImage = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundColor: '#082534',
        }}
      >
        <img
          src={backgroundImage}
          width={size.width}
          height={size.height}
          style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            left: 60,
            bottom: 60,
            padding: '36px 48px 44px',
            borderLeft: '4px solid #8A5233',
            backgroundColor: 'rgba(8,37,52,0.88)',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 5,
              color: '#DED5BD',
              opacity: 0.75,
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            20 Years — 2007 to 2027
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: 2,
              color: '#DED5BD',
              textTransform: 'uppercase',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }}
          >
            Join us in Santorini
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
