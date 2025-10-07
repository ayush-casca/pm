'use client';

import { useState, useRef, useEffect } from 'react';
import { CloudArrowUpIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TranscriptUploadProps {
  onUpload: (name: string, content: string) => void;
  isLoading: boolean;
}

export function TranscriptUpload({ onUpload, isLoading }: TranscriptUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [wasLoading, setWasLoading] = useState(false);

  // Clear form when upload completes successfully
  useEffect(() => {
    if (wasLoading && !isLoading) {
      // Upload completed successfully
      setName('');
      setContent('');
      setShowForm(false);
    }
    setWasLoading(isLoading);
  }, [isLoading, wasLoading]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      alert('Please upload a text file (.txt)');
      return;
    }

    try {
      const text = await file.text();
      setName(file.name.replace('.txt', ''));
      setContent(text);
      setShowForm(true);
    } catch (error) {
      alert('Error reading file');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    
    onUpload(name.trim(), content.trim());
    // Don't clear form immediately - let the parent handle success state
  };

  const handleCancel = () => {
    setName('');
    setContent('');
    setShowForm(false);
  };

  if (showForm) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload Transcript</h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transcript Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              placeholder="e.g., Weekly Team Meeting - Jan 15"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              placeholder="Paste or edit transcript content here..."
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              {content.length} characters
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim() || !content.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Upload & Analyze'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Text Input */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Upload</h3>
        <button
          onClick={() => setShowForm(true)}
          className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-500 hover:text-gray-700 transition-colors"
        >
          Click to paste transcript text...
        </button>
      </div>

      {/* File Upload Area */}
      <div
        className={`relative bg-white rounded-lg border-2 border-dashed transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mb-4" />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop transcript file here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse for a .txt file
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              Choose File
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center">
        Upload meeting transcripts to automatically generate tickets with AI analysis
      </div>
    </div>
  );
}
