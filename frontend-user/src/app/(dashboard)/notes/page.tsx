"use client";

import { useState } from "react";

export default function NotesPage() {
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
          <p className="text-gray-600 mt-2">
            Organize and review your medical notes
          </p>
        </div>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
          + Create Note
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
            <option>All Subjects</option>
            <option>Anatomy</option>
            <option>Physiology</option>
            <option>Pharmacology</option>
            <option>Pathology</option>
          </select>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition cursor-pointer"
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {note.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {note.content}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {note.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{note.subject}</span>
              <span>{note.lastModified}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (when no notes) */}
      {notes.length === 0 && (
        <div className="text-center py-16">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No notes yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first note to get started
          </p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
            Create Note
          </button>
        </div>
      )}
    </div>
  );
}
