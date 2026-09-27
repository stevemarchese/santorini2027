import { getSupabaseAdminClient } from './supabase-admin';
import { LETTER_PARAGRAPHS } from './letter-content';

export interface SiteContent {
  letter: string;
  confirmationAttending: string;
  confirmationNotAttending: string;
  hotelBookingNote: string;
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  letter: LETTER_PARAGRAPHS.join('\n\n'),
  confirmationAttending:
    "You're on the list. Book the hotel when you can — the good rooms go. We'll send details as things firm up.",
  confirmationNotAttending:
    "Thanks for letting us know. We will miss you but totally understand this isn't an easy trip to make. It's 20 years of inflation. Greece is more expensive, we all have families. We'll see each other soon. Promise.",
  hotelBookingNote: "Book directly with the hotel and mention you're with Steve & Andi's group.",
};

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

export function mergeSiteContent(
  rows: { key: string; value: string }[],
  defaults: SiteContent
): SiteContent {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const pick = (key: string, fallback: string): string => {
    const value = byKey.get(key);
    return value != null && value.trim().length > 0 ? value : fallback;
  };
  return {
    letter: pick('letter', defaults.letter),
    confirmationAttending: pick('confirmation_attending', defaults.confirmationAttending),
    confirmationNotAttending: pick('confirmation_not_attending', defaults.confirmationNotAttending),
    hotelBookingNote: pick('hotel_booking_note', defaults.hotelBookingNote),
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from('site_content').select('key, value');
    if (error || !data) return DEFAULT_SITE_CONTENT;
    return mergeSiteContent(data, DEFAULT_SITE_CONTENT);
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}
