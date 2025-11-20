"use client";

import { useState } from "react";
import { Plus, Search, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function NotesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const notes = [
    {
      id: 1,
      title: "Cardiovascular System Overview",
      subject: "Anatomy",
      content: "Heart anatomy, blood circulation, major vessels...",
      lastModified: "2 days ago",
      tags: ["Anatomy", "Cardiovascular"],
    },
    {
      id: 2,
      title: "Pharmacology: Drug Classification",
      subject: "Pharmacology",
      content: "Categories of drugs, mechanisms of action...",
      lastModified: "3 days ago",
      tags: ["Pharmacology", "Drugs"],
    },
    {
      id: 3,
      title: "Nervous System Functions",
      subject: "Physiology",
      content: "CNS and PNS, neuron structure, synaptic transmission...",
      lastModified: "5 days ago",
      tags: ["Physiology", "Nervous System"],
    },
    {
      id: 4,
      title: "Respiratory System",
      subject: "Anatomy",
      content: "Lungs, airways, gas exchange mechanisms...",
      lastModified: "1 week ago",
      tags: ["Anatomy", "Respiratory"],
    },
  ];

  const subjects = [
    { value: "all", label: "All Subjects" },
    { value: "anatomy", label: "Anatomy" },
    { value: "physiology", label: "Physiology" },
    { value: "pharmacology", label: "Pharmacology" },
    { value: "pathology", label: "Pathology" },
  ];

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === "all" ||
      note.subject.toLowerCase() === selectedSubject;
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
        <Button className="gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-6 py-2 h-auto">
          <Plus className="h-4 w-4" />
          Create Note
        </Button>
      </div>

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
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="shadow-sm border-gray-200 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group overflow-hidden"
            >
              <CardHeader className="pb-3 bg-gradient-to-br from-blue-50 to-transparent">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium rounded-full"
                  >
                    {note.subject}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {note.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {note.content}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag, index) => (
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
                  <span className="font-medium">{note.subject}</span>
                  <span>{note.lastModified}</span>
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
          <Button className="gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-6 py-2 h-auto">
            <Plus className="h-4 w-4" />
            Create Your First Note
          </Button>
        </div>
      )}
    </div>
  );
}