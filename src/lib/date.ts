/* =============================================================================
 * DATE UTILITIES
 * =============================================================================
 *
 * Centralized date handling for the entire site. All date formatting and
 * parsing should go through this module for consistency.
 *
 * -----------------------------------------------------------------------------
 * @file        date.ts
 * @author      Kris Yotam
 * @created     2026-01-01
 * @modified    2026-01-01
 * @license     MIT
 * -----------------------------------------------------------------------------
 *
 * TIMEZONE
 * --------
 * The site uses Central Time (America/Chicago) as the canonical timezone.
 * All date displays should be consistent with this timezone.
 *
 * ============================================================================= */

/* -----------------------------------------------------------------------------
 * CONSTANTS
 * ----------------------------------------------------------------------------- */

export const TIMEZONE = "America/Chicago"
export const LOCALE = "en-US"

/* -----------------------------------------------------------------------------
 * TYPES
 * ----------------------------------------------------------------------------- */

export type DateInput = string | Date | null | undefined

/* -----------------------------------------------------------------------------
 * PARSING
 * ----------------------------------------------------------------------------- */

/**
 * Safely parse a date input into a Date object.
 * Handles ISO strings (YYYY-MM-DD), Date objects, and invalid inputs.
 */
export function parseDate(input: DateInput): Date | null {
  if (!input) return null

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input
  }

  // Handle ISO date string (YYYY-MM-DD) without timezone issues
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [year, month, day] = input.split("-").map(Number)
    const date = new Date(year, month - 1, day, 12, 0, 0) // Noon to avoid edge cases
    return isNaN(date.getTime()) ? null : date
  }

  // Handle other string formats
  if (typeof input === "string") {
    const date = new Date(input)
    return isNaN(date.getTime()) ? null : date
  }

  return null
}

/* -----------------------------------------------------------------------------
 * FORMATTING - COMMON PATTERNS
 * ----------------------------------------------------------------------------- */

/**
 * Full date: "January 1, 2025"
 */
export function formatFull(input: DateInput): string {
  const date = parseDate(input)
  if (!date) return "Invalid date"

  return date.toLocaleDateString(LOCALE, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

/**
 * Compact date: "Jan 1, 2025"
 */
export function formatCompact(input: DateInput): string {
  const date = parseDate(input)
  if (!date) return "Invalid date"

  return date.toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

/**
 * Month and year only: "January 2025"
 */
export function formatMonthYear(input: DateInput): string {
  const date = parseDate(input)
  if (!date) return "Invalid date"

  return date.toLocaleDateString(LOCALE, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

/**
 * Short month and day: "Jan 1"
 */
export function formatMonthDay(input: DateInput): string {
  const date = parseDate(input)
  if (!date) return "Invalid date"

  return date.toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

/**
 * Numeric date: "01.15.2025"
 */
export function formatNumeric(input: DateInput): string {
  const date = parseDate(input)
  if (!date) return "Invalid date"

  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const year = date.getFullYear()

  return `${month}.${day}.${year}`
}

/**
 * ISO date: "2025-01-15"
 */
export function formatISO(input: DateInput): string {
  const date = parseDate(input)
  if (!date) return "Invalid date"

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

/**
 * Relative date: "2 days ago", "in 3 weeks", etc.
 */
export function formatRelative(input: DateInput): string {
  const date = parseDate(input)
  if (!date) return "Invalid date"

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "today"
  if (diffDays === 1) return "yesterday"
  if (diffDays === -1) return "tomorrow"
  if (diffDays > 0 && diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 0 && diffDays > -7) return `in ${Math.abs(diffDays)} days`
  if (diffDays > 0 && diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 0 && diffDays > -30) return `in ${Math.floor(Math.abs(diffDays) / 7)} weeks`
  if (diffDays > 0 && diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  if (diffDays < 0 && diffDays > -365) return `in ${Math.floor(Math.abs(diffDays) / 30)} months`

  return formatCompact(date)
}

/* -----------------------------------------------------------------------------
 * FORMATTING - DATE RANGES
 * ----------------------------------------------------------------------------- */

/**
 * Date range: "January 1, 2025 - January 15, 2025"
 * Always shows both dates when end is provided (even if same day).
 */
export function formatRange(start: DateInput, end?: DateInput): string {
  const startDate = parseDate(start)
  if (!startDate) return "Invalid date"

  if (!end) return formatFull(startDate)

  const endDate = parseDate(end)
  if (!endDate) return formatFull(startDate)

  return `${formatFull(startDate)} - ${formatFull(endDate)}`
}

/* -----------------------------------------------------------------------------
 * CENTRAL TIME UTILITIES
 * ----------------------------------------------------------------------------- */

/**
 * Get the current date in Central Time.
 * Returns { month, day, year } as numbers.
 */
export function getCentralTimeDate(date = new Date()): { month: number; day: number; year: number } {
  const parts = new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).formatToParts(date)

  return {
    month: Number(parts.find(p => p.type === "month")?.value || 1),
    day: Number(parts.find(p => p.type === "day")?.value || 1),
    year: Number(parts.find(p => p.type === "year")?.value || 2000),
  }
}

/**
 * Get the current date in Central Time as MM-DD format.
 * Useful for lookups keyed by month-day.
 */
export function getCentralTimeDateKey(date = new Date()): string {
  const { month, day } = getCentralTimeDate(date)
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/**
 * Format a date in Central Time.
 */
export function formatInCentralTime(
  input: DateInput,
  options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" }
): string {
  const date = parseDate(input)
  if (!date) return "Invalid date"

  return date.toLocaleDateString(LOCALE, {
    ...options,
    timeZone: TIMEZONE,
  })
}

/* -----------------------------------------------------------------------------
 * CURRENT DATE HELPERS
 * ----------------------------------------------------------------------------- */

/**
 * Get current month and year: "January 2025"
 */
export function getCurrentMonthYear(): string {
  return new Date().toLocaleDateString(LOCALE, {
    year: "numeric",
    month: "long",
    timeZone: TIMEZONE,
  })
}

/**
 * Get current year
 */
export function getCurrentYear(): number {
  return getCentralTimeDate().year
}

/**
 * Get today's date as ISO string
 */
export function getTodayISO(): string {
  const { year, month, day } = getCentralTimeDate()
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/* -----------------------------------------------------------------------------
 * VALIDATION
 * ----------------------------------------------------------------------------- */

/**
 * Check if a date input is valid
 */
export function isValidDate(input: DateInput): boolean {
  return parseDate(input) !== null
}

/**
 * Check if a date is in the past
 */
export function isPast(input: DateInput): boolean {
  const date = parseDate(input)
  if (!date) return false
  return date.getTime() < Date.now()
}

/**
 * Check if a date is in the future
 */
export function isFuture(input: DateInput): boolean {
  const date = parseDate(input)
  if (!date) return false
  return date.getTime() > Date.now()
}

/**
 * Check if a date is today
 */
export function isToday(input: DateInput): boolean {
  const date = parseDate(input)
  if (!date) return false
  return formatISO(date) === getTodayISO()
}

/* -----------------------------------------------------------------------------
 * LEGACY ALIASES
 * -----------------------------------------------------------------------------
 * These maintain backwards compatibility with existing code.
 * New code should use the specific format functions above.
 * ----------------------------------------------------------------------------- */

/** @deprecated Use formatFull instead */
export const formatDate = formatFull

/** @deprecated Use formatCompact instead */
export const formatDateCompact = formatCompact

/** @deprecated Use formatRange instead */
export const formatDateRange = formatRange

/** @deprecated Use formatFull instead */
export const formatDateWithValidation = formatFull
