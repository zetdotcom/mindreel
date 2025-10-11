// Entry normalization and prompt building utilities for MindReel Edge Functions

import type { Entry, NormalizedEntry, PromptData, SupportedLanguage } from './types.ts';

/**
 * Normalizes and deduplicates entries for AI processing
 */
export function normalizeEntries(
  entries: Entry[],
  truncationLimit: number = 500
): NormalizedEntry[] {
  // Sort entries chronologically
  const sortedEntries = entries
    .map(entry => ({
      timestamp: new Date(entry.timestamp),
      text: entry.text.trim(),
      truncated: false
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const normalized: NormalizedEntry[] = [];
  let lastText = '';
  let consecutiveCount = 1;

  for (const entry of sortedEntries) {
    let processedText = entry.text;
    let truncated = false;

    // Apply truncation if needed
    if (processedText.length > truncationLimit) {
      processedText = processedText.substring(0, truncationLimit) + '… [truncated]';
      truncated = true;
    }

    // Handle consecutive identical entries
    if (processedText === lastText && normalized.length > 0) {
      consecutiveCount++;
      // Update the last entry with count notation
      const lastEntry = normalized[normalized.length - 1];
      const baseText = lastEntry.text.replace(/ \(x\d+\)$/, '');
      lastEntry.text = `${baseText} (x${consecutiveCount})`;
    } else {
      // Different text, add as new entry
      normalized.push({
        timestamp: entry.timestamp,
        text: processedText,
        truncated
      });
      lastText = processedText;
      consecutiveCount = 1;
    }
  }

  return normalized;
}

/**
 * Detects language based on Polish diacritics frequency
 */
export function detectLanguage(entries: NormalizedEntry[]): SupportedLanguage {
  const allText = entries.map(e => e.text).join(' ').toLowerCase();

  // Polish diacritics: ą ć ę ł ń ó ś ź ż
  const polishDiacritics = /[ąćęłńóśźż]/g;
  const diacriticMatches = allText.match(polishDiacritics) || [];
  const totalLetters = allText.match(/[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g)?.length || 0;

  if (totalLetters === 0) return 'en'; // Default to English if no letters

  const diacriticRatio = diacriticMatches.length / totalLetters;

  // If more than 3% of letters are Polish diacritics, assume Polish
  return diacriticRatio > 0.03 ? 'pl' : 'en';
}

/**
 * Truncates entries to fit within character limit while preserving chronological spread
 */
export function truncateToLimit(
  entries: NormalizedEntry[],
  maxChars: number
): { entries: NormalizedEntry[], omittedCount: number } {
  const totalText = entries.map(e => e.text).join('\n');

  if (totalText.length <= maxChars) {
    return { entries, omittedCount: 0 };
  }

  const budget = maxChars - 50; // Reserve space for omission marker
  const halfBudget = Math.floor(budget / 2);

  // Keep earliest entries up to ~50% of budget
  const earliestEntries: NormalizedEntry[] = [];
  let earliestChars = 0;

  for (const entry of entries) {
    const entryLength = entry.text.length + 1; // +1 for newline
    if (earliestChars + entryLength <= halfBudget) {
      earliestEntries.push(entry);
      earliestChars += entryLength;
    } else {
      break;
    }
  }

  // Keep latest entries up to remaining budget
  const latestEntries: NormalizedEntry[] = [];
  let latestChars = 0;
  const remainingBudget = budget - earliestChars;

  for (let i = entries.length - 1; i >= earliestEntries.length; i--) {
    const entry = entries[i];
    const entryLength = entry.text.length + 1; // +1 for newline
    if (latestChars + entryLength <= remainingBudget) {
      latestEntries.unshift(entry);
      latestChars += entryLength;
    } else {
      break;
    }
  }

  const omittedCount = entries.length - earliestEntries.length - latestEntries.length;

  if (omittedCount > 0) {
    // Add omission marker between earliest and latest
    const omissionMarker: NormalizedEntry = {
      timestamp: new Date(),
      text: `[... ${omittedCount} entries omitted for length]`,
      truncated: false
    };

    return {
      entries: [...earliestEntries, omissionMarker, ...latestEntries],
      omittedCount
    };
  }

  return {
    entries: [...earliestEntries, ...latestEntries],
    omittedCount: 0
  };
}

/**
 * Builds system prompt based on language
 */
export function buildSystemPrompt(language: SupportedLanguage): string {
  if (language === 'pl') {
    return `Jesteś asystentem AI specjalizującym się w tworzeniu streszczeń działań zawodowych. Twoim zadaniem jest przeanalizowanie listy aktywności z danego tygodnia i utworzenie zwięzłego, wartościowego streszczenia w języku polskim.

Wymagania:
- Grupuj podobne aktywności razem
- Używaj formatowania z wypunktowaniem (rozpoczynaj każdą linię od "- ")
- Skup się na konkretnych osiągnięciach i wynikach
- Utrzymuj profesjonalny ton
- Maksymalnie 8-10 punktów
- Unikaj powtarzania szczegółów

Przykład formatu:
- Ukończono refaktoryzację modułu uwierzytelniania
- Naprawiono 3 krytyczne błędy w systemie płatności
- Przeprowadzono spotkania zespołu w sprawie nowych funkcji`;
  }

  return `You are an AI assistant specialized in creating professional work activity summaries. Your task is to analyze a list of activities from a given week and create a concise, valuable summary in English.

Requirements:
- Group similar activities together
- Use bullet point formatting (start each line with "- ")
- Focus on concrete achievements and outcomes
- Maintain professional tone
- Maximum 8-10 bullet points
- Avoid repeating details

Example format:
- Completed authentication module refactoring
- Fixed 3 critical payment system bugs
- Conducted team meetings regarding new features`;
}

/**
 * Builds user content from normalized entries
 */
export function buildUserContent(entries: NormalizedEntry[]): string {
  return entries
    .map(entry => {
      const timestamp = entry.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
      const time = entry.timestamp.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
      return `[${timestamp} ${time}] ${entry.text}`;
    })
    .join('\n');
}

/**
 * Main function to build complete prompt data
 */
export function buildPromptData(
  entries: Entry[],
  language: SupportedLanguage | undefined,
  maxPromptChars: number,
  truncationLimit: number
): PromptData {
  // Normalize entries
  const normalized = normalizeEntries(entries, truncationLimit);

  // Detect language if not provided
  const finalLanguage = language || detectLanguage(normalized);

  // Build system prompt
  const systemPrompt = buildSystemPrompt(finalLanguage);

  // Truncate entries to fit within character limit
  const { entries: truncatedEntries, omittedCount } = truncateToLimit(
    normalized,
    maxPromptChars - systemPrompt.length - 100 // Reserve space for system prompt + buffer
  );

  // Build user content
  const userContent = buildUserContent(truncatedEntries);

  const totalChars = systemPrompt.length + userContent.length;

  console.log(`Prompt built - Language: ${finalLanguage}, Entries: ${truncatedEntries.length}, Omitted: ${omittedCount}, Total chars: ${totalChars}`);

  return {
    system: systemPrompt,
    user: userContent,
    language: finalLanguage,
    entryCount: truncatedEntries.length,
    totalChars
  };
}

/**
 * Formats AI response to ensure proper bullet point format
 */
export function formatSummary(rawSummary: string, language: SupportedLanguage): string {
  const lines = rawSummary
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const formatted = lines.map(line => {
    // If line doesn't start with "- ", add it
    if (!line.startsWith('- ')) {
      return `- ${line}`;
    }
    return line;
  });

  return formatted.join('\n');
}
