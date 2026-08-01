import { dirtyline } from '@/lib/dirtyline-font';

const SIGNATURE = 'Steve, Andi & Nicolas';

export function isSignatureParagraph(paragraph: string): boolean {
  return paragraph.includes(SIGNATURE);
}

interface SignatureLineProps {
  paragraph: string;
}

export default function SignatureLine({ paragraph }: SignatureLineProps) {
  const index = paragraph.indexOf(SIGNATURE);
  const before = paragraph.slice(0, index).replace(/\s+$/, '');
  const after = paragraph.slice(index + SIGNATURE.length);

  return (
    <p className="mt-4 text-[clamp(14px,3.5vw,18px)] text-cream first:mt-0">
      {before && <span className="text-[16px]">{before}</span>}
      {before && <br />}
      <span className={dirtyline.className}>S</span>teve,{' '}
      <span className={dirtyline.className}>A</span>ndi &{' '}
      <span className={dirtyline.className}>N</span>icolas
      {after}
    </p>
  );
}
