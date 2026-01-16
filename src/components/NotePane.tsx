"use client";

import { useRef, useEffect } from "react";
import type { Note } from "@/lib/notes";
import { usePanes } from "@/lib/panes-context";

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
          <div className="note-content">
            {/* Metadata */}
            <dl className="note-metadata">
              {note.status && (
                <>
                  <dt>Status:</dt>
                  <dd><span className="tag">{note.status}</span></dd>
                </>
              )}
              {note.certainty && (
                <>
                  <dt>Certainty:</dt>
                  <dd><span className="tag">{note.certainty}</span></dd>
                </>
              )}
              {note.importance && (
                <>
                  <dt>Importance:</dt>
                  <dd><span className="tag">{note.importance}</span></dd>
                </>
              )}
              {note.start && (
                <>
                  <dt>Start:</dt>
                  <dd>{note.start}</dd>
                </>
              )}
              {note.finish && (
                <>
                  <dt>Finish:</dt>
                  <dd>{note.finish}</dd>
                </>
              )}
              {note.tags.length > 0 && (
                <>
                  <dt>Tags:</dt>
                  <dd>
                    {note.tags.map((tag, i) => (
                      <span key={tag}>
                        <span className="tag">{tag}</span>
                        {i < note.tags.length - 1 && " "}
                      </span>
                    ))}
                  </dd>
                </>
              )}
              {note.preview && (
                <>
                  <dt>Preview:</dt>
                  <dd className="preview-text">{note.preview}</dd>
                </>
              )}
            </dl>

            {/* Title */}
            <h1>{note.title}</h1>

            {/* Content */}
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
