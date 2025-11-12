import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

export default function EditProfileModal({ open, onClose, user, onSave }) {
  const { update } = useSession();
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Update form when user prop changes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setImage(user.image || "");
      setImagePreview(user.image || "");
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 2MB for better performance)
      if (file.size > 2 * 1024 * 1024) {
        setError(
          "Image size should be less than 2MB. Please choose a smaller image."
        );
        return;
      }

      // Clear any previous errors
      setError("");

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Create canvas to resize/compress image
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Set max dimensions
          const maxWidth = 400;
          const maxHeight = 400;
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

          // Convert to base64 with compression (0.7 quality)
          const compressedImage = canvas.toDataURL("image/jpeg", 0.7);

          setImagePreview(compressedImage);
          setImage(compressedImage);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Submitting profile update with data:", {
        name: name.trim(),
        hasImage: !!image,
      });

      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          image: image,
        }),
      });

      const data = await response.json();
      console.log("Profile update response:", {
        status: response.status,
        data,
      });

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");

      // Update NextAuth session to reflect changes immediately
      await update();

      // Call onSave callback with updated user data
      if (onSave) {
        onSave({ ...user, name: name.trim(), image });
      }

      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
        // Reload the page to reflect changes everywhere
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        className: "bg-white dark:bg-gray-900 rounded-2xl shadow-2xl",
      }}
    >
      <DialogTitle className="border-b border-gray-200 dark:border-gray-700 text-xl font-bold text-gray-900 dark:text-white">
        Edit Profile
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-6 py-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Profile Image Upload */}
          <div className="flex flex-col items-center gap-4 py-2">
            <Avatar
              src={imagePreview}
              alt={name || "Profile"}
              sx={{ width: 100, height: 100 }}
              className="border-4 border-gray-200 dark:border-gray-700 shadow-lg"
            />
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
                disabled={isLoading}
              />
              <label
                htmlFor="image-upload"
                className={`flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer transition-all shadow-md ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <CloudUploadIcon fontSize="small" />
                Change Photo
              </label>
            </div>
          </div>

          {/* Name Field */}
          <TextField
            fullWidth
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            variant="outlined"
            disabled={isLoading}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg"
            InputProps={{
              className: "text-gray-900 dark:text-white",
            }}
            InputLabelProps={{
              className: "text-gray-600 dark:text-gray-400",
            }}
          />
        </DialogContent>

        <DialogActions className="border-t border-gray-200 dark:border-gray-700 p-4 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? (
              <>
                <CircularProgress size={18} color="inherit" />
                <span>Saving...</span>
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
