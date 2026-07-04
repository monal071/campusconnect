import { useState } from "react";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import { useUploadThing } from "../utils/uploadthing";
import { CircularProgress } from "@mui/material";

const PostForm = ({ onSubmit, isGuest, guestName, setGuestName }) => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [tempName, setTempName] = useState("");

  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      if (res) {
        setImages((prev) => [...prev, ...res.map((r) => r.url)]);
      }
      setIsSubmitting(false); // Reset loading state here if we uploaded first
    },
    onUploadError: (error) => {
      alert(`Error uploading image: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const [pendingFiles, setPendingFiles] = useState([]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length + pendingFiles.length > 4) {
      alert("You can only upload up to 4 images per post");
      return;
    }

    // Add local blob preview for immediate UI feedback
    const newPendingFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setPendingFiles(prev => [...prev, ...newPendingFiles]);

    // Reset input
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };
  
  const removePendingFile = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!content.trim() && images.length === 0 && pendingFiles.length === 0) || isSubmitting) return;

    // If guest and no name, prompt for name
    if (isGuest && !guestName) {
      setShowNamePrompt(true);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Upload pending files first if any
      let finalImages = [...images];
      
      if (pendingFiles.length > 0) {
        const filesToUpload = pendingFiles.map(pf => pf.file);
        const uploadResult = await startUpload(filesToUpload);
        
        if (uploadResult) {
           finalImages = [...finalImages, ...uploadResult.map(r => r.url)];
        }
      }

      // 2. Submit post with final image URLs
      await onSubmit(content.trim(), guestName || tempName, finalImages);
      
      // 3. Reset form
      setContent("");
      setImages([]);
      setPendingFiles([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    setGuestName(tempName.trim());
    setShowNamePrompt(false);
    // After setting name, submit the post
    setTimeout(() => handleSubmit({ preventDefault: () => {} }), 0);
  };

  // If not logged in and not guest, don't show form
  if (
    !isGuest &&
    typeof window !== "undefined" &&
    !localStorage.getItem("token") &&
    !localStorage.getItem("userId")
  )
    return null;

  return (
    <>
      {showNamePrompt && (
        <div className="modal-backdrop">
          <form
            onSubmit={handleNameSubmit}
            className="modal-content animate-fade-in"
          >
            <div className="modal-header">
              <h3 className="text-lg font-semibold">Enter your name to post</h3>
            </div>
            <div className="modal-body">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="input"
                placeholder="Your name"
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary hover-lift">
                Continue
              </button>
            </div>
          </form>
        </div>
      )}
      <form onSubmit={handleSubmit} className="card p-4 animate-fade-in">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="input resize-none focus-ring"
          rows="3"
        />

        {/* Image Preview Grid */}
        {(images.length > 0 || pendingFiles.length > 0) && (
          <div
            className={`mt-3 grid gap-2 ${
              images.length + pendingFiles.length === 1
                ? "grid-cols-1"
                : "grid-cols-2"
            }`}
          >
            {/* Existing Uploaded Images */}
            {images.map((img, index) => (
              <div key={`img-${index}`} className="relative group">
                <img
                  src={img}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove image"
                  disabled={isSubmitting}
                >
                  <CloseIcon fontSize="small" />
                </button>
              </div>
            ))}
            
            {/* Pending Files Previews */}
            {pendingFiles.map((pending, index) => (
              <div key={`pending-${index}`} className="relative group">
                <img
                  src={pending.preview}
                  alt={`Pending Upload ${index + 1}`}
                  className={`w-full h-40 object-cover rounded-lg ${isSubmitting ? 'opacity-50' : ''}`}
                />
                {isSubmitting && (
                   <div className="absolute inset-0 flex items-center justify-center">
                     <CircularProgress size={30} />
                   </div>
                )}
                <button
                  type="button"
                  onClick={() => removePendingFile(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove image"
                  disabled={isSubmitting}
                >
                  <CloseIcon fontSize="small" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Image Upload Button */}
            <label
              className={`btn-icon text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer hover-scale ${
                images.length + pendingFiles.length >= 4 || isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              title="Add images (up to 4)"
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                disabled={images.length + pendingFiles.length >= 4 || isSubmitting}
              />
              <ImageIcon className="w-6 h-6" />
              <span className="text-sm ml-1">{images.length + pendingFiles.length}/4</span>
            </label>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {content.length} / 1000
            </p>
          </div>
          <button
            type="submit"
            disabled={(!content.trim() && images.length === 0 && pendingFiles.length === 0) || isSubmitting}
            className={`btn ${
              (!content.trim() && images.length === 0 && pendingFiles.length === 0) || isSubmitting
                ? "btn-disabled"
                : "btn-primary hover-lift"
            }`}
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </>
  );
};

export default PostForm;
