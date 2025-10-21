// Entry normalization and prompt building utilities for MindReel Edge Functions

import type {
  Entry,
  NormalizedEntry,
  PromptData,
  SupportedLanguage,
} from "./types.ts";

/**
 * Normalizes and deduplicates entries for AI processing
 */
export function normalizeEntries(
  entries: Entry[],
  truncationLimit: number = 500,
): NormalizedEntry[] {
  // Sort entries chronologically
  const sortedEntries = entries
    .map((entry) => ({
      timestamp: new Date(entry.timestamp),
      text: entry.text.trim(),
      truncated: false,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const normalized: NormalizedEntry[] = [];
  let lastText = "";
  let consecutiveCount = 1;

  for (const entry of sortedEntries) {
    let processedText = entry.text;
    let truncated = false;

    // Apply truncation if needed
    if (processedText.length > truncationLimit) {
      processedText =
        processedText.substring(0, truncationLimit) + "… [truncated]";
      truncated = true;
    }

    // Handle consecutive identical entries
    if (processedText === lastText && normalized.length > 0) {
      consecutiveCount++;
      // Update the last entry with count notation
      const lastEntry = normalized[normalized.length - 1];
      const baseText = lastEntry.text.replace(/ \(x\d+\)$/, "");
      lastEntry.text = `${baseText} (x${consecutiveCount})`;
    } else {
      // Different text, add as new entry
      normalized.push({
        timestamp: entry.timestamp,
        text: processedText,
        truncated,
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
  const allText = entries
    .map((e) => e.text)
    .join(" ")
    .toLowerCase();

  // Polish diacritics: ą ć ę ł ń ó ś ź ż
  const polishDiacritics = /[ąćęłńóśźż]/g;
  const diacriticMatches = allText.match(polishDiacritics) || [];
  const totalLetters =
    allText.match(/[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g)?.length || 0;

  if (totalLetters === 0) return "en"; // Default to English if no letters

  const diacriticRatio = diacriticMatches.length / totalLetters;

  // If more than 3% of letters are Polish diacritics, assume Polish
  return diacriticRatio > 0.03 ? "pl" : "en";
}

/**
 * Truncates entries to fit within character limit while preserving chronological spread
 */
export function truncateToLimit(
  entries: NormalizedEntry[],
  maxChars: number,
): { entries: NormalizedEntry[]; omittedCount: number } {
  const totalText = entries.map((e) => e.text).join("\n");

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

  const omittedCount =
    entries.length - earliestEntries.length - latestEntries.length;

  if (omittedCount > 0) {
    // Add omission marker between earliest and latest
    const omissionMarker: NormalizedEntry = {
      timestamp: new Date(),
      text: `[... ${omittedCount} entries omitted for length]`,
      truncated: false,
    };

    return {
      entries: [...earliestEntries, omissionMarker, ...latestEntries],
      omittedCount,
    };
  }

  return {
    entries: [...earliestEntries, ...latestEntries],
    omittedCount: 0,
  };
}

/**
 * Builds system prompt based on language
 */
export function buildSystemPrompt(language: SupportedLanguage): string {
  if (language === "pl") {
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

  return `You are an AI assistant that produces a professional weekly activity summary from a raw list of user-entered tasks.

  Primary Objective:
  Return a concise, professional summary strictly grounded in the provided entries. Do NOT invent, infer, or speculate beyond what is literally written.

  Input Characteristics:
  - Raw task lines may repeat.
  - Some tasks contain project tags (#mindreel, #aw-web, etc.).
  - Some entries may be fragments, informal, or partially duplicated.

  Output Format (hard requirement):
  For each project tag found, output a section:
  #project-tag
  - bullet 1
  - bullet 2

  If tasks have NO project tag, group them under:
  #unspecified

  Formatting Rules:
  - Each task bullet starts with "- ".
  - Preserve original meaning. Professional phrasing is allowed ONLY if it does not add unstated outcomes, reasons, benefits, impacts, performance claims, or quantities.
  - Maximum 8–10 bullets per project if very long; otherwise include all (unless duplicates).
  - Combine identical or near-identical repetitions using “(xN)” notation: e.g., “testing” repeated 4 times => “testing (x4)”.
  - Keep wording close to original; light normalization is OK (capitalization, consistent tense, removing filler like “need to” if it doesn’t change meaning).
  - Do NOT merge semantically distinct tasks into a single bullet.
  - Do NOT add context, interpretations, or inferred goals.

  Allowed Transformations (must not change factual scope):
  1. Replace bare nouns with a neutral professional verb if the noun clearly implies an action (e.g., "testing" -> "Conducted testing").
  2. Normalize tense (“adding sidebar” -> “Added sidebar”).
  3. Group duplicates with (xN).
  4. Trim obvious typos if they do not alter meaning; if unclear, keep original.
  5. Remove trailing ellipses or filler (“... need to solve this” -> “Investigating why useBalances does not re-render on context changes”).

  Forbidden Additions (even if they sound professional):
  - Purposes or benefits: “to enhance navigation”, “for better performance”, “for improved visual appeal”.
  - Outcome claims: “successfully”, “validated”, “ensured reliability” unless explicitly in the input.
  - Metrics or counts not present.
  - Severity levels (“critical”, “major”) unless explicitly stated.
  - Qualitative improvements (“significant”, “optimized”) unless stated.
  - Converting uncertainty to certainty (keep “not sure why...” tone if present; you may rephrase as “Investigating why...” but not as “Identified cause of...”)

  Algorithm (follow internally before producing output):
  1. Parse all lines; strip surrounding quotes and whitespace.
  2. Extract project tags (#word). A task with multiple tags appears under each relevant project.
  3. Canonicalize line: trim, collapse spaces.
  4. Aggregate identical (post-trim) tasks and count repetitions.
  5. For each unique task:
     a. Decide minimal professional restyle without adding new info.
     b. If the line expresses uncertainty (“not sure”, “need to solve”), retain investigative tone.
  6. Emit per-project sections in alphabetical order of tag. If only one project, just that section. If none, use #unspecified.
  7. Ensure bullets reflect only existing text content.

  Examples:

  Raw Tasks:
  - testing
  - testing
  - updating coloris in mindreel
  - adding sidebar and router
  - checking Kevin's response on balanceCoordinators
  - checking useBalancesDAT and coordinator
  - not sure why useBalances not rerender when contexts are changin... need to solve this

  Correct Output:
  #mindreel
  - testing (x2)
  - updating coloris
  - adding sidebar and router
  - checking Kevin's response on balanceCoordinators
  - checking useBalancesDAT and coordinator
  - investigating why useBalances not re-render when contexts are changing

  Incorrect Output (DO NOT DO):
  #mindreel
  - Conducted multiple tests to ensure system functionality and performance   (adds purpose)
  - Implemented sidebar and router features to enhance user navigation        (adds benefit)
  - Updated color scheme for improved visual appeal                          (adds reason)
  - Investigated and resolved useBalances re-render issue                    (claims resolution)

  If a task is a fragment and unclear, preserve it rather than guessing.

  Final Reminder:
  Never fabricate, extrapolate, or infer outcomes. Stay strictly within the semantic content provided.
  Produce ONLY the formatted summary, no explanatory preamble.`;
}

/**
 * Builds user content from normalized entries
 */
export function buildUserContent(entries: NormalizedEntry[]): string {
  return entries
    .map((entry) => {
      const timestamp = entry.timestamp.toISOString().split("T")[0]; // YYYY-MM-DD
      const time = entry.timestamp.toISOString().split("T")[1].split(".")[0]; // HH:MM:SS
      return `[${timestamp} ${time}] ${entry.text}`;
    })
    .join("\n");
}

/**
 * Main function to build complete prompt data
 */
export function buildPromptData(
  entries: Entry[],
  language: SupportedLanguage | undefined,
  maxPromptChars: number,
  truncationLimit: number,
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
    maxPromptChars - systemPrompt.length - 100, // Reserve space for system prompt + buffer
  );

  // Build user content
  const userContent = buildUserContent(truncatedEntries);

  const totalChars = systemPrompt.length + userContent.length;

  console.log(
    `Prompt built - Language: ${finalLanguage}, Entries: ${truncatedEntries.length}, Omitted: ${omittedCount}, Total chars: ${totalChars}`,
  );

  return {
    system: systemPrompt,
    user: userContent,
    language: finalLanguage,
    entryCount: truncatedEntries.length,
    totalChars,
  };
}

/**
 * Formats AI response to ensure proper bullet point format
 */
export function formatSummary(
  rawSummary: string,
  language: SupportedLanguage,
): string {
  const lines = rawSummary
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const formatted = lines.map((line) => {
    // If line doesn't start with "- ", add it
    if (!line.startsWith("- ")) {
      return `- ${line}`;
    }
    return line;
  });

  return formatted.join("\n");
}
