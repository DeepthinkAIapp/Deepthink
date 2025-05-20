import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, TextField, Button, Paper, CircularProgress, Alert, IconButton, Tooltip, Grid, Card, CardMedia, CardContent, CardActions, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from "@mui/material";
import { SketchPicker } from 'react-color';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import "./MonetizationPlannerPage.css";
import { getApiUrl, API_CONFIG } from '../config';
import HelpIcon from '@mui/icons-material/Help';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AnalysisCard from './AnalysisCard';
import { Helmet } from 'react-helmet-async';

const styleOptions = [
  'Photorealistic', 'Cyberpunk', 'Anime', 'Watercolor', 'Fantasy', 'Concept Art', '3D Render', 'Oil Painting', 'Line Art', 'Cartoon', 'Steampunk', 'Noir', 'Other'
];
const aspectRatios = [
  { label: '1:1 (Square)', value: '1:1', width: 512, height: 512 },
  { label: '16:9 (Widescreen)', value: '16:9', width: 704, height: 396 },
  { label: '2:3 (Portrait)', value: '2:3', width: 512, height: 768 },
  { label: '3:2 (Landscape)', value: '3:2', width: 768, height: 512 },
  { label: '4:5', value: '4:5', width: 512, height: 640 },
  { label: 'Other', value: 'other', width: 512, height: 512 }
];
const modelOptions = [
  { label: 'Stable Diffusion 1.5', value: 'sd15' },
  { label: 'DreamShaper', value: 'dreamshaper' },
  { label: 'CyberRealistic', value: 'cyberrealistic' },
  { label: 'Anything V5', value: 'anythingv5' },
  { label: 'MeinaMix', value: 'meinamix' },
  { label: 'Other', value: 'other' }
];
const samplerOptions = [
  'Euler', 'Euler a', 'LMS', 'Heun', 'DPM2', 'DPM2 a', 'DPM++ 2S a', 'DPM++ 2M', 'DPM++ SDE', 'DPM fast', 'DPM adaptive', 'LMS Karras', 'DPM2 Karras', 'DPM2 a Karras', 'DPM++ 2S a Karras', 'DPM++ 2M Karras', 'DPM++ SDE Karras', 'DDIM', 'PLMS'
];

interface GeneratedImage {
  id: number;
  prompt: string;
  negative_prompt: string;
  file_path: string;
  width: number;
  height: number;
  steps: number;
  cfg_scale: number;
  seed: number;
  model: string;
  sampler: string;
  timestamp: string;
  input_image?: string;
  mask_image?: string;
}

// Add new interfaces for multi-prompt support
interface PromptSegment {
  text: string;
  weight: number;
}

// Update the default negative prompt constant
const DEFAULT_NEGATIVE_PROMPT = "lowres, text, error, cropped, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, username, watermark, signature";

const DeepthinkImageGeneratorPage: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [inputImage, setInputImage] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const [style, setStyle] = useState(styleOptions[0]);
  const [aspectRatio, setAspectRatio] = useState(aspectRatios[0].value);
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE_PROMPT);
  const [model, setModel] = useState(modelOptions[0].value);
  const [steps, setSteps] = useState(30);
  const [cfgScale, setCfgScale] = useState(7.0);
  const [seed, setSeed] = useState<number | ''>('');

  const [sampler, setSampler] = useState(samplerOptions[0]);
  const [hiresFix, setHiresFix] = useState(false);
  const [faceRestore, setFaceRestore] = useState(false);
  const [tiling, setTiling] = useState(false);
  const [batchCount, setBatchCount] = useState(1);
  const [batchSize, setBatchSize] = useState(1);
  const [denoisingStrength, setDenoisingStrength] = useState(0.7);
  const [variationSeed, setVariationSeed] = useState<number | ''>('');
  const [seedResizeWidth, setSeedResizeWidth] = useState<number | ''>('');
  const [seedResizeHeight, setSeedResizeHeight] = useState<number | ''>('');
  const [clipSkip, setClipSkip] = useState<number | ''>('');
  const [eta, setEta] = useState<number | ''>('');
  const [promptStrength, setPromptStrength] = useState<number | ''>('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(20);
  const [showHelp, setShowHelp] = useState(false);
  const canvasRef = useRef<any>(null);

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [showImageDetails, setShowImageDetails] = useState(false);

  // Add default stroke for canvas
  const defaultStroke = {
    stroke: '#000000',
    strokeWidth: 20,
    paths: []
  };

  // Add new state for available models
  const [availableModels, setAvailableModels] = useState<Array<{ title: string; model_name: string }>>([]);

  // Add negative prompt tag categories after the existing constants
  const negativePromptTags = {
    'Quality': [
      'blurry', 'lowres', 'bad quality', 'worst quality', 'low quality', 'normal quality', 'jpeg artifacts', 'signature', 'watermark', 'username'
    ],
    'Anatomy': [
      'bad anatomy', 'bad hands', 'bad feet', 'bad proportions', 'bad face', 'bad eyes', 'bad mouth', 'bad teeth', 'bad nose', 'bad ears'
    ],
    'Composition': [
      'cropped', 'out of frame', 'poorly drawn', 'poorly drawn face', 'poorly drawn hands', 'poorly drawn feet', 'poorly drawn body', 'poorly drawn face', 'poorly drawn eyes'
    ],
    'Style': [
      'cartoon', 'anime', '3d', '2d', 'sketch', 'painting', 'drawing', 'illustration', 'digital art', 'photograph'
    ],
    'Technical': [
      'duplicate', 'error', 'text', 'logo', 'brand', 'trademark', 'copyright', 'signature', 'watermark', 'username'
    ]
  };

  // Add new state for selected negative prompt tags
  const [selectedNegativeTags, setSelectedNegativeTags] = useState<string[]>([]);

  // Add new state for stats
  const [stats, setStats] = useState<{
    total_images: number;
    estimated_time_saved: number;
    popular_models: Array<{ model: string; count: number }>;
    recent_activity: number;
  } | null>(null);

  // Add new state for multi-prompts
  const [promptSegments, setPromptSegments] = useState<PromptSegment[]>([{ text: '', weight: 1 }]);

  // Add state for collapse/expand
  const [showAllNegativeTags, setShowAllNegativeTags] = useState(false);

  // Define most used tags
  const mostUsedNegativeTags = [
    'blurry', 'lowres', 'bad anatomy', 'bad hands', 'bad proportions', 'cropped', 'out of frame', 'duplicate', 'error', 'text', 'watermark', 'signature'
  ];

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(getApiUrl('/api/models'));
        if (!response.ok) throw new Error('Failed to fetch models');
        const data = await response.json();
        setAvailableModels(data);
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };
    fetchModels();
  }, []);

  // Add function to fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(getApiUrl('/api/stats'));
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  const enhancePrompt = async (
    userPrompt: string,
    options: {
      style: string,
      aspectRatio: string,
      negativePrompt: string,
      model: string,
      steps: number,
      cfgScale: number,
      seed: number | ''
    }
  ): Promise<string> => {
    const systemPrompt = `
You are an expert at writing Midjourney-style prompts for AI image generation. 
Given a short idea and user-selected options (style, aspect ratio, negative prompt, model, steps, cfg scale, seed), 
expand it into a detailed, vivid prompt using Midjourney conventions. 
Include subject, style, lighting, mood, and composition. 
Add tags like --ar for aspect ratio, --style for style, --no for negative prompt, --seed for seed, --v 5 for version, --q 2 for quality, etc., as appropriate. 
Do not include commentary, just output the prompt.
If a field is not provided, omit its tag.
`;

    const userMessage = `
Prompt: ${userPrompt}
Style: ${options.style}
Aspect Ratio: ${options.aspectRatio}
Negative Prompt: ${options.negativePrompt}
Model: ${options.model}
Steps: ${options.steps}
CFG Scale: ${options.cfgScale}
Seed: ${options.seed || 'none'}
`;

    const response = await fetch(getApiUrl('/api/chat'), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma:7b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ]
      }),
    });
    if (!response.body) throw new Error("No response body from chat API");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let done = false;
    let fullContent = "";

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const sseMessages = buffer.split("\n\n");
        buffer = sseMessages.pop() || "";
        for (const sse of sseMessages) {
          if (sse.startsWith("data: ")) {
            try {
              const jsonStr = sse.replace(/^data: /, "");
              const data = JSON.parse(jsonStr);
              if (data.message && data.message.content) {
                fullContent += data.message.content;
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    }
    return fullContent.trim() || userPrompt;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setInputImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add function to handle multi-prompt changes
  const handlePromptSegmentChange = (index: number, field: 'text' | 'weight', value: string | number) => {
    setPromptSegments(prev => {
      const newSegments = [...prev];
      newSegments[index] = { ...newSegments[index], [field]: value };
      return newSegments;
    });
  };

  // Add function to add new prompt segment
  const addPromptSegment = () => {
    setPromptSegments(prev => [...prev, { text: '', weight: 1 }]);
  };

  // Add function to remove prompt segment
  const removePromptSegment = (index: number) => {
    setPromptSegments(prev => prev.filter((_, i) => i !== index));
  };

  // Add function to combine prompts with weights
  const combinePrompts = () => {
    return promptSegments
      .filter(segment => segment.text.trim())
      .map(segment => `${segment.text}::${segment.weight}`)
      .join(' ');
  };

  const handleGenerate = async () => {
    setImagePath(null);
    setError(null);
    setEnhancedPrompt(null);
    setLoading(true);
    abortController.current = new AbortController();
    try {
      // Get mask data if canvas exists
      let maskData = null;
      if (canvasRef.current && inputImage) {
        try {
          maskData = await canvasRef.current.exportImage('png');
        } catch (err) {
          console.error('Error exporting canvas:', err);
          // Continue without mask if canvas export fails
        }
      }

      // Use combined prompts
      const combinedPrompt = combinePrompts();
      
      // Pass all options to the enhancer
      const enhanced = await enhancePrompt(combinedPrompt, {
        style,
        aspectRatio,
        negativePrompt,
        model,
        steps,
        cfgScale,
        seed
      });
      setEnhancedPrompt(enhanced);
      console.log('Enhanced prompt for SD:', enhanced);

      // Find width/height from aspect ratio
      const ar = aspectRatios.find(a => a.value === aspectRatio);
      const width = ar?.width || 512;
      const height = ar?.height || 512;

      // Send all options to the backend
      const response = await fetch(getApiUrl('/api/generate-image'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: enhanced,
          negative_prompt: negativePrompt,
          width,
          height,
          steps,
          cfg_scale: cfgScale,
          seed: seed === '' ? undefined : seed,
          model,
          sampler,
          hires_fix: hiresFix,
          face_restore: faceRestore,
          tiling,
          batch_count: batchCount,
          batch_size: batchSize,
          denoising_strength: denoisingStrength,
          variation_seed: variationSeed === '' ? undefined : variationSeed,
          seed_resize_width: seedResizeWidth === '' ? undefined : seedResizeWidth,
          seed_resize_height: seedResizeHeight === '' ? undefined : seedResizeHeight,
          clip_skip: clipSkip === '' ? undefined : clipSkip,
          eta: eta === '' ? undefined : eta,
          prompt_strength: promptStrength === '' ? undefined : promptStrength,
          input_image: inputImage,
          mask_image: maskData
        }),
        signal: abortController.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to generate image: ${response.status}`);
      }

      const data = await response.json();
      setImagePath(data.file_path);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    abortController.current?.abort();
    setLoading(false);
  };

  // Fetch generated images
  const fetchGeneratedImages = async () => {
    try {
      const response = await fetch(`${getApiUrl(API_CONFIG.IMAGE_GENERATOR)}/generated-images`);
      if (!response.ok) throw new Error('Failed to fetch images');
      const data = await response.json();
      setGeneratedImages(data);
    } catch (error) {
      console.error('Error fetching generated images:', error);
    }
  };

  // Load images when gallery is opened
  useEffect(() => {
    if (showGallery) {
      fetchGeneratedImages();
    }
  }, [showGallery]);

  // Handle image click
  const handleImageClick = (image: GeneratedImage) => {
    setSelectedImage(image);
    setShowImageDetails(true);
  };

  // Handle prompt reuse
  const handleReusePrompt = (image: GeneratedImage) => {
    setPrompt(image.prompt);
    setNegativePrompt(image.negative_prompt || '');
    setShowGallery(false);
  };

  // Add function to handle tag selection
  const handleTagClick = (tag: string) => {
    setSelectedNegativeTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Update negative prompt when tags change
  useEffect(() => {
    const tagPrompt = selectedNegativeTags.join(', ');
    setNegativePrompt(tagPrompt ? `${DEFAULT_NEGATIVE_PROMPT}, ${tagPrompt}` : DEFAULT_NEGATIVE_PROMPT);
  }, [selectedNegativeTags]);

  return (
    <Box
      sx={{
        maxWidth: 800, // Increased max width to accommodate the canvas
        mx: "auto",
        mt: 6,
        p: 2,
        position: "relative",
        minHeight: 400,
        zIndex: 1,
        background: `rgba(255,255,255,0.95)`
      }}
    >
      <Helmet>
        <title>Image Generator | DeepThink AI</title>
        <meta name="description" content="Generate stunning images with DeepThink AI's Image Generator. Create photorealistic, cyberpunk, anime, and more styles with advanced AI." />
        <link rel="canonical" href="https://www.deepthinkai.app/image-generator" />
        <meta property="og:title" content="Image Generator | DeepThink AI" />
        <meta property="og:description" content="Generate stunning images with DeepThink AI's Image Generator. Create photorealistic, cyberpunk, anime, and more styles with advanced AI." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.deepthinkai.app/image-generator" />
        <meta property="og:image" content="https://www.deepthinkai.app/images/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Image Generator | DeepThink AI" />
        <meta name="twitter:description" content="Generate stunning images with DeepThink AI's Image Generator. Create photorealistic, cyberpunk, anime, and more styles with advanced AI." />
        <meta name="twitter:image" content="https://www.deepthinkai.app/images/logo.png" />
        <meta name="twitter:url" content="https://www.deepthinkai.app/image-generator" />
      </Helmet>
      {/* Background image overlay */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          backgroundImage: `url(/images/ai-cyber-girl-bg.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.18,
          pointerEvents: 'none',
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ position: 'relative', zIndex: 2 }}>
          Deepthink AI Image Generator
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {stats && (
            <Paper elevation={1} sx={{ p: 1, display: 'flex', gap: 2 }}>
              <Tooltip title="Total Images Generated">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{stats.total_images}</Typography>
                  <Typography variant="caption">Total Images</Typography>
                </Box>
              </Tooltip>
              <Tooltip title="Estimated Time Saved">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{Math.round(stats.estimated_time_saved / 60)}m</Typography>
                  <Typography variant="caption">Time Saved</Typography>
                </Box>
              </Tooltip>
              <Tooltip title="Images in Last 24 Hours">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{stats.recent_activity}</Typography>
                  <Typography variant="caption">Last 24h</Typography>
                </Box>
              </Tooltip>
            </Paper>
          )}
          <Tooltip title="Help">
            <IconButton onClick={() => setShowHelp(true)}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Typography variant="body1" gutterBottom sx={{ position: 'relative', zIndex: 2 }}>
        Enter a prompt to generate a unique image using Stable Diffusion. Example: <i>"A futuristic city skyline at sunset, vibrant neon lights, flying cars, ultra-detailed, trending on artstation"</i>
      </Typography>
      <Box sx={{ my: 2 }}>
        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="image-upload"
          type="file"
          onChange={handleImageUpload}
        />
        <label htmlFor="image-upload">
          <Button
            variant="outlined"
            component="span"
            fullWidth
            sx={{ mb: 2 }}
          >
            {inputImage ? "Change Input Image" : "Upload Input Image (Optional)"}
          </Button>
        </label>
        {inputImage && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <img 
              src={inputImage} 
              alt="Input" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '200px',
                objectFit: 'contain'
              }} 
            />
            <Button
              variant="text"
              color="error"
              onClick={() => setInputImage(null)}
              sx={{ mt: 1 }}
            >
              Remove Image
            </Button>
          </Box>
        )}
      </Box>
      {inputImage && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Draw on the image to create a mask for inpainting:
          </Typography>
          <Box sx={{ position: 'relative', width: '100%', height: 400 }}>
            <ReactSketchCanvas
              ref={canvasRef}
              strokeWidth={brushSize}
              strokeColor={brushColor}
              backgroundImage={inputImage}
              style={{ border: '1px solid #ccc' }}
              strokeStyle="solid"
              paths={defaultStroke.paths}
              allowOnlyPointerType="all"
              canvasColor="transparent"
            />
            <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => setShowColorPicker(!showColorPicker)}
              >
                Color
              </Button>
              <TextField
                type="number"
                size="small"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                sx={{ width: 80 }}
                label="Brush Size"
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => canvasRef.current?.clearCanvas()}
              >
                Clear
              </Button>
            </Box>
            {showColorPicker && (
              <Box sx={{ position: 'absolute', top: 50, right: 10, zIndex: 1000 }}>
                <SketchPicker
                  color={brushColor}
                  onChange={(color) => setBrushColor(color.hex)}
                />
              </Box>
            )}
          </Box>
        </Box>
      )}
      <Box sx={{ my: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Image Prompt Segments
        </Typography>
        {promptSegments.map((segment, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              label={`Prompt Segment ${index + 1}`}
              placeholder="Enter prompt segment..."
              variant="outlined"
              fullWidth
              value={segment.text}
              onChange={e => handlePromptSegmentChange(index, 'text', e.target.value)}
              disabled={loading}
            />
            <TextField
              label="Weight"
              type="number"
              value={segment.weight}
              onChange={e => handlePromptSegmentChange(index, 'weight', parseFloat(e.target.value) || 1)}
              sx={{ width: 100 }}
              inputProps={{ step: 0.1, min: -2, max: 2 }}
              disabled={loading}
            />
            {index > 0 && (
              <IconButton 
                onClick={() => removePromptSegment(index)}
                disabled={loading}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        ))}
        <Button
          variant="outlined"
          onClick={addPromptSegment}
          disabled={loading}
          startIcon={<AddIcon />}
          sx={{ mb: 2 }}
        >
          Add Prompt Segment
        </Button>
        <Paper elevation={1} sx={{ p: 2, mb: 2, background: '#f7f7f7' }}>
          <Typography variant="subtitle2" gutterBottom>Combined Prompt:</Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {combinePrompts()}
          </Typography>
        </Paper>
      </Box>
      <TextField
        label="Image Prompt"
        placeholder="Describe the image you want to create..."
        variant="outlined"
        fullWidth
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        sx={{ my: 2 }}
        disabled={loading}
      />
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          select
          label="Style"
          value={style}
          onChange={e => setStyle(e.target.value)}
          SelectProps={{ native: true }}
          sx={{ minWidth: 140 }}
          disabled={loading}
        >
          {styleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </TextField>
        <TextField
          select
          label="Aspect Ratio"
          value={aspectRatio}
          onChange={e => setAspectRatio(e.target.value)}
          SelectProps={{ native: true }}
          sx={{ minWidth: 140 }}
          disabled={loading}
        >
          {aspectRatios.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </TextField>
        <TextField
          select
          label="Model"
          value={model}
          onChange={e => setModel(e.target.value)}
          SelectProps={{ native: true }}
          sx={{ minWidth: 140 }}
          disabled={loading}
        >
          {availableModels.map(opt => <option key={opt.model_name} value={opt.model_name}>{opt.title}</option>)}
        </TextField>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Negative Prompt"
          value={negativePrompt}
          onChange={e => setNegativePrompt(e.target.value)}
          fullWidth
          disabled={loading}
        />
      </Box>
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Common Negative Prompts:</Typography>
        {/* Most Used Row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {mostUsedNegativeTags.map(tag => (
            <Chip
              key={tag}
              label={tag}
              onClick={() => handleTagClick(tag)}
              color={selectedNegativeTags.includes(tag) ? "primary" : "default"}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
        <Button
          size="small"
          variant="text"
          onClick={() => setShowAllNegativeTags(v => !v)}
          sx={{ mb: 1 }}
        >
          {showAllNegativeTags ? 'Hide All Tags' : 'Show All Tags'}
        </Button>
        {/* Collapsible full list */}
        {showAllNegativeTags && (
          <Box>
            {Object.entries(negativePromptTags).map(([category, tags]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {category}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {tags.map(tag => (
                    <Chip
                      key={tag}
                      label={tag}
                      onClick={() => handleTagClick(tag)}
                      color={selectedNegativeTags.includes(tag) ? "primary" : "default"}
                      size="small"
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Steps"
          type="number"
          value={steps}
          onChange={e => setSteps(Number(e.target.value))}
          sx={{ width: 120 }}
          inputProps={{ min: 10, max: 50 }}
          disabled={loading}
        />
        <TextField
          label="CFG Scale"
          type="number"
          value={cfgScale}
          onChange={e => setCfgScale(Number(e.target.value))}
          sx={{ width: 120 }}
          inputProps={{ min: 1, max: 20, step: 0.5 }}
          disabled={loading}
        />
        <TextField
          label="Seed (optional)"
          type="number"
          value={seed}
          onChange={e => setSeed(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ width: 140 }}
          disabled={loading}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          select
          label="Sampler"
          value={sampler}
          onChange={e => setSampler(e.target.value)}
          SelectProps={{ native: true }}
          sx={{ minWidth: 140 }}
          disabled={loading}
        >
          {samplerOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </TextField>
        <TextField
          label="Batch Count"
          type="number"
          value={batchCount}
          onChange={e => setBatchCount(Number(e.target.value))}
          sx={{ width: 120 }}
          inputProps={{ min: 1, max: 16 }}
          disabled={loading}
        />
        <TextField
          label="Batch Size"
          type="number"
          value={batchSize}
          onChange={e => setBatchSize(Number(e.target.value))}
          sx={{ width: 120 }}
          inputProps={{ min: 1, max: 16 }}
          disabled={loading}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Denoising Strength"
          type="number"
          value={denoisingStrength}
          onChange={e => setDenoisingStrength(Number(e.target.value))}
          sx={{ width: 180 }}
          inputProps={{ min: 0, max: 1, step: 0.01 }}
          disabled={loading}
        />
        <TextField
          label="Variation Seed"
          type="number"
          value={variationSeed}
          onChange={e => setVariationSeed(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ width: 180 }}
          disabled={loading}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Seed Resize Width"
          type="number"
          value={seedResizeWidth}
          onChange={e => setSeedResizeWidth(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ width: 180 }}
          disabled={loading}
        />
        <TextField
          label="Seed Resize Height"
          type="number"
          value={seedResizeHeight}
          onChange={e => setSeedResizeHeight(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ width: 180 }}
          disabled={loading}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Clip Skip"
          type="number"
          value={clipSkip}
          onChange={e => setClipSkip(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ width: 120 }}
          disabled={loading}
        />
        <TextField
          label="Eta"
          type="number"
          value={eta}
          onChange={e => setEta(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ width: 120 }}
          disabled={loading}
        />
        <TextField
          label="Prompt Strength"
          type="number"
          value={promptStrength}
          onChange={e => setPromptStrength(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ width: 140 }}
          inputProps={{ min: 0, max: 1, step: 0.01 }}
          disabled={loading}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={hiresFix} onChange={e => setHiresFix(e.target.checked)} disabled={loading} /> High-Res Fix
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={faceRestore} onChange={e => setFaceRestore(e.target.checked)} disabled={loading} /> Face Restoration
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={tiling} onChange={e => setTiling(e.target.checked)} disabled={loading} /> Tiling
        </label>
      </Box>
      {enhancedPrompt && (
        <Paper elevation={1} sx={{ mt: 3, mb: 2, p: 2, background: '#f7f7f7' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Enhanced Prompt Sent to Stable Diffusion:</Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{enhancedPrompt}</Typography>
        </Paper>
      )}
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerate}
          disabled={!prompt.trim() || loading}
        >
          Generate Image
        </Button>
        {loading && (
          <Button variant="outlined" color="secondary" onClick={handleStop}>
            Stop
          </Button>
        )}
      </Box>
      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body2">Generating image...</Typography>
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}
      {imagePath && (
        <AnalysisCard
          robotImageUrl="/images/android-chrome-512x512.png"
          robotImagePosition="bottom-right"
          robotImageSize={64}
          title="Generated Image"
        >
          <Box sx={{ mt: 2 }}>
            <img
              src={imagePath}
              alt="Generated"
              style={{ maxWidth: '100%', borderRadius: 8 }}
            />
          </Box>
        </AnalysisCard>
      )}

      {/* Help Modal */}
      {showHelp && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            p: 3,
            maxWidth: 600,
            maxHeight: '80vh',
            overflow: 'auto',
            zIndex: 1000,
          }}
        >
          <Typography variant="h6" gutterBottom>Help & Tips</Typography>
          {stats && stats.popular_models.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Popular Models:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {stats.popular_models.map(({ model, count }) => (
                  <Chip
                    key={model}
                    label={`${model} (${count})`}
                    size="small"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setModel(model)}
                  />
                ))}
              </Box>
            </Box>
          )}
          <Typography variant="body1" paragraph>
            <strong>Image Generation:</strong>
            <ul>
              <li>Enter a detailed prompt describing the image you want to create</li>
              <li>Choose a style and aspect ratio that matches your vision</li>
              <li>Adjust parameters like steps and CFG scale to control the generation</li>
            </ul>
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Inpainting:</strong>
            <ul>
              <li>Upload an image to modify specific areas</li>
              <li>Use the drawing tool to create a mask over areas you want to change</li>
              <li>Adjust brush size and color for precise masking</li>
            </ul>
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Parameters:</strong>
            <ul>
              <li>Steps: Higher values (30-50) give better quality but take longer</li>
              <li>CFG Scale: Controls how closely the image follows your prompt (7-11 recommended)</li>
              <li>Denoising Strength: Controls how much of the original image is preserved (0.7-0.8 recommended)</li>
            </ul>
          </Typography>
          <Button
            variant="contained"
            onClick={() => setShowHelp(false)}
            sx={{ mt: 2 }}
          >
            Close
          </Button>
        </Paper>
      )}

      {/* Gallery Button */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={() => setShowGallery(!showGallery)}
        >
          {showGallery ? 'Hide Gallery' : 'Show Gallery'}
        </Button>
      </Box>

      {/* Gallery Section */}
      {showGallery && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Generated Images
          </Typography>
          <Grid container spacing={2}>
            {generatedImages.map((image) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={image.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={`${getApiUrl(API_CONFIG.IMAGE_GENERATOR)}${image.file_path}`}
                    alt={image.prompt}
                    onClick={() => handleImageClick(image)}
                    sx={{ cursor: 'pointer' }}
                  />
                  <CardContent>
                    <Typography variant="body2" noWrap>
                      {image.prompt}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(image.timestamp).toLocaleString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Tooltip title="Reuse Prompt">
                      <IconButton size="small" onClick={() => handleReusePrompt(image)}>
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Image Details Dialog */}
      <Dialog
        open={showImageDetails}
        onClose={() => setShowImageDetails(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedImage && (
          <>
            <DialogTitle>Image Details</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <img
                  src={`${getApiUrl(API_CONFIG.IMAGE_GENERATOR)}${selectedImage.file_path}`}
                  alt={selectedImage.prompt}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
                <Typography variant="subtitle1">Prompt:</Typography>
                <Typography variant="body2">{selectedImage.prompt}</Typography>
                {selectedImage.negative_prompt && (
                  <>
                    <Typography variant="subtitle1">Negative Prompt:</Typography>
                    <Typography variant="body2">{selectedImage.negative_prompt}</Typography>
                  </>
                )}
                <Typography variant="subtitle1">Parameters:</Typography>
                <Typography variant="body2">
                  Size: {selectedImage.width}x{selectedImage.height}<br />
                  Steps: {selectedImage.steps}<br />
                  CFG Scale: {selectedImage.cfg_scale}<br />
                  Seed: {selectedImage.seed}<br />
                  Model: {selectedImage.model}<br />
                  Sampler: {selectedImage.sampler}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleReusePrompt(selectedImage)}>
                Reuse Prompt
              </Button>
              <Button onClick={() => setShowImageDetails(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DeepthinkImageGeneratorPage; 