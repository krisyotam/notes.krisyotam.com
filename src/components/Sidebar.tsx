"use client";

import { useState } from "react";
import type { FolderTree, NoteMetadata } from "@/lib/notes";
import { usePanes } from "@/lib/panes-context";
import { useTheme } from "@/lib/theme-context";

interface SidebarProps {
  folderTree: FolderTree;
  onNoteClick: (slug: string) => void;
}

function FolderIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{
        transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 0.15s",
      }}
    >
      <path
        d="M6 4L10 8L6 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect
        x="3"
        y="2"
        width="10"
        height="12"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="5"
        y1="5"
        x2="11"
        y2="5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="5"
        y1="8"
        x2="11"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="5"
        y1="11"
        x2="8"
        y2="11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// Folders that should start collapsed
const COLLAPSED_BY_DEFAULT = ["cards", "index", "jottings", "lecture", "marginalia"];

function FolderNode({
  folder,
  onNoteClick,
  activeNoteId,
}: {
  folder: FolderTree;
  onNoteClick: (slug: string) => void;
  activeNoteId: string | null;
}) {
  // Only slipbox starts expanded, others start collapsed
  const [expanded, setExpanded] = useState(!COLLAPSED_BY_DEFAULT.includes(folder.name));

  const hasChildren = folder.children.length > 0 || folder.notes.length > 0;

  return (
    <div>
      {folder.name !== "Notes" && (
        <div
          className="folder-item"
          onClick={() => setExpanded(!expanded)}
        >
          <FolderIcon expanded={expanded} />
          <span>{folder.name}</span>
        </div>
      )}
      {(expanded || folder.name === "Notes") && hasChildren && (
        <div className={folder.name !== "Notes" ? "folder-children" : ""}>
          {folder.children.map((child) => (
            <FolderNode
              key={child.path}
              folder={child}
              onNoteClick={onNoteClick}
              activeNoteId={activeNoteId}
            />
          ))}
          {folder.notes.map((note) => (
            <div
              key={note.id}
              className={`folder-item ${activeNoteId === note.id ? "active" : ""}`}
              onClick={() => onNoteClick(note.slug)}
            >
              <NoteIcon />
              <span>{note.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ folderTree, onNoteClick }: SidebarProps) {
  const { activeNoteId } = usePanes();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter notes based on search
  const filterTree = (tree: FolderTree, query: string): FolderTree => {
    if (!query) return tree;

    const lowerQuery = query.toLowerCase();

    const filteredNotes = tree.notes.filter(
      (note) =>
        note.title.toLowerCase().includes(lowerQuery) ||
        note.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );

    const filteredChildren = tree.children
      .map((child) => filterTree(child, query))
      .filter((child) => child.notes.length > 0 || child.children.length > 0);

    return {
      ...tree,
      notes: filteredNotes,
      children: filteredChildren,
    };
  };

  const filteredTree = filterTree(folderTree, searchQuery);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="profile-bento">
          <div className="profile-bento-row">
            <div className="profile-bento-cell profile-info-cell">
              <h1 className="profile-name">Kris Yotam</h1>
              <p className="profile-quote">"The unexamined life is not worth living."</p>
            </div>
            <button
              className="profile-bento-cell theme-toggle-cell"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
          <div className="profile-bento-row search-row">
            <input
              type="text"
              className="search-input"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      <nav className="sidebar-content">
        <div className="folder-tree">
          <FolderNode
            folder={filteredTree}
            onNoteClick={onNoteClick}
            activeNoteId={activeNoteId}
          />
        </div>
      </nav>
    </aside>
  );
}
