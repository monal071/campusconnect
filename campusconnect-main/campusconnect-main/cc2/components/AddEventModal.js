import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';

export default function AddEventModal({ open, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'in-person',
    notes: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const eventTypes = [
    { value: 'meeting', label: 'Meeting' },
    { value: 'conference', label: 'Conference' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'networking', label: 'Networking' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.date) {
        throw new Error('Date is required');
      }

      // Combine date and time
      const eventDateTime = new Date(`${formData.date}T${formData.time || '00:00'}`);
      
      if (eventDateTime < new Date()) {
        throw new Error('Event date cannot be in the past');
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          date: eventDateTime.toISOString(),
          location: formData.location,
          type: formData.type,
          notes: formData.notes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      const newEvent = await response.json();
      onSave(newEvent);
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        type: 'in-person',
        notes: ''
      });
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
        Add New Event
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg">
              {error}
            </div>
          )}
          <TextField
            fullWidth
            label="Event Title"
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
            rows={3}
            variant="outlined"
            className="bg-white/10 rounded-lg"
            InputProps={{
              className: 'text-white'
            }}
            InputLabelProps={{
              className: 'text-gray-300'
            }}
          />
          <div className="flex gap-4">
            <TextField
              type="date"
              label="Date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              variant="outlined"
              className="bg-white/10 rounded-lg flex-1"
              InputProps={{
                className: 'text-white'
              }}
              InputLabelProps={{
                className: 'text-gray-300',
                shrink: true
              }}
            />
            <TextField
              type="time"
              label="Time"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              required
              variant="outlined"
              className="bg-white/10 rounded-lg flex-1"
              InputProps={{
                className: 'text-white'
              }}
              InputLabelProps={{
                className: 'text-gray-300',
                shrink: true
              }}
            />
          </div>
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
            select
            fullWidth
            label="Type"
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
          >
            {eventTypes.map((option) => (
              <MenuItem key={option.value} value={option.value} className="text-white bg-white/10">
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Notes (optional)"
            name="notes"
            value={formData.notes}
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
            {isLoading ? 'Saving...' : 'Add Event'}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
}