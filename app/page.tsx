import Wizard from '@/components/Wizard';
import { getSiteContent } from '@/lib/site-content';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const content = await getSiteContent();
  return <Wizard content={content} />;
}
