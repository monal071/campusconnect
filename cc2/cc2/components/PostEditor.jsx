import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ImageIcon from '@mui/icons-material/Image';
import LinkIcon from '@mui/icons-material/Link';
import CloseIcon from '@mui/icons-material/Close';

export default function PostEditor({ onSubmit, loading }) {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) return;

    const formData = new FormData();
    formData.append('content', content);
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    await onSubmit(formData);
    setContent('');
    setSelectedImage(null);
    setImagePreview('');
  };

  const formatText = (format) => {
    const textarea = document.getElementById('post-content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'list':
        formattedText = `\n- ${selectedText}`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      default:
        return;
    }

    setContent(
      content.substring(0, start) + formattedText + content.substring(end)
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1D1D1D] rounded-xl p-4 shadow-lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => formatText('bold')}
            className="p-2 rounded hover:bg-[#2D2D2D] text-gray-400 hover:text-white transition-colors"
          >
            <FormatBoldIcon />
          </button>
          <button
            type="button"
            onClick={() => formatText('italic')}
            className="p-2 rounded hover:bg-[#2D2D2D] text-gray-400 hover:text-white transition-colors"
          >
            <FormatItalicIcon />
          </button>
          <button
            type="button"
            onClick={() => formatText('list')}
            className="p-2 rounded hover:bg-[#2D2D2D] text-gray-400 hover:text-white transition-colors"
          >
            <FormatListBulletedIcon />
          </button>
          <button
            type="button"
            onClick={() => formatText('link')}
            className="p-2 rounded hover:bg-[#2D2D2D] text-gray-400 hover:text-white transition-colors"
          >
            <LinkIcon />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded hover:bg-[#2D2D2D] text-gray-400 hover:text-white transition-colors"
          >
            <ImageIcon />
          </button>
        </div>

        <textarea
          id="post-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts..."
          className="w-full bg-[#2D2D2D] rounded-lg p-3 text-white placeholder-gray-400 min-h-[120px] resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />

        {imagePreview && (
          <div className="relative mt-3">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-48 rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                setImagePreview('');
              }}
              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={loading || (!content.trim() && !selectedImage)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </motion.div>
  );
} 