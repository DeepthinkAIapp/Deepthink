import { Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface ModelSelectorProps {
  model: string;
  onModelChange: (model: string) => void;
}

const AVAILABLE_MODELS = [
  { value: 'auto', label: 'Auto (Smart Selection)' },
  { value: 'llama3.1:latest', label: 'Llama 3.1 (Best for Instructions)' },
  { value: 'gemma:7b', label: 'Gemma 7B (General Purpose)' },
  { value: 'gemma3:12b', label: 'Gemma 12B (Deep Understanding)' },
  { value: 'phi4:latest', label: 'Phi-4 (Complex Reasoning)' },
  { value: 'mistral:latest', label: 'Mistral (Long Context)' },
  { value: 'llava:latest', label: 'LLaVA (Vision)' },
  { value: 'minigpt4:latest', label: 'MiniGPT-4 (Advanced Vision)' },
];

export default function ModelSelector({ model, onModelChange }: ModelSelectorProps) {
  const theme = useTheme();

  const handleChange = (event: SelectChangeEvent) => {
    onModelChange(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 200, mb: 2 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="model-select-label">Model</InputLabel>
        <Select
          labelId="model-select-label"
          id="model-select"
          value={model}
          label="Model"
          onChange={handleChange}
          sx={{
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          {AVAILABLE_MODELS.map((model) => (
            <MenuItem key={model.value} value={model.value}>
              {model.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
} 