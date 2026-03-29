'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send } from 'lucide-react';

interface Note {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
}

interface UserNotesTabProps {
  notes: Note[];
  onAddNote: (content: string) => Promise<void>;
}

export function UserNotesTab({ notes, onAddNote }: UserNotesTabProps) {
  const [newNote, setNewNote] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!newNote.trim()) return;
    setIsSending(true);
    try {
      await onAddNote(newNote.trim());
      setNewNote('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Note Form */}
      <div className="flex gap-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add an internal note about this user..."
          rows={2}
          className="flex-1"
        />
        <Button
          onClick={handleSubmit}
          disabled={isSending || !newNote.trim()}
          size="icon"
          className="self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-3">
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(note.created_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
