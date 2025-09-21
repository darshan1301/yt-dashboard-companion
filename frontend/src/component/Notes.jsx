import { useEffect, useState } from "react";
import { baseUrl as BASE_URL } from "../config";
import { PlusCircle, Tag } from "lucide-react";

export default function Notes({ videoId }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔹 Fetch notes
  const fetchNotes = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/notes/${videoId}/notes`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      } else {
        console.error("Failed to fetch notes:", await res.json());
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  };

  console.log(notes);

  // 🔹 Add new note
  const addNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/notes/${videoId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: newNote }),
      });
      if (res.ok) {
        const created = await res.json();
        setNotes((prev) => [created.note, ...prev]);
        setNewNote("");
      } else {
        console.error("Failed to add note:", await res.json());
      }
    } catch (err) {
      console.error("Error adding note:", err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (videoId) fetchNotes();
  }, [videoId]);

  if (loading) {
    return <p className="text-gray-600">Loading notes...</p>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h2 className="text-lg font-semibold mb-4">My Notes</h2>

      {/* Add new note */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Write a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="flex-grow border rounded px-3 py-2"
        />
        <button
          onClick={addNote}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50">
          <PlusCircle className="w-4 h-4" />
          {saving ? "Saving..." : "Add"}
        </button>
      </div>

      {/* Notes list */}
      {notes.length > 0 ? (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="p-4 border rounded bg-gray-50 text-gray-800">
              <p className="mb-2">{note.text}</p>

              {/* Tags */}
              {note.tags?.length > 0 && (
                <div className="flex gap-2 mb-2">
                  {note.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Metadata */}
              <p className="text-xs text-gray-500">
                Created {new Date(note.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No notes yet. Add one above!</p>
      )}
    </div>
  );
}
