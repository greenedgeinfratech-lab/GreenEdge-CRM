'use client';

import React, { useState } from 'react';
import { AlignLeft, Send, Pin, Trash2, Edit2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/providers/ConfirmProvider';

interface NotesCardProps {
  notes: any[];
  onAddNote: (text: string) => void;
  onUpdateNote: (id: string, text: string, pinned: boolean) => void;
  onDeleteNote: (id: string) => void;
}

export default function NotesCard({ notes, onAddNote, onUpdateNote, onDeleteNote }: NotesCardProps) {
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const { confirm } = useConfirm();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(newNote.trim());
    setNewNote('');
  };

  const handleEdit = (note: any) => {
    setEditingId(note.id);
    setEditNoteText(note.text);
  };

  const saveEdit = (id: string, pinned: boolean) => {
    if (!editNoteText.trim()) return;
    onUpdateNote(id, editNoteText.trim(), pinned);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      message: 'Are you sure you want to delete this note?',
      confirmText: 'Delete',
      variant: 'destructive',
    });
    if (isConfirmed) {
      onDeleteNote(id);
    }
  };

  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} at ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-100 flex flex-col h-[500px]">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center">
          <AlignLeft className="w-4 h-4 mr-2 text-[#f97316]" />
          Notes
        </h2>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
        {notes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <AlignLeft className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-500 font-medium">No notes yet</p>
            <p className="text-xs text-gray-400 mt-1">Add details, instructions, or internal comments.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className={`border rounded-md p-3 relative ${note.pinned ? 'bg-orange-50/50 border-orange-200' : 'bg-white border-gray-200'}`}>
                {note.pinned && (
                  <Pin className="w-3.5 h-3.5 text-orange-500 absolute top-3 right-3 transform rotate-45" />
                )}
                
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#f97316] bg-white"
                      rows={3}
                      value={editNoteText}
                      onChange={(e) => setEditNoteText(e.target.value)}
                      autoFocus
                    />
                    <div className="flex space-x-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-7 text-xs">Cancel</Button>
                      <Button size="sm" onClick={() => saveEdit(note.id, note.pinned)} className="h-7 text-xs bg-[#f97316] hover:bg-[#ea580c] text-white">Save</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed pr-6">
                      {note.text}
                    </p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100/50">
                      <div className="flex items-center text-[10px] text-gray-400 font-medium">
                        <User className="w-3 h-3 mr-1" />
                        {note.created_by_name || 'User'} • {formatDateTime(note.created_at)}
                      </div>
                      <div className="flex space-x-1">
                        <button onClick={() => onUpdateNote(note.id, note.text, !note.pinned)} className={`p-1.5 rounded hover:bg-gray-100 ${note.pinned ? 'text-orange-500' : 'text-gray-400'}`} title={note.pinned ? "Unpin" : "Pin"}>
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleEdit(note)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(note.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-100 bg-white">
        <form onSubmit={handleAdd} className="relative flex items-end">
          <textarea
            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] text-sm resize-none"
            rows={1}
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => {
              setNewNote(e.target.value);
              // Auto-expand textarea
              e.target.style.height = 'auto';
              e.target.style.height = (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAdd(e);
                e.currentTarget.style.height = 'auto';
              }
            }}
          />
          <button 
            type="submit" 
            disabled={!newNote.trim()}
            className="absolute right-2 bottom-1.5 p-1.5 rounded-md text-white bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
