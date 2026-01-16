"use client";

import { formatDateRange, getTodayISO, formatDate } from "@/lib/date";
import { Info } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/notes";

/* ═══════════════════════════════════════════════════════════════════════════
 * TYPE DEFINITIONS
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Status values for notes */
export type NoteStatus =
  | "rough"
  | "growing"
  | "evergreen"
  | "abandoned";

/** Certainty levels based on Kesselman List of Estimative Words */
export type NoteCertainty =
  | "impossible"
  | "remote"
  | "highly unlikely"
  | "unlikely"
  | "possible"
  | "likely"
  | "highly likely"
  | "certain";

/* ═══════════════════════════════════════════════════════════════════════════
 * EXPLANATION TEXTS
 * ═══════════════════════════════════════════════════════════════════════════ */

const STATUS_EXPLANATION = `The status indicator reflects the maturity of the note:

• rough — Initial thoughts, unstructured
• growing — Being actively developed
• evergreen — Stable, well-developed content
• abandoned — No longer being maintained

This helps readers understand the completeness of the content.`;

const CERTAINTY_EXPLANATION = `The certainty tag expresses how well-supported the content is, or how likely its overall ideas are right. This uses a scale from "impossible" to "certain", based on the Kesselman List of Estimative Words:

1. "certain"
2. "highly likely"
3. "likely"
4. "possible"
5. "unlikely"
6. "highly unlikely"
7. "remote"
8. "impossible"

Even ideas that seem unlikely may be worth exploring if their potential impact is significant enough.`;

const IMPORTANCE_EXPLANATION = `The importance rating distinguishes between trivial topics and those which might change your life. Using a scale from 0-10, content is ranked based on its potential impact on:

- the reader
- the intended audience
- the world at large

For example, topics about fundamental research or transformative technologies would rank 9-10, while personal reflections or minor experiments might rank 0-1.`;

/* ═══════════════════════════════════════════════════════════════════════════
 * COLOR UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Returns the appropriate color class for a certainty level
 * Uses theme-aware CSS variables for consistent dark/light mode
 */
function getCertaintyColor(certainty: string): string {
  const colors: Record<string, string> = {
    certain: "text-foreground",
    "highly likely": "text-foreground",
    likely: "text-foreground/80",
    possible: "text-muted-foreground",
    unlikely: "text-muted-foreground/80",
    "highly unlikely": "text-muted-foreground/60",
    remote: "text-muted-foreground/50",
    impossible: "text-muted-foreground/40",
  };
  return colors[certainty] || "text-muted-foreground";
}

/**
 * Returns the appropriate color class for a status
 * Uses theme-aware CSS variables for consistent dark/light mode
 */
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    evergreen: "text-foreground",
    growing: "text-foreground/80",
    rough: "text-muted-foreground",
    abandoned: "text-muted-foreground/60",
  };
  return colors[status] || "text-muted-foreground";
}

/**
 * Returns the appropriate color class for an importance rating
 * Uses theme-aware CSS variables for consistent dark/light mode
 */
function getImportanceColor(importance: number): string {
  if (importance >= 8) return "text-foreground";
  if (importance >= 6) return "text-foreground/80";
  if (importance >= 4) return "text-muted-foreground";
  if (importance >= 2) return "text-muted-foreground/80";
  return "text-muted-foreground/60";
}

/**
 * Determines the title size class based on title length
 */
function getTitleClass(titleLength: number): string {
  if (titleLength > 50) return "text-2xl";
  if (titleLength > 30) return "text-3xl";
  return "text-4xl";
}

/* ═══════════════════════════════════════════════════════════════════════════
 * MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */

interface NoteHeaderProps {
  note: Note;
  className?: string;
}

export function NoteHeader({ note, className }: NoteHeaderProps) {
  const startDate = note.start || "";
  const endDate = note.finish?.trim() || getTodayISO();

  const status = note.status || "growing";
  const certainty = note.certainty || "possible";
  const importance = note.importance ? parseInt(note.importance, 10) : 5;

  /* ─────────────────────────────────────────────────────────────────────────
   * Date Formatting
   * ───────────────────────────────────────────────────────────────────────── */

  const renderDate = () => {
    if (startDate) {
      // Always show both dates - if end_date is empty, use current date (means ongoing)
      const effectiveEndDate = note.finish?.trim() || getTodayISO();
      const formattedDate = formatDateRange(startDate, effectiveEndDate);

      return (
        <time dateTime={startDate} className="font-mono text-sm text-muted-foreground">
          {formattedDate}
        </time>
      );
    }
    return null;
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * Render
   * ───────────────────────────────────────────────────────────────────────── */

  return (
    <header className={cn("mb-4 relative", className)}>
      {/* ─────────────────────────────────────────────────────────────────────
       * Main Content Container
       * ───────────────────────────────────────────────────────────────────── */}
      <div className="border border-border bg-card text-card-foreground p-6 rounded-sm shadow-sm">
        {/* Title */}
        <h1
          className={cn(
            "font-serif font-medium tracking-tight mb-2 text-center uppercase",
            getTitleClass(note.title.length)
          )}
        >
          {note.title}
        </h1>

        {/* Preview/Description */}
        {note.preview && (
          <p className="text-center font-serif text-sm text-muted-foreground italic mb-6 max-w-2xl mx-auto">
            {note.preview}
          </p>
        )}

        {/* Date Display */}
        {startDate && (
          <div className="text-center mb-4">{renderDate()}</div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
         * Metadata Section (Status, Certainty, Importance)
         * ───────────────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap justify-center items-center gap-x-3 text-sm font-mono mb-6">
          {/* Status */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className={cn("flex items-center gap-1 cursor-help", getStatusColor(status))}>
                <Info className="h-3 w-3" />
                <span className="font-medium">status: {status}</span>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 text-sm bg-card text-card-foreground border-border p-4 font-serif">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Status Indicator</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{STATUS_EXPLANATION}</p>
              </div>
            </HoverCardContent>
          </HoverCard>

          <span className="text-muted-foreground">·</span>

          {/* Certainty */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className={cn("flex items-center gap-1 cursor-help", getCertaintyColor(certainty))}>
                <Info className="h-3 w-3" />
                <span className="font-medium">certainty: {certainty}</span>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 text-sm bg-card text-card-foreground border-border p-4 font-serif">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Certainty Rating</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{CERTAINTY_EXPLANATION}</p>
              </div>
            </HoverCardContent>
          </HoverCard>

          <span className="text-muted-foreground">·</span>

          {/* Importance */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className={cn("flex items-center gap-1 cursor-help", getImportanceColor(importance))}>
                <Info className="h-3 w-3" />
                <span className="font-medium">importance: {importance}/10</span>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 text-sm bg-card text-card-foreground border-border p-4 font-serif">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Importance Rating</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{IMPORTANCE_EXPLANATION}</p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {note.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="border border-border bg-secondary/40 px-2 py-1 text-xs font-mono hover:bg-secondary transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Decorative inner border */}
        <div className="mt-4 border-b border-border"></div>
      </div>

      {/* Decorative bottom border */}
      <div className="mt-6 border-b border-border"></div>
    </header>
  );
}
