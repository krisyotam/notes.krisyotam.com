"use client";

import { useCallback, useEffect, useRef } from "react";
import { Sidebar } from "./Sidebar";
import { PanesContainer } from "./PanesContainer";
import { GraphSidebar } from "./GraphSidebar";
import { usePanes } from "@/lib/panes-context";
import type { FolderTree, GraphData, Note } from "@/lib/notes";

interface NotesAppProps {
  folderTree: FolderTree;
  graphData: GraphData;
  notesMap: Record<string, Note>;
}

// The landing page note that opens automatically
const LANDING_PAGE_SLUG = "slipbox/about-these-notes";

export function NotesApp({ folderTree, graphData, notesMap }: NotesAppProps) {
  const { openNote } = usePanes();
  const hasOpenedLanding = useRef(false);

  // Open landing page on initial load
  useEffect(() => {
    if (hasOpenedLanding.current) return;
    hasOpenedLanding.current = true;

    const landingNote = notesMap[LANDING_PAGE_SLUG];
    if (landingNote) {
      openNote(landingNote);
    }
  }, [notesMap, openNote]);

  const handleNoteOpen = useCallback(
    (slugOrId: string) => {
      // First try by slug
      let note: Note | undefined = notesMap[slugOrId];

      // If not found by slug, try by ID
      if (!note) {
        note = Object.values(notesMap).find((n) => n.id === slugOrId);
      }

      if (note) {
        openNote(note);
      } else {
        console.warn(`Note not found: ${slugOrId}`);
      }
    },
    [notesMap, openNote]
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar folderTree={folderTree} onNoteClick={handleNoteOpen} />
      <PanesContainer onLinkClick={handleNoteOpen} />
      <GraphSidebar data={graphData} onNodeClick={handleNoteOpen} />
    </div>
  );
}
