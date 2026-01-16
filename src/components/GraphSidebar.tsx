"use client";

import { useState } from "react";
import { Graph } from "./Graph";
import { GraphModal } from "./GraphModal";
import type { GraphData } from "@/lib/notes";

interface GraphSidebarProps {
  data: GraphData;
  onNodeClick: (noteId: string) => void;
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

export function GraphSidebar({ data, onNodeClick }: GraphSidebarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <aside className="graph-sidebar">
        <div className="graph-header">
          <span className="graph-title">KNOWLEDGE GRAPH</span>
          <button
            className="graph-btn"
            aria-label="Expand graph"
            onClick={() => setIsModalOpen(true)}
          >
            <ExpandIcon />
          </button>
        </div>
        <div className="graph-bento">
          <Graph data={data} onNodeClick={onNodeClick} />
        </div>
        <div className="graph-footer">
          Powered by krisyotam.com
        </div>
      </aside>

      {isModalOpen && (
        <GraphModal
          data={data}
          onNodeClick={onNodeClick}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
