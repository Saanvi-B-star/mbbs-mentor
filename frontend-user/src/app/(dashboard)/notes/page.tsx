"use client";

import { useState, useEffect } from "react";
import { Plus, Search, BookOpen, Clock, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { UploadNoteDialog } from "@/components/notes/UploadNoteDialog";
import ReactMarkdown from "react-markdown";
import Mermaid from "@/components/common/Mermaid";

export default function NotesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const [notes, setNotes] = useState<any[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/notes');
      setNotes(res.data?.data?.notes || res.data?.notes || res.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await apiClient.delete(`/notes/${noteId}`);
        setNotes(notes.filter(note => note.id !== noteId));
      } catch (error) {
        console.error("Failed to delete note:", error);
        alert("Failed to delete note. Please try again.");
      }
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const subjects = [
    { value: "all", label: "All Subjects" },
    { value: "anatomy", label: "Anatomy" },
    { value: "physiology", label: "Physiology" },
    { value: "pharmacology", label: "Pharmacology" },
    { value: "pathology", label: "Pathology" },
  ];

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = (note.title || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === "all" ||
      (note.subject && note.subject.toLowerCase() === selectedSubject);
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">📝 My Notes</h1>
          <p className="text-gray-600 mt-2">
            Organize and review your medical notes
          </p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-6 py-2 h-auto">
          <Plus className="h-4 w-4" />
          Upload Note
        </Button>
      </div>

      {isUploadOpen && (
        <UploadNoteDialog
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => {
            setIsUploadOpen(false);
            fetchNotes();
          }}
        />
      )}

      {/* Search and Filters */}
      <Card className="shadow-sm border-gray-200 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-900 font-medium hover:border-gray-400 transition-colors"
            >
              {subjects.map((subject) => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading your notes...</p>
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              onClick={() => {
                if (note.processingStatus !== 'PENDING' && note.processingStatus !== 'PROCESSING') {
                  setSelectedNote(note);
                }
              }}
              className={`shadow-sm border-gray-200 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group overflow-hidden ${note.processingStatus === 'PENDING' || note.processingStatus === 'PROCESSING' ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <CardHeader className="pb-3 bg-gradient-to-br from-blue-50 to-transparent">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    {note.processingStatus === 'PENDING' || note.processingStatus === 'PROCESSING' ? (
                      <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  {note.subject && (
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium rounded-full"
                    >
                      {note.subject}
                    </Badge>
                  )}
                  {(note.processingStatus === 'PENDING' || note.processingStatus === 'PROCESSING') && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs shrink-0">
                      Processing AI...
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {note.title || "Untitled Note"}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {note.content || note.summary || "No extracted content available yet."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {note.tags && Array.isArray(note.tags) && note.tags.map((tag: string, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="rounded-full px-3 py-1 text-xs font-medium border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                  <span className="font-medium">{note.subject || "General"}</span>
                  <div className="flex items-center gap-2">
                    <span>{new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={(e) => deleteNote(note.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-6">
          <div className="h-20 w-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <BookOpen className="h-10 w-10 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No notes yet
          </h3>
          <p className="text-gray-600 mb-8 max-w-sm mx-auto">
            Create your first note to start organizing your medical studies
          </p>
          <Button onClick={() => setIsUploadOpen(true)} className="gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-6 py-2 h-auto">
            <Plus className="h-4 w-4" />
            Upload Your First Note
          </Button>
        </div>
      )}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSelectedNote(null)}>
          <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedNote.title || "Untitled Note"}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{selectedNote.subject || "General"}</Badge>
                  <span className="text-xs text-gray-500">{new Date(selectedNote.updatedAt || selectedNote.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button onClick={() => setSelectedNote(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
              <div className="space-y-6">
                {selectedNote.summary && (
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-semibold text-lg text-blue-800 mb-3 flex items-center gap-2">
                      <span className="text-xl">✨</span> AI Summary
                    </h3>
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:text-gray-700 prose-headings:text-blue-900 prose-headings:font-bold prose-ul:my-2 prose-li:my-0">
                      <ReactMarkdown>{selectedNote.summary}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {selectedNote.formattedNotes && (
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-semibold text-lg text-green-800 mb-3 flex items-center gap-2">
                      <span className="text-xl">📄</span> AI Formatted Notes
                    </h3>
                    <div className="prose prose-blue max-w-none text-gray-700">
                      <ReactMarkdown
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || "");
                            if (!inline && match && match[1] === "mermaid") {
                              return <Mermaid chart={String(children).replace(/\n$/, "")} />;
                            }
                            return (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {selectedNote.formattedNotes}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <h3 className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-gray-500" /> Original Extracted Text
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs text-gray-600 whitespace-pre-wrap max-h-60 overflow-y-auto border border-gray-100">
                    {selectedNote.extractedText || selectedNote.content || "No extracted content"}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {selectedNote.tags && Array.isArray(selectedNote.tags) && selectedNote.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-blue-600 border-blue-200">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}