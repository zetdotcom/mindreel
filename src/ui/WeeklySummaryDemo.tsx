// Demo component showcasing MindReel Edge Function API client integration
// This component demonstrates all major features of the API client library

import React, { useState, useEffect } from "react";
import {
  EdgeFunctionClient,
  useWeeklySummary,
  useQuotaInfo,
  useWeekRange,
  getCurrentWeekRange,
  type Entry,
  type WeeklySummaryRequest,
  EdgeFunctionError,
} from "../lib/api";

// Mock Supabase configuration for demo
const mockClient = EdgeFunctionClient.createMock({
  timeout: 10000,
  retryAttempts: 2,
});

interface WeeklySummaryDemoProps {
  authToken?: string;
}

export default function WeeklySummaryDemo({
  authToken = "demo-token",
}: WeeklySummaryDemoProps) {
  const [entries, setEntries] = useState<Entry[]>([
    {
      timestamp: "2025-02-10T09:12:00.000Z",
      text: "Refactored authentication module to use new JWT library",
    },
    {
      timestamp: "2025-02-10T11:40:00.000Z",
      text: "Fixed Electron auto-update issue affecting Windows users",
    },
    {
      timestamp: "2025-02-11T14:30:00.000Z",
      text: "Added validation for email input fields in registration form",
    },
  ]);

  // Use separate hooks for different functionality
  const { loading, error, data, generateSummary, clearError, reset, quota } =
    useWeeklySummary({
      client: mockClient,
      authToken,
      onSuccess: (data) => {
        console.log("✅ Summary generated successfully!", data);
      },
      onError: (error) => {
        console.error("❌ Summary generation failed:", error);
      },
    });

  const { currentWeek, goToCurrentWeek, goToPreviousWeek } = useWeekRange();

  // Calculate quota-related values
  const isQuotaAvailable = quota ? quota.remaining > 0 : true;
  const isNearQuotaLimit = quota ? quota.remaining <= 1 : false;
  const daysUntilQuotaReset = quota
    ? Math.ceil((quota.cycleEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Simple validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const hasValidationErrors = validationErrors.length > 0;

  const addEntry = () => {
    const newEntry: Entry = {
      timestamp: new Date().toISOString(),
      text: "",
    };
    setEntries([...entries, newEntry]);
  };

  const updateEntry = (index: number, field: keyof Entry, value: string) => {
    const updatedEntries = entries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry,
    );
    setEntries(updatedEntries);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleGenerateSummary = async () => {
    if (entries.filter((e) => e.text.trim()).length === 0) {
      alert("Please add at least one entry with text");
      return;
    }

    const request: WeeklySummaryRequest = {
      week_start: currentWeek.startString,
      week_end: currentWeek.endString,
      entries: entries.filter((e) => e.text.trim()), // Remove empty entries
      language: "en",
      client_meta: {
        app_version: "1.0.0-demo",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: navigator.language,
      },
    };

    await generateSummary(request);
  };

  const getErrorMessage = (error: EdgeFunctionError) => {
    switch (error.reason) {
      case "auth_error":
        return "🔐 Authentication failed. Please check your login.";
      case "validation_error":
        return "📝 Request validation failed. Please check your entries.";
      case "quota_exceeded":
        return "🚫 Monthly summary limit reached. Quota resets in a few days.";
      case "provider_error":
        return "🤖 AI service temporarily unavailable. Please try again.";
      default:
        return "❌ An unexpected error occurred. Please try again.";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Weekly Summary Generator Demo
        </h1>
        <p className="text-gray-600">
          This demo showcases the MindReel Edge Function API client integration.
        </p>
      </div>

      {/* Week Selection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">📅 Week Selection</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">
            Week: {currentWeek.startString} to {currentWeek.endString}
          </span>
          <button
            onClick={goToPreviousWeek}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Previous Week
          </button>
          <button
            onClick={goToCurrentWeek}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            Current Week
          </button>
        </div>
      </div>

      {/* Quota Information */}
      {quota && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">📊 Quota Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm font-medium">Remaining:</span>
              <span
                className={`ml-2 font-bold ${quota.remaining > 2 ? "text-green-600" : quota.remaining > 0 ? "text-yellow-600" : "text-red-600"}`}
              >
                {quota.remaining}/{quota.limit}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Status:</span>
              <span
                className={`ml-2 font-bold ${isQuotaAvailable ? "text-green-600" : "text-red-600"}`}
              >
                {isQuotaAvailable ? "✅ Available" : "🚫 Exceeded"}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Resets in:</span>
              <span className="ml-2 font-bold text-blue-600">
                {daysUntilQuotaReset} days
              </span>
            </div>
          </div>
          {isNearQuotaLimit && (
            <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded text-sm">
              ⚠️ You're close to your quota limit!
            </div>
          )}
        </div>
      )}

      {/* Entries Management */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">📝 Weekly Entries</h2>
          <button
            onClick={addEntry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            + Add Entry
          </button>
        </div>

        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timestamp
                  </label>
                  <input
                    type="datetime-local"
                    value={entry.timestamp.slice(0, 16)}
                    onChange={(e) =>
                      updateEntry(
                        index,
                        "timestamp",
                        e.target.value + ":00.000Z",
                      )
                    }
                    className="w-48 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={entry.text}
                    onChange={(e) => updateEntry(index, "text", e.target.value)}
                    placeholder="What did you work on?"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                  />
                </div>
                <button
                  onClick={() => removeEntry(index)}
                  className="mt-6 px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
                  title="Remove entry"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Errors */}
      {hasValidationErrors && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold mb-2">
            ❌ Validation Errors
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-red-700 text-sm">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-red-800 font-semibold mb-1">Error</h3>
              <p className="text-red-700 mb-2">{getErrorMessage(error)}</p>
              {error.response?.message && (
                <p className="text-red-600 text-sm">
                  Details: {error.response.message}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              {error.retryable && (
                <button
                  onClick={handleGenerateSummary}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Retry
                </button>
              )}
              <button
                onClick={clearError}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="mb-6">
        <button
          onClick={handleGenerateSummary}
          disabled={
            loading ||
            entries.filter((e) => e.text.trim()).length === 0 ||
            !isQuotaAvailable
          }
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
            loading ||
            entries.filter((e) => e.text.trim()).length === 0 ||
            !isQuotaAvailable
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Generating Summary...
            </>
          ) : (
            "🤖 Generate Weekly Summary"
          )}
        </button>
      </div>

      {/* Results Display */}
      {data && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-green-800 font-bold text-xl">
              ✨ Weekly Summary
            </h3>
            <button
              onClick={reset}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Clear
            </button>
          </div>
          <div className="prose prose-green max-w-none">
            {data.summary.split("\n").map((line, index) => (
              <p key={index} className="text-green-800 mb-2">
                {line}
              </p>
            ))}
          </div>
          <div className="mt-4 p-3 bg-green-100 rounded text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Generated:</span>
                <span className="ml-2">{new Date().toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium">Remaining quota:</span>
                <span className="ml-2 font-bold">{data.remaining}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Information */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-blue-800 font-semibold mb-2">
          ℹ️ Demo Information
        </h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>
            • This is a demonstration component showing API client integration
          </li>
          <li>• The client is configured in mock mode for testing</li>
          <li>
            • In production, use real Supabase configuration and authentication
            tokens
          </li>
          <li>
            • All API calls include retry logic and comprehensive error handling
          </li>
          <li>• Check the browser console for detailed logging</li>
        </ul>
      </div>
    </div>
  );
}
