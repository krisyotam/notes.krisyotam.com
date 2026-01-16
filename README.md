# notes.krisyotam.com

A personal knowledge base and digital garden built with Next.js. Inspired by the Zettelkasten method and Andy Matuschak's sliding panes interface.

## Philosophy

This project exists as a replacement for Obsidian Publish, designed to present interconnected notes in a way that mirrors how knowledge actually works—not as isolated documents, but as a web of ideas that reference and build upon each other.

The interface draws from several traditions:
- **Zettelkasten** — Niklas Luhmann's slip-box method of atomic, interconnected notes
- **Sliding Panes** — Andy Matuschak's stacked notes interface for non-linear reading
- **Digital Gardens** — The philosophy of learning in public and cultivating ideas over time

## Features

### Stacked Panes

Notes open in horizontally stacked panes that can be scrolled through. As you navigate deeper into linked notes, they stack to the right. Panes intelligently collapse to vertical tabs when scrolled off-screen, allowing you to maintain context while exploring.

- Bidirectional collapse (left and right edges)
- Smooth scroll-based positioning
- Click collapsed tabs to bring panes back into view
- Active pane highlighting

### Knowledge Graph

An interactive force-directed graph visualizes the connections between notes. Nodes represent individual notes; edges represent links between them. The graph can be expanded to full-screen for exploration.

### Note Organization

Notes are organized into semantic folders following the Zettelkasten tradition:

| Folder | Purpose |
|--------|---------|
| `slipbox` | Permanent notes — refined, atomic ideas |
| `cards` | Flashcards for spaced repetition (CSV support) |
| `index` | Index notes and maps of content |
| `jottings` | Quick captures and fleeting notes |
| `lecture` | Notes from courses, talks, and readings |
| `marginalia` | Annotations and commentary on sources |

### Design

The visual design follows Kenya Hara's philosophy of "emptiness" — a monochromatic palette that recedes to let content breathe. No unnecessary color, no visual noise.

- Light and dark themes
- Bento-style UI components
- Serif typography for reading, sans-serif for UI
- Square corners throughout (no border-radius)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + CSS Variables
- **Graph**: D3.js force simulation
- **Markdown**: MDX with KaTeX math support
- **Fonts**: Outfit (UI), Georgia (content)

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main layout orchestration
│   ├── globals.css       # Design system & components
│   └── layout.tsx        # Root layout with providers
├── components/
│   ├── Sidebar.tsx       # Folder tree navigation
│   ├── PanesContainer.tsx # Stacked panes logic
│   ├── NotePane.tsx      # Individual note rendering
│   ├── Graph.tsx         # Force-directed graph
│   ├── GraphSidebar.tsx  # Graph panel wrapper
│   └── GraphModal.tsx    # Fullscreen graph view
├── lib/
│   ├── notes.ts          # Note parsing & folder tree
│   ├── panes-context.tsx # Pane state management
│   └── theme-context.tsx # Theme state management
└── content/
    └── notes/            # Markdown notes live here
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Adding Notes

Create markdown files in `src/content/notes/` within the appropriate folder:

```markdown
---
title: "Note Title"
date: "2024-01-15"
tags: ["tag1", "tag2"]
---

Your note content here. Link to other notes using [[wiki-style links]].
```

For flashcards, create CSV files in the `cards` folder:

```csv
Front,Back
What is the capital of France?,Paris
Define entropy,A measure of disorder in a system
```

## License

MIT

---

*"The unexamined life is not worth living." — Socrates*
