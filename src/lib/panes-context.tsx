"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Note } from "./notes";

interface PanesContextType {
  openPanes: Note[];
  activeNoteId: string | null;
  hasCardOpen: boolean;
  openNote: (note: Note) => void;
  closeNote: (noteId: string) => void;
  setActiveNote: (noteId: string) => void;
  closeAllNotes: () => void;
}

const PanesContext = createContext<PanesContextType | null>(null);

export function PanesProvider({ children }: { children: ReactNode }) {
  const [openPanes, setOpenPanes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Check if any card is currently open
  const hasCardOpen = openPanes.some((n) => n.noteType === "card");

  const openNote = useCallback((note: Note) => {
    setOpenPanes((current) => {
      // Check if already open
      const existing = current.find((n) => n.id === note.id);
      if (existing) {
        setActiveNoteId(note.id);
        return current;
      }

      // Check if a card is currently open
      const cardOpen = current.some((n) => n.noteType === "card");

      // If a card is open and trying to open something else, don't allow
      if (cardOpen && note.noteType !== "card") {
        // Card must be closed first - don't open the new note
        return current;
      }

      // If opening a card, close all other panes first
      if (note.noteType === "card") {
        setActiveNoteId(note.id);
        return [note];
      }

      // Add new pane
      setActiveNoteId(note.id);
      return [...current, note];
    });
  }, []);

  const closeNote = useCallback((noteId: string) => {
    setOpenPanes((current) => {
      const newPanes = current.filter((n) => n.id !== noteId);
      // Update active note if we closed the active one
      if (activeNoteId === noteId) {
        setActiveNoteId(newPanes.length > 0 ? newPanes[newPanes.length - 1].id : null);
      }
      return newPanes;
    });
  }, [activeNoteId]);

  const setActiveNote = useCallback((noteId: string) => {
    setActiveNoteId(noteId);
  }, []);

  const closeAllNotes = useCallback(() => {
    setOpenPanes([]);
    setActiveNoteId(null);
  }, []);

  return (
    <PanesContext.Provider
      value={{
        openPanes,
        activeNoteId,
        hasCardOpen,
        openNote,
        closeNote,
        setActiveNote,
        closeAllNotes,
      }}
    >
      {children}
    </PanesContext.Provider>
  );
}

export function usePanes() {
  const context = useContext(PanesContext);
  if (!context) {
    throw new Error("usePanes must be used within a PanesProvider");
  }
  return context;
}
