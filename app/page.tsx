'use client';
import { useState } from 'react';
import Hero from '@/components/Hero';
import OpeningModule from '@/components/modules/OpeningModule';
import HotelModule from '@/components/modules/HotelModule';
import DateWindowsModule from '@/components/modules/DateWindowsModule';
import TravelTimingModule from '@/components/modules/TravelTimingModule';
import DinnerCruiseModule from '@/components/modules/DinnerCruiseModule';
import ClosingModule from '@/components/modules/ClosingModule';
import { getNextModule } from '@/lib/flow';
import { EMPTY_DRAFT } from '@/lib/types';
import type { DraftResponse, ModuleId } from '@/lib/types';

export default function Home() {
  const [moduleId, setModuleId] = useState<ModuleId>('opening');
  const [draft, setDraft] = useState<DraftResponse>(EMPTY_DRAFT);

  function advance(updated: DraftResponse) {
    setDraft(updated);
    setModuleId(getNextModule(moduleId, updated));
  }

  return (
    <main>
      <Hero />
      {moduleId === 'opening' && <OpeningModule draft={draft} onAdvance={advance} />}
      {moduleId === 'hotel' && <HotelModule draft={draft} onAdvance={advance} />}
      {moduleId === 'dateWindows' && <DateWindowsModule draft={draft} onAdvance={advance} />}
      {moduleId === 'travelTiming' && <TravelTimingModule draft={draft} onAdvance={advance} />}
      {moduleId === 'dinnerCruise' && <DinnerCruiseModule draft={draft} onAdvance={advance} />}
      {moduleId === 'closing' && <ClosingModule draft={draft} />}
    </main>
  );
}
