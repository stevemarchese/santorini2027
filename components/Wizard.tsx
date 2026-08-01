'use client';
import { useState } from 'react';
import Hero from '@/components/Hero';
import AboutIcon from '@/components/AboutIcon';
import WeatherWidget from '@/components/WeatherWidget';
import SplashModule from '@/components/modules/SplashModule';
import LetterModule from '@/components/modules/LetterModule';
import OpeningModule from '@/components/modules/OpeningModule';
import HotelModule from '@/components/modules/HotelModule';
import DateWindowsModule from '@/components/modules/DateWindowsModule';
import TravelTimingModule from '@/components/modules/TravelTimingModule';
import DinnerCruiseModule from '@/components/modules/DinnerCruiseModule';
import ClosingModule from '@/components/modules/ClosingModule';
import { getNextModule } from '@/lib/flow';
import { EMPTY_DRAFT } from '@/lib/types';
import type { DraftResponse, ModuleId } from '@/lib/types';
import { splitParagraphs, type SiteContent } from '@/lib/site-content';

interface WizardProps {
  content: SiteContent;
}

export default function Wizard({ content }: WizardProps) {
  const [moduleId, setModuleId] = useState<ModuleId>('splash');
  const [draft, setDraft] = useState<DraftResponse>(EMPTY_DRAFT);
  const [history, setHistory] = useState<ModuleId[]>([]);
  const [quizPassed, setQuizPassed] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const weatherOverlapsPanel = moduleId === 'splash' || moduleId === 'letter' || aboutOpen;

  const letterParagraphs = splitParagraphs(content.letter);

  function advance(updated: DraftResponse) {
    setDraft(updated);
    setHistory([...history, moduleId]);
    setModuleId(getNextModule(moduleId, updated));
  }

  function goBack() {
    if (history.length === 0) return;
    setModuleId(history[history.length - 1]);
    setHistory(history.slice(0, -1));
  }

  return (
    <main>
      <Hero />
      <AboutIcon
        visible={moduleId !== 'letter' && moduleId !== 'splash'}
        paragraphs={letterParagraphs}
        onOpenChange={setAboutOpen}
      />
      <WeatherWidget variant={weatherOverlapsPanel ? 'cream' : 'terracotta'} />
      {moduleId === 'splash' && <SplashModule draft={draft} onAdvance={advance} />}
      {moduleId === 'letter' && <LetterModule draft={draft} paragraphs={letterParagraphs} onAdvance={advance} />}
      {moduleId === 'opening' && (
        <OpeningModule
          draft={draft}
          onAdvance={advance}
          quizPassed={quizPassed}
          onQuizPassed={() => setQuizPassed(true)}
        />
      )}
      {moduleId === 'hotel' && <HotelModule draft={draft} onAdvance={advance} onBack={goBack} />}
      {moduleId === 'dateWindows' && <DateWindowsModule draft={draft} onAdvance={advance} onBack={goBack} />}
      {moduleId === 'travelTiming' && <TravelTimingModule draft={draft} onAdvance={advance} onBack={goBack} />}
      {moduleId === 'dinnerCruise' && <DinnerCruiseModule draft={draft} onAdvance={advance} onBack={goBack} />}
      {moduleId === 'closing' && (
        <ClosingModule
          draft={draft}
          onBack={goBack}
          confirmationAttending={content.confirmationAttending}
          confirmationNotAttending={content.confirmationNotAttending}
        />
      )}
    </main>
  );
}
