import { GeistSans } from 'geist/font/sans';
import localFont from 'next/font/local';

export { GeistSans };

export const dirtyline = localFont({
  src: '../app/fonts/dirtyline.woff2',
  variable: '--font-dirtyline',
  display: 'swap',
});
