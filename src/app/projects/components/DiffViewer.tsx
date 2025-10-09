'use client';

import { useState } from 'react';
import { DocumentTextIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DiffViewerProps {
  diff: string;
}

export default function DiffViewer({ diff }: DiffViewerProps) {
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set());

  // Parse the diff into files
  const parseGitDiff = (diffText: string) => {
    const lines = diffText.split('\n');
    const files: Array<{
      filename: string;
      oldFile: string;
      newFile: string;
      chunks: Array<{
        header: string;
        lines: Array<{
          type: 'context' | 'add' | 'remove' | 'header';
          content: string;
          oldLineNumber?: number;
          newLineNumber?: number;
        }>;
      }>;
    }> = [];

    let currentFile: any = null;
    let currentChunk: any = null;
    let oldLineNum = 0;
    let newLineNum = 0;

    for (const line of lines) {
      // File header: diff --git a/file b/file
      if (line.startsWith('diff --git')) {
        // Finish the previous file
        if (currentFile) {
          if (currentChunk) currentFile.chunks.push(currentChunk);
          files.push(currentFile);
        }
        
        const match = line.match(/diff --git a\/(.*?) b\/(.*)/);
        currentFile = {
          filename: match?.[2] || 'unknown',
          oldFile: match?.[1] || 'unknown',
          newFile: match?.[2] || 'unknown',
          chunks: []
        };
        currentChunk = null;
      }
      // Chunk header: @@ -oldStart,oldCount +newStart,newCount @@
      else if (line.startsWith('@@')) {
        if (currentFile) {
          if (currentChunk) currentFile.chunks.push(currentChunk);
          currentChunk = {
            header: line,
            lines: []
          };
          // Parse line numbers
          const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
          if (match) {
            oldLineNum = parseInt(match[1]);
            newLineNum = parseInt(match[2]);
          }
        }
      }
      // Skip file mode, index, etc.
      else if (line.startsWith('index ') || line.startsWith('---') || line.startsWith('+++') || 
               line.startsWith('new file mode') || line.startsWith('deleted file mode') ||
               line.startsWith('similarity index') || line.startsWith('rename from') || line.startsWith('rename to')) {
        continue;
      }
      // Content lines
      else if (currentChunk) {
        if (line.startsWith('+')) {
          currentChunk.lines.push({
            type: 'add',
            content: line.slice(1),
            newLineNumber: newLineNum++
          });
        } else if (line.startsWith('-')) {
          currentChunk.lines.push({
            type: 'remove',
            content: line.slice(1),
            oldLineNumber: oldLineNum++
          });
        } else if (line.startsWith(' ') || line === '') {
          currentChunk.lines.push({
            type: 'context',
            content: line.slice(1),
            oldLineNumber: oldLineNum++,
            newLineNumber: newLineNum++
          });
        }
      }
    }

    if (currentChunk && currentFile) {
      currentFile.chunks.push(currentChunk);
    }
    if (currentFile) {
      // For new files without explicit chunks, create a single chunk with all content
      if (currentFile.chunks.length === 0) {
        const lines = diffText.split('\n');
        let inFileContent = false;
        let fileLines: any[] = [];
        let lineNum = 1;
        
        for (const line of lines) {
          if (line.startsWith(`diff --git a/${currentFile.filename}`)) {
            inFileContent = true;
            continue;
          }
          if (inFileContent && line.startsWith('diff --git')) {
            break; // Next file started
          }
          if (inFileContent && (line.startsWith('+') && !line.startsWith('+++'))) {
            fileLines.push({
              type: 'add',
              content: line.slice(1),
              newLineNumber: lineNum++
            });
          }
        }
        
        if (fileLines.length > 0) {
          currentFile.chunks.push({
            header: `@@ -0,0 +1,${fileLines.length} @@ New file`,
            lines: fileLines
          });
        }
      }
      files.push(currentFile);
    }

    return files;
  };

  const files = parseGitDiff(diff);

  const toggleFileExpansion = (fileIndex: number) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileIndex)) {
      newExpanded.delete(fileIndex);
    } else {
      newExpanded.add(fileIndex);
    }
    setExpandedFiles(newExpanded);
  };

  // Expand all files by default if there's only one file, or if there are multiple files, start with them collapsed
  if (expandedFiles.size === 0 && files.length > 0) {
    if (files.length === 1) {
      setExpandedFiles(new Set([0]));
    }
  }

  if (files.length === 0) {
    return (
      <div className="p-4">
        <pre className="text-sm font-mono bg-gray-100 p-4 rounded overflow-x-auto whitespace-pre-wrap">
          {diff}
        </pre>
      </div>
    );
  }

  return (
    <div>
      {/* Controls for multiple files */}
      {files.length > 1 && (
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {files.length} files changed
          </span>
          <div className="space-x-2">
            <button
              onClick={() => setExpandedFiles(new Set(files.map((_, i) => i)))}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Expand All
            </button>
            <button
              onClick={() => setExpandedFiles(new Set())}
              className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Collapse All
            </button>
          </div>
        </div>
      )}
      
      <div className="divide-y divide-gray-200">
        {files.map((file, fileIndex) => (
        <div key={fileIndex} className="bg-white">
          {/* File Header */}
          <div 
            className="bg-gray-100 border-b px-4 py-2 text-sm font-mono cursor-pointer hover:bg-gray-200"
            onClick={() => toggleFileExpansion(fileIndex)}
          >
            <div className="flex items-center space-x-2">
              {expandedFiles.has(fileIndex) ? (
                <ChevronDownIcon className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
              )}
              <DocumentTextIcon className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">{file.filename}</span>
              <span className="text-xs text-gray-500 ml-auto">
                {file.chunks.length} chunk{file.chunks.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* File Content - Split View */}
          {expandedFiles.has(fileIndex) && (
            file.chunks.map((chunk, chunkIndex) => (
            <div key={chunkIndex}>
              {/* Chunk Header */}
              <div className="bg-blue-50 px-4 py-1 text-xs font-mono text-blue-800 border-y border-blue-200">
                {chunk.header}
              </div>

              {/* Split View Container */}
              <div className="flex font-mono text-sm">
                {/* Left Side - Removed Lines */}
                <div className="w-1/2 border-r border-gray-300">
                  {chunk.lines.map((line, lineIndex) => {
                    if (line.type === 'remove') {
                      return (
                        <div key={lineIndex} className="flex bg-red-50">
                          <div className="w-12 px-2 py-1 text-right text-xs text-gray-500 bg-gray-100 border-r select-none">
                            {line.oldLineNumber}
                          </div>
                          <div className="w-4 text-center text-xs text-red-600 bg-red-100">-</div>
                          <div className="flex-1 px-2 py-1 whitespace-pre overflow-x-auto">
                            {line.content.length > 200 ? (
                              <div>
                                <span className="text-red-800">
                                  {expandedLines.has(`remove-${fileIndex}-${chunkIndex}-${lineIndex}`) 
                                    ? line.content 
                                    : `${line.content.substring(0, 200)}`
                                  }
                                </span>
                                {!expandedLines.has(`remove-${fileIndex}-${chunkIndex}-${lineIndex}`) && (
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedLines);
                                      newExpanded.add(`remove-${fileIndex}-${chunkIndex}-${lineIndex}`);
                                      setExpandedLines(newExpanded);
                                    }}
                                    className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    ... show more
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-red-800">{line.content}</span>
                            )}
                          </div>
                        </div>
                      );
                    } else if (line.type === 'context') {
                      return (
                        <div key={lineIndex} className="flex bg-white">
                          <div className="w-12 px-2 py-1 text-right text-xs text-gray-500 bg-gray-100 border-r select-none">
                            {line.oldLineNumber}
                          </div>
                          <div className="w-4 bg-white"></div>
                          <div className="flex-1 px-2 py-1 whitespace-pre overflow-x-auto">
                            {line.content.length > 200 ? (
                              <div>
                                <span className="text-gray-700">
                                  {expandedLines.has(`context-left-${fileIndex}-${chunkIndex}-${lineIndex}`) 
                                    ? line.content 
                                    : `${line.content.substring(0, 200)}`
                                  }
                                </span>
                                {!expandedLines.has(`context-left-${fileIndex}-${chunkIndex}-${lineIndex}`) && (
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedLines);
                                      newExpanded.add(`context-left-${fileIndex}-${chunkIndex}-${lineIndex}`);
                                      newExpanded.add(`context-right-${fileIndex}-${chunkIndex}-${lineIndex}`);
                                      setExpandedLines(newExpanded);
                                    }}
                                    className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    ... show more
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-700">{line.content}</span>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      // Add lines - show empty space on left
                      return (
                        <div key={lineIndex} className="flex bg-gray-50">
                          <div className="w-12 px-2 py-1 text-right text-xs text-gray-400 bg-gray-100 border-r select-none">
                          </div>
                          <div className="w-4 bg-gray-50"></div>
                          <div className="flex-1 px-2 py-1">
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>

                {/* Right Side - Added Lines */}
                <div className="w-1/2">
                  {chunk.lines.map((line, lineIndex) => {
                    if (line.type === 'add') {
                      return (
                        <div key={lineIndex} className="flex bg-green-50">
                          <div className="w-12 px-2 py-1 text-right text-xs text-gray-500 bg-gray-100 border-r select-none">
                            {line.newLineNumber}
                          </div>
                          <div className="w-4 text-center text-xs text-green-600 bg-green-100">+</div>
                          <div className="flex-1 px-2 py-1 whitespace-pre overflow-x-auto">
                            {line.content.length > 200 ? (
                              <div>
                                <span className="text-green-800">
                                  {expandedLines.has(`add-${fileIndex}-${chunkIndex}-${lineIndex}`) 
                                    ? line.content 
                                    : `${line.content.substring(0, 200)}`
                                  }
                                </span>
                                {!expandedLines.has(`add-${fileIndex}-${chunkIndex}-${lineIndex}`) && (
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedLines);
                                      newExpanded.add(`add-${fileIndex}-${chunkIndex}-${lineIndex}`);
                                      setExpandedLines(newExpanded);
                                    }}
                                    className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    ... show more
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-green-800">{line.content}</span>
                            )}
                          </div>
                        </div>
                      );
                    } else if (line.type === 'context') {
                      return (
                        <div key={lineIndex} className="flex bg-white">
                          <div className="w-12 px-2 py-1 text-right text-xs text-gray-500 bg-gray-100 border-r select-none">
                            {line.newLineNumber}
                          </div>
                          <div className="w-4 bg-white"></div>
                          <div className="flex-1 px-2 py-1 whitespace-pre overflow-x-auto">
                            {line.content.length > 200 ? (
                              <div>
                                <span className="text-gray-700">
                                  {expandedLines.has(`context-right-${fileIndex}-${chunkIndex}-${lineIndex}`) 
                                    ? line.content 
                                    : `${line.content.substring(0, 200)}`
                                  }
                                </span>
                                {!expandedLines.has(`context-right-${fileIndex}-${chunkIndex}-${lineIndex}`) && (
                                  <span className="ml-2 text-xs text-gray-400">
                                    ...
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-700">{line.content}</span>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      // Remove lines - show empty space on right
                      return (
                        <div key={lineIndex} className="flex bg-gray-50">
                          <div className="w-12 px-2 py-1 text-right text-xs text-gray-400 bg-gray-100 border-r select-none">
                          </div>
                          <div className="w-4 bg-gray-50"></div>
                          <div className="flex-1 px-2 py-1">
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      ))}
      </div>
    </div>
  );
}
