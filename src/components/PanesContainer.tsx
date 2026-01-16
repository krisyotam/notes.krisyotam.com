"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePanes } from "@/lib/panes-context";
import { NotePane } from "./NotePane";

interface PanesContainerProps {
  onLinkClick: (noteId: string) => void;
}

const PANE_WIDTH = 700;
const TAB_WIDTH = 32;
const PANE_SPACING = PANE_WIDTH - TAB_WIDTH; // 668px

export function PanesContainer({ onLinkClick }: PanesContainerProps) {
  const { openPanes, activeNoteId } = usePanes();
  const containerRef = useRef<HTMLDivElement>(null);
  const paneRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rafId = useRef<number>(0);

  // Update pane positions directly via DOM (no React re-render)
  const updatePanePositions = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const viewportRight = scrollLeft + containerWidth;

    openPanes.forEach((note, index) => {
      const paneEl = paneRefs.current.get(note.id);
      if (!paneEl) return;

      const naturalPosition = index * PANE_SPACING;
      const paneRight = naturalPosition + PANE_WIDTH;

      // Check collapse state
      const isCollapsedLeft = paneRight <= scrollLeft + TAB_WIDTH;
      const isCollapsedRight = naturalPosition >= viewportRight - TAB_WIDTH;

      let finalPosition = naturalPosition;

      if (isCollapsedLeft) {
        finalPosition = scrollLeft + (index * TAB_WIDTH);
      } else if (isCollapsedRight) {
        const rightStackIndex = openPanes.length - 1 - index;
        finalPosition = viewportRight - ((rightStackIndex + 1) * TAB_WIDTH);
      }

      // Update transform directly
      paneEl.style.transform = `translateX(${finalPosition}px)`;

      // Update classes
      paneEl.classList.toggle("collapsed", isCollapsedLeft || isCollapsedRight);
      paneEl.classList.toggle("collapsed-left", isCollapsedLeft);
      paneEl.classList.toggle("collapsed-right", isCollapsedRight);

      // Update z-index
      let zIndex;
      if (isCollapsedLeft) {
        zIndex = 500 + index;
      } else if (isCollapsedRight) {
        zIndex = 500 + (openPanes.length - index);
      } else {
        zIndex = index + 1;
      }
      paneEl.style.zIndex = note.id === activeNoteId ? "1000" : String(zIndex);
    });
  }, [openPanes, activeNoteId]);

  // Throttled scroll handler using requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    rafId.current = requestAnimationFrame(updatePanePositions);
  }, [updatePanePositions]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", updatePanePositions);
      // Initial position update
      updatePanePositions();
      return () => {
        container.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", updatePanePositions);
        if (rafId.current) cancelAnimationFrame(rafId.current);
      };
    }
  }, [handleScroll, updatePanePositions]);

  // Scroll to active pane when it changes
  useEffect(() => {
    if (activeNoteId && containerRef.current) {
      const activeIndex = openPanes.findIndex((p) => p.id === activeNoteId);
      if (activeIndex >= 0) {
        const targetScroll = activeIndex * PANE_SPACING;
        containerRef.current.scrollTo({
          left: targetScroll,
          behavior: "smooth",
        });
      }
    }
  }, [activeNoteId, openPanes]);

  // Update positions when panes change
  useEffect(() => {
    updatePanePositions();
  }, [openPanes, updatePanePositions]);

  if (openPanes.length === 0) {
    return (
      <div className="panes-container">
        <div className="empty-state">
          <h2>No notes open</h2>
          <p>Select a note from the sidebar to view it here.</p>
          <p style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
            Click multiple notes to open them side by side.
          </p>
        </div>
      </div>
    );
  }

  // Total scrollable width
  const scrollableWidth = (openPanes.length - 1) * PANE_SPACING + PANE_WIDTH;

  return (
    <div className="panes-container" ref={containerRef}>
      <div className="stacked-panes" style={{ width: scrollableWidth }}>
        {openPanes.map((note, index) => (
          <div
            key={note.id}
            ref={(el) => {
              if (el) paneRefs.current.set(note.id, el);
              else paneRefs.current.delete(note.id);
            }}
            className={`stacked-pane ${note.id === activeNoteId ? "active" : ""}`}
            style={{
              transform: `translateX(${index * PANE_SPACING}px)`,
              zIndex: note.id === activeNoteId ? 1000 : index + 1,
            }}
          >
            <NotePane
              note={note}
              index={index}
              isActive={note.id === activeNoteId}
              onLinkClick={onLinkClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
