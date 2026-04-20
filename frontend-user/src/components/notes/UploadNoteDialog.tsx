"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileType, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";

interface UploadNoteDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadNoteDialog({ onClose, onSuccess }: UploadNoteDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => setFile(null);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    if (!title.trim()) {
      setError("Please provide a title for your note.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      
      const tagsArray = tags.split(",").map(t => t.trim()).filter(Boolean);
      if (tagsArray.length > 0) {
        formData.append("tags", tagsArray.join(","));
      }

      await apiClient.post("/notes/upload", formData);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || err.message || "Failed to upload note.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Upload Note</h2>
            <button
              onClick={onClose}
              disabled={isUploading}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50/50 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Click or drag file here</h3>
                <p className="text-xs text-gray-500">Supports PDF, PNG, JPG up to 10MB</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center p-3 border border-gray-200 rounded-xl bg-gray-50">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 shrink-0">
                    <FileType className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  {!isUploading && (
                    <button onClick={clearFile} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <Input
                      placeholder="e.g. Systemic Pathology Summary"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isUploading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                    <Input
                      placeholder="e.g. Pathology, Exam Prep"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading} className="bg-blue-600 hover:bg-blue-700">
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing AI...
              </>
            ) : (
              "Upload and Extract"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
