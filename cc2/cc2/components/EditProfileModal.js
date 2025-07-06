import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Avatar, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export default function EditProfileModal({ open, onClose, user, onSave }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    role: user?.role || '',
    location: user?.location || '',
    website: user?.website || '',
    github: user?.github || '',
    twitter: user?.twitter || '',
    instagram: user?.instagram || '',
    facebook: user?.facebook || '',
    image: user?.image || ''
  });
  const [imagePreview, setImagePreview] = useState(user?.image || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          email: user?.email, // Use user prop for email
          updatedAt: new Date().toISOString()
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      const data = await response.json();
      onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: 'bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl text-white'
      }}
    >
      <DialogTitle className="border-b border-white/20 text-2xl font-extrabold tracking-tight">
        Edit Profile
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg">
              {error}
            </div>
          )}
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar
              src={imagePreview}
              alt="Profile"
              sx={{ width: 100, height: 100 }}
              className="border-4 border-[#252525]"
            />
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl shadow-lg font-semibold text-lg cursor-pointer transition-all"
              >
                <CloudUploadIcon />
                Upload
              </label>
            </div>
          </div>
          {/* Name */}
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            variant="outlined"
            className="bg-white/10 rounded-lg"
            InputProps={{
              className: 'text-white'
            }}
            InputLabelProps={{
              className: 'text-gray-300'
            }}
          />
          {/* Role */}
          <TextField
            fullWidth
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            variant="outlined"
            className="bg-white/10 rounded-lg"
            InputProps={{
              className: 'text-white'
            }}
            InputLabelProps={{
              className: 'text-gray-300'
            }}
          />
          {/* Location */}
          <TextField
            fullWidth
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            variant="outlined"
            className="bg-white/10 rounded-lg"
            InputProps={{
              className: 'text-white'
            }}
            InputLabelProps={{
              className: 'text-gray-300'
            }}
          />
          {/* Website */}
          <TextField
            fullWidth
            label="Website"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            variant="outlined"
            className="bg-white/10 rounded-lg"
            InputProps={{
              className: 'text-white'
            }}
            InputLabelProps={{
              className: 'text-gray-300'
            }}
          />
          {/* Socials */}
          <TextField
            fullWidth
            label="GitHub"
            name="github"
            value={formData.github}
            onChange={handleInputChange}
            variant="outlined"
            className="bg-white/10 rounded-lg"
            InputProps={{
              className: 'text-white'
            }}
            InputLabelProps={{
              className: 'text-gray-300'
            }}
          />
          <TextField
            fullWidth
            label="Twitter"
            name="twitter"
            value={formData.twitter}
            onChange={handleInputChange}
            variant="outlined"
            className="bg-white/10 rounded-lg"
            InputProps={{
              className: 'text-white'
            }}
            InputLabelProps={{
              className: 'text-gray-300'
            }}
          />
          <TextField
            fullWidth
            label="Instagram"
            name="instagram"
            value={formData.instagram}
            onChange={handleInputChange}
            variant="outlined"
            className="bg-white/10 rounded-lg"
            InputProps={{
              className: 'text-white'
            }}
            InputLabelProps={{
              className: 'text-gray-300'
            }}
          />
          <TextField
            fullWidth
            label="Facebook"
            name="facebook"
            value={formData.facebook}
            onChange={handleInputChange}
            variant="outlined"
            className="bg-white/10 rounded-lg"
            InputProps={{
              className: 'text-white'
            }}
            InputLabelProps={{
              className: 'text-gray-300'
            }}
          />
        </DialogContent>
        <DialogActions className="border-t border-white/20 p-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl shadow-lg font-semibold text-lg transition-all flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} color="inherit" />
                <span>Saving...</span>
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
}