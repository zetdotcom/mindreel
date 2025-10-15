import { useState, useCallback } from "react";
import { IsoWeekIdentifier, SummaryCardState } from "./types";
import { historyRepository } from "./repository";
import type { Summary } from "../../../sqlite/types";

/**
 * Hook for managing summary operations including AI generation
 * Provides functions for generating, updating summaries and managing auth state
 */
export function useSummaryOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingWeeks, setGeneratingWeeks] = useState<Set<string>>(new Set());

  /**
   * Generate AI summary for a specific week
   */
  const generateSummary = useCallback(async (
    weekIdentifier: IsoWeekIdentifier
  ): Promise<Summary | null> => {
    const weekKey = `${weekIdentifier.iso_year}-W${weekIdentifier.week_of_year.toString().padStart(2, '0')}`;

    try {
      setLoading(true);
      setError(null);
      setGeneratingWeeks(prev => new Set([...prev, weekKey]));

      // Check if summary already exists
      const existingSummary = await historyRepository.summaryExistsForWeek(weekIdentifier);
      if (existingSummary) {
        throw new Error("Summary already exists for this week");
      }

      // Get entries for the week
      const entries = await window.appApi.db.getEntriesForIsoWeek(
        weekIdentifier.iso_year,
        weekIdentifier.week_of_year
      );

      if (!entries || entries.length === 0) {
        throw new Error("No entries found for this week");
      }

      // TODO: Integrate with AI service
      // For now, create a basic summary
      const entryTexts = entries.map(entry => entry.content);
      const combinedText = entryTexts.join('\n\n');

      // Placeholder AI summary generation
      const aiSummary = await generateAISummary(combinedText, weekIdentifier);

      // Save the summary
      const { start_date, end_date } = await window.appApi.db.getCurrentWeekInfo();
      const summaryData = {
        content: aiSummary,
        start_date,
        end_date,
        week_of_year: weekIdentifier.week_of_year,
        iso_year: weekIdentifier.iso_year,
      };

      const newSummary = await window.appApi.db.createSummary(summaryData);
      return newSummary;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate summary";
      setError(errorMessage);
      console.error("Error generating summary:", err);
      return null;
    } finally {
      setLoading(false);
      setGeneratingWeeks(prev => {
        const newSet = new Set(prev);
        newSet.delete(weekKey);
        return newSet;
      });
    }
  }, []);

  /**
   * Update an existing summary
   */
  const updateSummary = useCallback(async (
    summaryId: number,
    content: string
  ): Promise<Summary | null> => {
    try {
      setLoading(true);
      setError(null);

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        throw new Error("Summary content cannot be empty");
      }

      const updatedSummary = await historyRepository.updateSummary(summaryId, trimmedContent);

      if (!updatedSummary) {
        throw new Error("Summary not found or could not be updated");
      }

      return updatedSummary;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update summary";
      setError(errorMessage);
      console.error("Error updating summary:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check if a week is currently generating a summary
   */
  const isGenerating = useCallback((weekIdentifier: IsoWeekIdentifier): boolean => {
    const weekKey = `${weekIdentifier.iso_year}-W${weekIdentifier.week_of_year.toString().padStart(2, '0')}`;
    return generatingWeeks.has(weekKey);
  }, [generatingWeeks]);

  /**
   * Get summary state for a week
   */
  const getSummaryState = useCallback((
    summary: Summary | undefined,
    weekIdentifier: IsoWeekIdentifier,
    totalEntries: number,
    isAuthenticated: boolean = true,
    hasQuota: boolean = true
  ): SummaryCardState => {
    if (isGenerating(weekIdentifier)) {
      return 'generating';
    }

    if (summary) {
      return 'success';
    }

    if (!isAuthenticated) {
      return 'unauthorized';
    }

    if (!hasQuota) {
      return 'limitReached';
    }

    if (totalEntries === 0) {
      return 'pending';
    }

    return 'pending';
  }, [isGenerating]);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    generatingWeeks: Array.from(generatingWeeks),
    generateSummary,
    updateSummary,
    isGenerating,
    getSummaryState,
    clearError,
  };
}

/**
 * Placeholder AI summary generation function
 * TODO: Replace with actual AI service integration
 */
async function generateAISummary(
  combinedText: string,
  weekIdentifier: IsoWeekIdentifier
): Promise<string> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Basic text processing for placeholder summary
  const lines = combinedText.split('\n').filter(line => line.trim());
  const totalLines = lines.length;

  const summary = `Week ${weekIdentifier.week_of_year} Summary (${weekIdentifier.iso_year})

This week you recorded ${totalLines} work entries covering various activities and achievements.

Key highlights:
• Maintained consistent daily logging
• Covered diverse work activities
• Total content length: ${combinedText.length} characters

Areas of focus this week appear to include project work, meetings, and development tasks.

Note: This is a placeholder summary. Actual AI-powered summaries will provide more detailed insights about your work patterns, accomplishments, and focus areas.`;

  return summary;
}
