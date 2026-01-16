"use client";

import { useEffect, useCallback } from "react";
import { Graph } from "./Graph";
import type { GraphData } from "@/lib/notes";

interface GraphModalProps {
  data: GraphData;
  onNodeClick: (noteId: string) => void;
  onClose: () => void;
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function GraphModal({ data, onNodeClick, onClose }: GraphModalProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  // Handle node click - close modal and open note
  const handleNodeClick = (noteId: string) => {
    onNodeClick(noteId);
    onClose();
  };

  return (
    <div className="graph-modal-overlay" onClick={onClose}>
      <div className="graph-modal" onClick={(e) => e.stopPropagation()}>
        <div className="graph-modal-header">
          <span className="graph-title">KNOWLEDGE GRAPH</span>
          <button className="graph-modal-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="graph-modal-content">
          <Graph data={data} onNodeClick={handleNodeClick} />
        </div>
      </div>
    </div>
  );
}
