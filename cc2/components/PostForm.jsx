import { useState } from "react";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";

const PostForm = ({ onSubmit, isGuest, guestName, setGuestName }) => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [tempName, setTempName] = useState("");

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 4) {
      alert("You can only upload up to 4 images per post");
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert("Each image must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Create canvas to resize/compress image
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Set max dimensions
          const maxWidth = 800;
          const maxHeight = 600;
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression (0.8 quality)
          const compressedImage = canvas.toDataURL("image/jpeg", 0.8);

          setImages((prev) => [...prev, compressedImage]);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!content.trim() && images.length === 0) || isSubmitting) return;

    // If guest and no name, prompt for name
    if (isGuest && !guestName) {
      setShowNamePrompt(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), guestName || tempName, images);
      setContent("");
      setImages([]);
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
        {images.length > 0 && (
          <div
            className={`mt-3 grid gap-2 ${
              images.length === 1
                ? "grid-cols-1"
                : images.length === 2
                ? "grid-cols-2"
                : "grid-cols-2"
            }`}
          >
            {images.map((img, index) => (
              <div key={index} className="relative group">
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
                images.length >= 4 ? "opacity-50 cursor-not-allowed" : ""
              }`}
              title="Add images (up to 4)"
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                disabled={images.length >= 4}
              />
              <ImageIcon className="w-6 h-6" />
              <span className="text-sm ml-1">{images.length}/4</span>
            </label>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {content.length} / 1000
            </p>
          </div>
          <button
            type="submit"
            disabled={(!content.trim() && images.length === 0) || isSubmitting}
            className={`btn ${
              (!content.trim() && images.length === 0) || isSubmitting
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
