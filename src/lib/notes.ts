import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";

const NOTES_DIR = path.join(process.cwd(), "content/notes");

// Predefined folders in display order
const FOLDER_ORDER = ["cards", "index", "jottings", "lecture", "marginalia", "slipbox"];

export type NoteType = "note" | "card";

export interface NoteMetadata {
  id: string;
  title: string;
  slug: string;
  folder: string;
  tags: string[];
  status?: string;
  certainty?: string;
  importance?: string;
  start?: string;
  finish?: string;
  preview?: string;
  links: string[]; // IDs of linked notes
  noteType: NoteType;
}

export interface Note extends NoteMetadata {
  content: string;
  htmlContent: string;
}

export interface FolderTree {
  name: string;
  path: string;
  children: FolderTree[];
  notes: NoteMetadata[];
}

// Parse org-mode file to extract metadata and content
function parseOrgFile(content: string, filePath: string): { metadata: Partial<NoteMetadata>; body: string } {
  const lines = content.split("\n");
  const metadata: Partial<NoteMetadata> = {};
  let bodyStartIndex = 0;
  let inPropertyDrawer = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === ":PROPERTIES:") {
      inPropertyDrawer = true;
      continue;
    }

    if (line === ":END:") {
      inPropertyDrawer = false;
      continue;
    }

    if (inPropertyDrawer) {
      const match = line.match(/^:([A-Z_]+):\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        switch (key) {
          case "ID":
            metadata.id = value;
            break;
          case "STATUS":
            metadata.status = value;
            break;
          case "CERTAINTY":
            metadata.certainty = value;
            break;
          case "IMPORTANCE":
            metadata.importance = value;
            break;
          case "START":
            metadata.start = value;
            break;
          case "FINISH":
            metadata.finish = value;
            break;
          case "PREVIEW":
            metadata.preview = value;
            break;
        }
      }
      continue;
    }

    // Parse title
    if (line.startsWith("#+title:") || line.startsWith("#+TITLE:")) {
      metadata.title = line.replace(/^#\+title:\s*/i, "").trim();
      continue;
    }

    // Parse filetags
    if (line.startsWith("#+filetags:") || line.startsWith("#+FILETAGS:")) {
      const tagString = line.replace(/^#\+filetags:\s*/i, "").trim();
      metadata.tags = tagString.split(":").filter(t => t.length > 0);
      continue;
    }

    // Skip other metadata lines
    if (line.startsWith("#+")) {
      continue;
    }

    // Found start of body
    if (line.length > 0 && !inPropertyDrawer) {
      bodyStartIndex = i;
      break;
    }
  }

  const body = lines.slice(bodyStartIndex).join("\n");

  return { metadata, body };
}

// Convert org-mode body to markdown-ish format for rendering
function orgToMarkdown(org: string): string {
  let md = org;

  // Headers
  md = md.replace(/^\*\*\*\*\*\s+(.+)$/gm, "##### $1");
  md = md.replace(/^\*\*\*\*\s+(.+)$/gm, "#### $1");
  md = md.replace(/^\*\*\*\s+(.+)$/gm, "### $1");
  md = md.replace(/^\*\*\s+(.+)$/gm, "## $1");
  md = md.replace(/^\*\s+(.+)$/gm, "# $1");

  // Bold and italic
  md = md.replace(/\*([^\*\n]+)\*/g, "**$1**");
  md = md.replace(/\/([^\/\n]+)\//g, "*$1*");
  md = md.replace(/=([^=\n]+)=/g, "`$1`");
  md = md.replace(/~([^~\n]+)~/g, "`$1`");

  // Links: [[id:xxx][description]] -> [description](note:xxx)
  md = md.replace(/\[\[id:([^\]]+)\]\[([^\]]+)\]\]/g, "[$2](note:$1)");
  // Links: [[id:xxx]] -> [xxx](note:xxx)
  md = md.replace(/\[\[id:([^\]]+)\]\]/g, "[$1](note:$1)");
  // External links: [[url][description]]
  md = md.replace(/\[\[([^\]]+)\]\[([^\]]+)\]\]/g, "[$2]($1)");

  // Lists
  md = md.replace(/^(\s*)-\s+/gm, "$1- ");
  md = md.replace(/^(\s*)\+\s+/gm, "$1- ");

  // Code blocks
  md = md.replace(/^#\+begin_src\s*(\w*)/gim, "```$1");
  md = md.replace(/^#\+end_src/gim, "```");

  // Quote blocks
  md = md.replace(/^#\+begin_quote/gim, ">");
  md = md.replace(/^#\+end_quote/gim, "");

  return md;
}

// Extract links from content
function extractLinks(content: string, isOrg: boolean): string[] {
  const links: string[] = [];

  if (isOrg) {
    // Match [[id:xxx]] patterns
    const idMatches = content.matchAll(/\[\[id:([^\]]+)\](?:\[[^\]]*\])?\]/g);
    for (const match of idMatches) {
      links.push(match[1]);
    }
  } else {
    // Match [[note]] or [text](note:xxx) patterns for markdown
    const noteMatches = content.matchAll(/\[([^\]]+)\]\(note:([^)]+)\)/g);
    for (const match of noteMatches) {
      links.push(match[2]);
    }
  }

  return [...new Set(links)];
}

// Get all note files recursively
function getNoteFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip hidden directories and common non-note dirs
      if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
        files.push(...getNoteFiles(fullPath, baseDir));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      // Include .md, .org for notes and .csv for cards
      if (ext === ".md" || ext === ".org" || ext === ".csv") {
        files.push(fullPath);
      }
    }
  }

  return files;
}

// Parse CSV to HTML table for flashcards
function csvToHtml(csv: string): string {
  const lines = csv.trim().split("\n");
  if (lines.length === 0) return "";

  let html = '<table class="flashcard-table">';

  // Header row
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  html += "<thead><tr>";
  for (const header of headers) {
    html += `<th>${header}</th>`;
  }
  html += "</tr></thead>";

  // Data rows
  html += "<tbody>";
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    html += "<tr>";
    for (const cell of cells) {
      html += `<td>${cell}</td>`;
    }
    html += "</tr>";
  }
  html += "</tbody></table>";

  return html;
}

// Parse a single note file
export async function parseNote(filePath: string): Promise<Note | null> {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const ext = path.extname(filePath).toLowerCase();
    const relativePath = path.relative(NOTES_DIR, filePath);
    const folder = path.dirname(relativePath);
    const slug = relativePath.replace(/\.(md|org|csv)$/i, "").replace(/\\/g, "/");

    // Determine note type based on folder or extension
    const noteType: NoteType = folder === "cards" || ext === ".csv" ? "card" : "note";

    let metadata: Partial<NoteMetadata>;
    let body: string;
    let links: string[];
    let htmlContent: string;

    if (ext === ".csv") {
      // Handle CSV flashcard files
      metadata = {
        id: slug,
        title: path.basename(filePath, ext),
        tags: ["flashcards"],
      };
      body = content;
      links = [];
      htmlContent = csvToHtml(content);
    } else if (ext === ".org") {
      const parsed = parseOrgFile(content, filePath);
      metadata = parsed.metadata;
      body = orgToMarkdown(parsed.body);
      links = extractLinks(content, true);

      // Process markdown to HTML
      const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkMath)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeKatex)
        .use(rehypeStringify, { allowDangerousHtml: true });
      const htmlResult = await processor.process(body);
      htmlContent = String(htmlResult);
    } else {
      const { data, content: mdContent } = matter(content);
      metadata = {
        id: data.id || slug,
        title: data.title || path.basename(filePath, ext),
        tags: data.tags || [],
        status: data.status,
        certainty: data.certainty,
        importance: data.importance,
        start: data.start,
        finish: data.finish,
        preview: data.preview,
      };
      body = mdContent;
      links = extractLinks(mdContent, false);

      // Process markdown to HTML
      const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkMath)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeKatex)
        .use(rehypeStringify, { allowDangerousHtml: true });
      const htmlResult = await processor.process(body);
      htmlContent = String(htmlResult);
    }

    return {
      id: metadata.id || slug,
      title: metadata.title || path.basename(filePath, ext),
      slug,
      folder: folder === "." ? "" : folder,
      tags: metadata.tags || [],
      status: metadata.status,
      certainty: metadata.certainty,
      importance: metadata.importance,
      start: metadata.start,
      finish: metadata.finish,
      preview: metadata.preview,
      links,
      content: body,
      htmlContent,
      noteType,
    };
  } catch (error) {
    console.error(`Error parsing note ${filePath}:`, error);
    return null;
  }
}

// Get all notes
export async function getAllNotes(): Promise<Note[]> {
  const files = getNoteFiles(NOTES_DIR);
  const notes: Note[] = [];

  for (const file of files) {
    const note = await parseNote(file);
    if (note) {
      notes.push(note);
    }
  }

  return notes;
}

// Get note by slug
export async function getNoteBySlug(slug: string): Promise<Note | null> {
  const possiblePaths = [
    path.join(NOTES_DIR, `${slug}.md`),
    path.join(NOTES_DIR, `${slug}.org`),
    path.join(NOTES_DIR, `${slug}.csv`),
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      return parseNote(filePath);
    }
  }

  return null;
}

// Get note by ID
export async function getNoteById(id: string): Promise<Note | null> {
  const files = getNoteFiles(NOTES_DIR);

  for (const file of files) {
    const note = await parseNote(file);
    if (note && note.id === id) {
      return note;
    }
  }

  return null;
}

// Build folder tree
export async function getFolderTree(): Promise<FolderTree> {
  const notes = await getAllNotes();

  const root: FolderTree = {
    name: "Notes",
    path: "",
    children: [],
    notes: [],
  };

  // Create predefined folders in order (even if empty)
  for (const folderName of FOLDER_ORDER) {
    root.children.push({
      name: folderName,
      path: folderName,
      children: [],
      notes: [],
    });
  }

  // Group notes by folder
  const folderMap = new Map<string, NoteMetadata[]>();

  for (const note of notes) {
    const folder = note.folder || "";
    if (!folderMap.has(folder)) {
      folderMap.set(folder, []);
    }
    folderMap.get(folder)!.push({
      id: note.id,
      title: note.title,
      slug: note.slug,
      folder: note.folder,
      tags: note.tags,
      status: note.status,
      certainty: note.certainty,
      importance: note.importance,
      start: note.start,
      finish: note.finish,
      preview: note.preview,
      links: note.links,
      noteType: note.noteType,
    });
  }

  // Build tree structure
  function getOrCreateFolder(parts: string[], current: FolderTree, currentPath: string): FolderTree {
    if (parts.length === 0) {
      return current;
    }

    const [first, ...rest] = parts;
    const newPath = currentPath ? `${currentPath}/${first}` : first;

    let child = current.children.find(c => c.name === first);
    if (!child) {
      child = {
        name: first,
        path: newPath,
        children: [],
        notes: [],
      };
      current.children.push(child);
    }

    return getOrCreateFolder(rest, child, newPath);
  }

  for (const [folder, folderNotes] of folderMap) {
    const parts = folder ? folder.split("/") : [];
    const targetFolder = getOrCreateFolder(parts, root, "");
    targetFolder.notes.push(...folderNotes);
  }

  // Sort notes within folders (keep folder order as defined)
  function sortNotesInTree(tree: FolderTree): void {
    tree.notes.sort((a, b) => a.title.localeCompare(b.title));
    tree.children.forEach(sortNotesInTree);
  }

  sortNotesInTree(root);

  return root;
}

// Build graph data
export interface GraphNode {
  id: string;
  title: string;
  slug: string;
  folder: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export async function getGraphData(): Promise<GraphData> {
  const notes = await getAllNotes();

  const nodeMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  // Create nodes
  for (const note of notes) {
    nodeMap.set(note.id, {
      id: note.id,
      title: note.title,
      slug: note.slug,
      folder: note.folder,
    });
  }

  // Create links
  for (const note of notes) {
    for (const linkId of note.links) {
      if (nodeMap.has(linkId)) {
        links.push({
          source: note.id,
          target: linkId,
        });
      }
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    links,
  };
}
