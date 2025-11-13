import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  NumberedListIcon,
  LinkIcon,
  PhotoIcon,
  CodeBracketIcon,
  H1Icon,
  H2Icon,
  QuoteIcon,
} from '@heroicons/react/24/outline';

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Start typing...',
  minHeight = '200px',
  maxHeight = '500px',
  showToolbar = true,
  enableImages = true,
  enableCode = true,
  className = ''
}) {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      updateFormatState();
    }
  };

  const updateFormatState = () => {
    setSelectedFormat({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    });
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateFormatState();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const formatHeading = (level) => {
    execCommand('formatBlock', `h${level}`);
  };

  const toolbarButtons = [
    { command: 'bold', icon: 'B', label: 'Bold', active: selectedFormat.bold },
    { command: 'italic', icon: 'I', label: 'Italic', active: selectedFormat.italic },
    { command: 'underline', icon: 'U', label: 'Underline', active: selectedFormat.underline },
    { command: 'separator' },
    { command: 'formatBlock', value: 'h2', icon: 'H1', label: 'Heading 1' },
    { command: 'formatBlock', value: 'h3', icon: 'H2', label: 'Heading 2' },
    { command: 'separator' },
    { command: 'insertUnorderedList', icon: '•', label: 'Bullet List' },
    { command: 'insertOrderedList', icon: '1.', label: 'Numbered List' },
    { command: 'separator' },
    { command: 'formatBlock', value: 'blockquote', icon: '"', label: 'Quote' },
  ];

  if (enableCode) {
    toolbarButtons.push({ command: 'formatBlock', value: 'pre', icon: '<>', label: 'Code' });
  }

  toolbarButtons.push({ command: 'separator' });
  toolbarButtons.push({ command: 'createLink', icon: '🔗', label: 'Insert Link', onClick: insertLink });
  
  if (enableImages) {
    toolbarButtons.push({ command: 'insertImage', icon: '🖼', label: 'Insert Image', onClick: insertImage });
  }

  return (
    <div className={`border rounded-lg ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'} ${className}`}>
      {showToolbar && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
          {toolbarButtons.map((button, index) => {
            if (button.command === 'separator') {
              return (
                <div
                  key={`separator-${index}`}
                  className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"
                />
              );
            }

            return (
              <button
                key={button.command + index}
                type="button"
                onClick={() => {
                  if (button.onClick) {
                    button.onClick();
                  } else if (button.value) {
                    execCommand(button.command, button.value);
                  } else {
                    execCommand(button.command);
                  }
                }}
                className={`px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-semibold text-sm ${
                  button.active
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                title={button.label}
              >
                {button.icon}
              </button>
            );
          })}
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="p-4 outline-none overflow-y-auto prose dark:prose-invert max-w-none"
        style={{ minHeight, maxHeight }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contentEditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
        
        [contentEditable] h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        
        [contentEditable] h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        
        [contentEditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          color: #6b7280;
          font-style: italic;
        }
        
        [contentEditable] pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
        }
        
        [contentEditable] ul, [contentEditable] ol {
          padding-left: 2em;
          margin: 0.5em 0;
        }
        
        [contentEditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        [contentEditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5em;
          margin: 0.5em 0;
        }
      `}</style>
    </div>
  );
}

// Markdown support version
export function MarkdownEditor({ value, onChange, placeholder, minHeight, maxHeight }) {
  const [preview, setPreview] = useState(false);
  const [content, setContent] = useState(value || '');

  useEffect(() => {
    setContent(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setContent(newValue);
    onChange(newValue);
  };

  const insertMarkdown = (syntax, placeholder = '') => {
    const textarea = document.getElementById('markdown-editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;
    
    let newText;
    if (syntax === 'link') {
      newText = `[${selectedText}](url)`;
    } else if (syntax === 'image') {
      newText = `![${selectedText}](image-url)`;
    } else if (syntax === 'code-block') {
      newText = `\`\`\`\n${selectedText}\n\`\`\``;
    } else {
      newText = `${syntax}${selectedText}${syntax}`;
    }
    
    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);
    onChange(newContent);
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg">
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => insertMarkdown('**', 'bold')}
            className="px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 font-bold"
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('*', 'italic')}
            className="px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 italic"
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('`', 'code')}
            className="px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 font-mono"
            title="Code"
          >
            {'<>'}
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('link')}
            className="px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Link"
          >
            🔗
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('image')}
            className="px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Image"
          >
            🖼
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('code-block')}
            className="px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Code Block"
          >
            {'</>'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={`px-3 py-1.5 rounded text-sm ${!preview ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={`px-3 py-1.5 rounded text-sm ${preview ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            Preview
          </button>
        </div>
      </div>

      {preview ? (
        <div 
          className="p-4 prose dark:prose-invert max-w-none"
          style={{ minHeight, maxHeight, overflowY: 'auto' }}
          dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(content) }}
        />
      ) : (
        <textarea
          id="markdown-editor"
          value={content}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full p-4 outline-none resize-none bg-transparent text-gray-900 dark:text-white"
          style={{ minHeight, maxHeight }}
        />
      )}
    </div>
  );
}

// Simple markdown to HTML converter (for preview)
function convertMarkdownToHTML(markdown) {
  if (!markdown) return '';
  
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Code
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>')
    // Images
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" />')
    // Line breaks
    .replace(/\n/gim, '<br />');
  
  return html;
}

// Simple text editor (fallback)
export function SimpleTextEditor({ value, onChange, placeholder, minHeight = '150px', maxHeight = '400px', className = '' }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${className}`}
      style={{ minHeight, maxHeight }}
    />
  );
}
