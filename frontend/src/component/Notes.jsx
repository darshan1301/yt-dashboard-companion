import { useEffect, useState } from "react";
import { PlusCircle, Tag, StickyNote, Search, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { baseUrl as BASE_URL } from "@/config";

export default function Notes({ videoId }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  // 🔹 Fetch notes for specific video
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
        toast.error("Failed to load notes");
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
      toast.error("Error loading notes");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Search notes across all videos
  const searchNotes = async (query) => {
    setSearching(true);
    try {
      const url = query.trim()
        ? `${BASE_URL}/api/notes/${videoId}/notes/search?q=${encodeURIComponent(
            query.trim()
          )}`
        : `${BASE_URL}/api/notes/${videoId}/notes/search`;

      const res = await fetch(url, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      } else {
        console.error("Failed to search notes:", await res.json());
        toast.error("Failed to search notes");
      }
    } catch (err) {
      console.error("Error searching notes:", err);
      toast.error("Error searching notes");
    } finally {
      setSearching(false);
    }
  };

  // 🔹 Handle search input change with debounce
  useEffect(() => {
    if (searchQuery.trim()) {
      const debounceTimer = setTimeout(() => {
        searchNotes(searchQuery);
      }, 500); // 500ms debounce

      return () => clearTimeout(debounceTimer);
    } else if (searchQuery === "") {
      // When search is cleared, fetch video-specific notes
      fetchNotes();
    }
  }, [searchQuery]);

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
        toast.success("Note added successfully");
      } else {
        console.error("Failed to add note:", await res.json());
        toast.error("Failed to add note");
      }
    } catch (err) {
      console.error("Error adding note:", err);
      toast.error("Error adding note");
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Clear search
  const clearSearch = () => {
    setSearchQuery("");
    fetchNotes();
  };

  useEffect(() => {
    if (videoId) fetchNotes();
  }, [videoId]);

  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="w-5 h-5" />
          My Notes
        </CardTitle>
        <CardDescription>
          Keep track of important moments and thoughts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search all notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Search results count */}
        {searchQuery && (
          <div className="mb-4 text-sm text-muted-foreground">
            {searching ? (
              <span>Searching...</span>
            ) : (
              <span>
                Found {notes.length} {notes.length === 1 ? "note" : "notes"} for
                "{searchQuery}"
              </span>
            )}
          </div>
        )}

        {/* Add new note */}
        <div className="flex gap-2 mb-6">
          <Input
            type="text"
            placeholder="Write a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !saving && newNote.trim()) {
                addNote();
              }
            }}
            className="flex-grow"
          />
          <Button
            onClick={addNote}
            disabled={saving || !newNote.trim()}
            size="default">
            <PlusCircle className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Add"}
          </Button>
        </div>

        {/* Notes list */}
        {notes.length > 0 ? (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {notes.map((note) => (
                <Card key={note.id} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="text-sm mb-3 leading-relaxed">{note.text}</p>

                    {/* Tags */}
                    {note.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {note.tags.map((tag, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Metadata */}
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12">
            <StickyNote className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery
                ? `No notes found for "${searchQuery}"`
                : "No notes yet. Add one above!"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
