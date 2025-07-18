import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress } from '@mui/material';

export default function EventFormModal({ open, onClose, event, onSubmit }) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    location: event?.location || '',
    date: event?.date ? new Date(event.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    type: event?.type || 'in-person',
    link: event?.link || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const submissionData = {
        ...formData,
        date: new Date(formData.date)
      };
      await onSubmit(submissionData);
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
        {event ? 'Edit Event' : 'Create New Event'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-6 mt-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg">
              {error}
            </div>
          )}
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
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
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            multiline
            rows={4}
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
            label="Location"
            name="location"
            value={formData.location}
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
          <TextField
            fullWidth
            type="datetime-local"
            label="Date & Time"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
            variant="outlined"
            className="bg-white/10 rounded-lg"
            InputProps={{
              className: 'text-white'
            }}
            InputLabelProps={{
              className: 'text-gray-300',
              shrink: true
            }}
          />
          <TextField
            fullWidth
            select
            label="Event Type"
            name="type"
            value={formData.type}
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
            SelectProps={{
              native: true
            }}
          >
            <option value="in-person">In Person</option>
            <option value="virtual">Virtual</option>
            <option value="hybrid">Hybrid</option>
          </TextField>
          <TextField
            fullWidth
            label="Event Link (Optional)"
            name="link"
            value={formData.link}
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
              event ? 'Save Changes' : 'Create Event'
            )}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
}