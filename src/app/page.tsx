import { getAllNotes, getFolderTree, getGraphData, type Note } from "@/lib/notes";
import { NotesApp } from "@/components/NotesApp";

export default async function Home() {
  const [notes, folderTree, graphData] = await Promise.all([
    getAllNotes(),
    getFolderTree(),
    getGraphData(),
  ]);

  // Create a map of notes by slug and by ID for quick lookup
  const notesMap: Record<string, Note> = {};
  for (const note of notes) {
    notesMap[note.slug] = note;
    // Also index by ID if different from slug
    if (note.id !== note.slug) {
      notesMap[note.id] = note;
    }
  }

  return <NotesApp folderTree={folderTree} graphData={graphData} notesMap={notesMap} />;
}
