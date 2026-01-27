import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type StickyNote = {
  id: string;
  title: string;
  content: string;
  color: string;
};

const COLOR_OPTIONS = [
  { label: "Yellow", value: "bg-yellow-200" },
  { label: "Pink", value: "bg-pink-200" },
  { label: "Green", value: "bg-green-200" },
  { label: "Blue", value: "bg-blue-200" },
  { label: "Purple", value: "bg-purple-200" },
];


const COLORS = [
  "bg-yellow-200",
  "bg-pink-200",
  "bg-green-200",
  "bg-blue-200",
  "bg-purple-200",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StickyNotesPanel = ({ open, onOpenChange }: Props) => {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH NOTES ---------------- */
  const fetchNotes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("sticky_notes")
      .select("id, title, content, color")
      .order("created_at", { ascending: false });

    setNotes(data || []);
    setLoading(false);
  };

  useEffect(() => {
  fetchNotes();
}, []);


  /* ---------------- ADD NOTE ---------------- */
  const addNote = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    const { data } = await supabase
      .from("sticky_notes")
      .insert({
  user_id: user.id,
  title: "New Note",
  content: "",
  color,
})

      .select()
      .single();

    if (data) setNotes((prev) => [data, ...prev]);
  };

  /* ---------------- UPDATE NOTE ---------------- */
  const updateNote = async (id: string, content: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, content } : n))
    );

    await supabase.from("sticky_notes").update({ content }).eq("id", id);
  };

  const updateTitle = async (id: string, title: string) => {
  setNotes(prev =>
    prev.map(n => (n.id === id ? { ...n, title } : n))
  );

  await supabase
    .from("sticky_notes")
    .update({ title })
    .eq("id", id);
};


  const updateColor = async (id: string, color: string) => {
  setNotes(prev =>
    prev.map(n => (n.id === id ? { ...n, color } : n))
  );

  await supabase
    .from("sticky_notes")
    .update({ color })
    .eq("id", id);
};


  /* ---------------- DELETE NOTE ---------------- */
  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("sticky_notes").delete().eq("id", id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>📝 Sticky Notes</DialogTitle>
          <Button size="sm" onClick={addNote} className="gap-2">
            <Plus className="h-4 w-4" /> New Note
          </Button>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sticky notes yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <div
  key={note.id}
  className={cn(
    "relative rounded-lg p-4 shadow-md border",
    "text-black placeholder:text-black/60",
    note.color
  )}
  style={{
    transform: "rotate(-1deg)",
  }}
>

                {/* Delete */}
                <button
                  onClick={() => deleteNote(note.id)}
                  className="absolute top-2 right-2 opacity-70 hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>

                {/* Color Picker */}
<div className="flex gap-1 mb-2">
  {COLOR_OPTIONS.map(c => (
    <button
      key={c.value}
      onClick={() => updateColor(note.id, c.value)}
      className={cn(
        "h-5 w-5 rounded-full border",
        c.value,
        note.color === c.value && "ring-2 ring-black"
      )}
    />
  ))}
</div>

{/* Title */}
<input
  value={note.title}
  placeholder="Title"
  onChange={(e) => updateTitle(note.id, e.target.value)}
  className="
    w-full bg-transparent font-semibold text-sm mb-2
    border-none outline-none
    text-black placeholder:text-black/60
  "
/>


{/* Content */}
<Textarea
  value={note.content}
  placeholder="Write something…"
  onChange={(e) => updateNote(note.id, e.target.value)}
  className="
    bg-transparent border-none resize-none
    focus-visible:ring-0 focus-visible:ring-offset-0
    text-sm min-h-[120px]
    text-black placeholder:text-black/60
  "
/>


              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StickyNotesPanel;
