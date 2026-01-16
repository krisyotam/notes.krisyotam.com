"use client";

import { useRef, useEffect } from "react";
import type { Note } from "@/lib/notes";
import { usePanes } from "@/lib/panes-context";
import { NoteHeader } from "./NoteHeader";

interface NotePaneProps {
  note: Note;
  index: number;
  isActive: boolean;
  onLinkClick: (noteId: string) => void;
}

export function NotePane({ note, index, isActive, onLinkClick }: NotePaneProps) {
  const { setActiveNote } = usePanes();
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle clicks on note links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link) {
        const href = link.getAttribute("href");
        if (href?.startsWith("note:")) {
          e.preventDefault();
          const noteId = href.replace("note:", "");
          onLinkClick(noteId);
        }
      }
    };

    const content = contentRef.current;
    if (content) {
      content.addEventListener("click", handleClick);
      return () => content.removeEventListener("click", handleClick);
    }
  }, [onLinkClick]);

  return (
    <>
      {/* Vertical tab on left - shown when collapsed-right */}
      <div className="pane-tab pane-tab-left" onClick={() => setActiveNote(note.id)}>
        <span className="pane-tab-title">{note.title}</span>
      </div>

      {/* Main content area */}
      <div className="pane-main">
        <div className="pane-content">
          {/* Header with metadata - outside note-content to avoid style inheritance */}
          <NoteHeader note={note} />

          {/* Content - org-mode rendered HTML */}
          <div className="note-content">
            <div
              ref={contentRef}
              dangerouslySetInnerHTML={{ __html: note.htmlContent }}
            />

            {/* Links to this page section */}
            {note.links.length > 0 && (
              <div className="backlinks-section">
                <h3 className="backlinks-title">LINKS TO THIS PAGE</h3>
                <div className="backlinks-list">
                  {note.links.map((linkId) => (
                    <a
                      key={linkId}
                      href="#"
                      className="backlink"
                      onClick={(e) => {
                        e.preventDefault();
                        onLinkClick(linkId);
                      }}
                    >
                      {linkId}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vertical tab on right - shown when collapsed-left */}
      <div className="pane-tab pane-tab-right" onClick={() => setActiveNote(note.id)}>
        <span className="pane-tab-title">{note.title}</span>
      </div>
    </>
  );
}
