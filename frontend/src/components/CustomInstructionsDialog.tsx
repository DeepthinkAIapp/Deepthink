import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Switch, FormControlLabel, Divider, Typography } from '@mui/material';

const LOCAL_STORAGE_KEY = 'deepthinkai_custom_instructions';
const LOCAL_STORAGE_TOGGLE_KEY = 'deepthinkai_custom_instructions_enabled';
const MAX_CHARS = 1500;

interface CustomInstructions {
  about: string;
  style: string;
}

interface CustomInstructionsDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'light' | 'dark';
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

const CustomInstructionsDialog: React.FC<CustomInstructionsDialogProps> = ({ open, onClose, mode, onToggleDarkMode, onLogout }) => {
  const [about, setAbout] = useState('');
  const [style, setStyle] = useState('');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: CustomInstructions = JSON.parse(saved);
        setAbout(parsed.about || '');
        setStyle(parsed.style || '');
      }
      const toggle = localStorage.getItem(LOCAL_STORAGE_TOGGLE_KEY);
      setEnabled(toggle === null ? true : toggle === 'true');
    }
  }, [open]);

  const handleSave = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ about, style }));
    localStorage.setItem(LOCAL_STORAGE_TOGGLE_KEY, String(enabled));
    onClose();
  };

  const handleReset = () => {
    setAbout('');
    setStyle('');
    setEnabled(true);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_TOGGLE_KEY);
  };

  // Live preview of system message
  const systemMessage = (about.trim() || style.trim())
    ? `${about.trim()}\n\n${style.trim()}`.trim()
    : '[No custom instructions set]';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Custom instructions</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControlLabel
            control={<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />}
            label="Enable for new chats"
            sx={{ alignSelf: 'flex-end', mb: 1 }}
          />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            What would you like the AI to know about you to provide better responses?
          </Typography>
          <TextField
            label=""
            multiline
            minRows={2}
            value={about}
            onChange={e => setAbout(e.target.value.slice(0, MAX_CHARS))}
            fullWidth
            variant="outlined"
            helperText={`${about.length}/${MAX_CHARS}`}
            inputProps={{ maxLength: MAX_CHARS }}
          />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            How would you like the AI to respond?
          </Typography>
          <TextField
            label=""
            multiline
            minRows={2}
            value={style}
            onChange={e => setStyle(e.target.value.slice(0, MAX_CHARS))}
            fullWidth
            variant="outlined"
            helperText={`${style.length}/${MAX_CHARS}`}
            inputProps={{ maxLength: MAX_CHARS }}
          />
        </Box>
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Live Preview</Typography>
        <Box sx={{ bgcolor: mode === 'dark' ? '#232936' : '#f5f5f5', p: 2, borderRadius: 2, fontFamily: 'monospace', fontSize: 15, color: mode === 'dark' ? '#fff' : '#222', mb: 2 }}>
          {systemMessage}
        </Box>
        <FormControlLabel
          control={<Switch checked={mode === 'dark'} onChange={onToggleDarkMode} />}
          label={mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
        />
        <Button onClick={onLogout} color="error" variant="outlined" sx={{ mt: 2 }} fullWidth>
          Log Out
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset} color="secondary">Reset</Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomInstructionsDialog; 