import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import { getApiUrl, getSdApiUrl, API_CONFIG } from '../config';

const SAMPLERS = [
  'Euler a', 'Euler', 'LMS', 'Heun', 'DPM2', 'DPM2 a', 'DPM++ 2S a', 'DPM++ 2M', 'DPM++ SDE', 'DPM fast', 'DPM adaptive', 'LMS Karras', 'DPM2 Karras', 'DPM2 a Karras', 'DPM++ 2S a Karras', 'DPM++ 2M Karras', 'DPM++ SDE Karras', 'DDIM', 'PLMS'
];
const ANIMATION_MODES = ['2D', '3D', 'None'];

// Add negative prompt tag categories
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

// Add most used tags
const mostUsedNegativeTags = [
  'blurry', 'lowres', 'bad anatomy', 'bad hands', 'bad proportions', 'cropped', 'out of frame', 'duplicate', 'error', 'text', 'watermark', 'signature'
];

// Add default negative prompt
const DEFAULT_NEGATIVE_PROMPT = "lowres, text, error, cropped, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, username, watermark, signature";

const MODEL_OPTIONS = [
  { label: 'Stable Diffusion 1.5', value: 'sd15' },
  { label: 'Deliberate_v2', value: 'Deliberate_v2' }
];

const DEFAULT_DEFORUM_SETTINGS = {
  W: 512,
  H: 512,
  show_info_on_ui: true,
  tiling: false,
  restore_faces: false,
  seed_resize_from_w: 0,
  seed_resize_from_h: 0,
  seed: -1,
  sampler: "Euler a",
  scheduler: "Automatic",
  steps: 25,
  batch_name: "Deforum_{timestring}",
  seed_behavior: "iter",
  seed_iter_N: 1,
  use_init: false,
  strength: 0.8,
  strength_0_no_init: true,
  init_image: "https://deforum.github.io/a1/I1.png",
  use_mask: false,
  use_alpha_as_mask: false,
  mask_file: "https://deforum.github.io/a1/M1.jpg",
  invert_mask: false,
  mask_contrast_adjust: 1.0,
  mask_brightness_adjust: 1.0,
  overlay_mask: true,
  mask_overlay_blur: 4,
  fill: 1,
  full_res_mask: true,
  full_res_mask_padding: 4,
  reroll_blank_frames: "ignore",
  reroll_patience: 10.0,
  motion_preview_mode: false,
  text_prompts: {
    "0": ["tiny cute bunny, vibrant diffraction, highly detailed, intricate, ultra hd, sharp photo, crepuscular rays, in focus"],
    "30": ["anthropomorphic clean cat, surrounded by fractals, epic angle and pose, symmetrical, 3d, depth of field"],
    "60": ["a beautiful coconut --neg photo, realistic"],
    "90": ["a beautiful durian, award winning photography"]
  },
  animation_prompts_positive: "",
  animation_prompts_negative: "nsfw, nude",
  animation_mode: "2D",
  max_frames: 120,
  border: "replicate",
  angle: "0: (0)",
  zoom: "0: (1.0025+0.002*sin(1.25*3.14*t/30))",
  translation_x: "0: (0)",
  translation_y: "0: (0)",
  translation_z: "0: (1.75)",
  transform_center_x: "0: (0.5)",
  transform_center_y: "0: (0.5)",
  rotation_3d_x: "0: (0)",
  rotation_3d_y: "0: (0)",
  rotation_3d_z: "0: (0)",
  enable_perspective_flip: false,
  perspective_flip_theta: "0: (0)",
  perspective_flip_phi: "0: (0)",
  perspective_flip_gamma: "0: (0)",
  perspective_flip_fv: "0: (53)",
  noise_schedule: "0: (0.065)",
  strength_schedule: "0: (0.65)",
  contrast_schedule: "0: (1.0)",
  cfg_scale_schedule: "0: (7)",
  enable_steps_scheduling: false,
  steps_schedule: "0: (25)",
  fov_schedule: "0: (70)",
  aspect_ratio_schedule: "0: (1)",
  aspect_ratio_use_old_formula: false,
  near_schedule: "0: (200)",
  far_schedule: "0: (10000)",
  seed_schedule: "0:(s), 1:(-1), \"max_f-2\":(-1), \"max_f-1\":(s)",
  pix2pix_img_cfg_scale_schedule: "0:(1.5)",
  enable_subseed_scheduling: false,
  subseed_schedule: "0: (1)",
  subseed_strength_schedule: "0: (0)",
  enable_sampler_scheduling: false,
  sampler_schedule: "0: (\"Euler a\")",
  use_noise_mask: false,
  mask_schedule: "0: (\"{video_mask}\")",
  noise_mask_schedule: "0: (\"{video_mask}\")",
  enable_checkpoint_scheduling: false,
  checkpoint_schedule: "0: (\"model1.ckpt\"), 100: (\"model2.safetensors\")",
  enable_clipskip_scheduling: false,
  clipskip_schedule: "0: (2)",
  enable_noise_multiplier_scheduling: true,
  noise_multiplier_schedule: "0: (1.05)",
  resume_from_timestring: false,
  resume_timestring: "20250516021025",
  enable_ddim_eta_scheduling: false,
  ddim_eta_schedule: "0: (0)",
  enable_ancestral_eta_scheduling: false,
  ancestral_eta_schedule: "0: (1)",
  amount_schedule: "0: (0.1)",
  kernel_schedule: "0: (5)",
  sigma_schedule: "0: (1)",
  threshold_schedule: "0: (0)",
  color_coherence: "LAB",
  color_coherence_image_path: "",
  color_coherence_video_every_N_frames: 1,
  color_force_grayscale: false,
  legacy_colormatch: false,
  diffusion_cadence: 2,
  optical_flow_cadence: "None",
  cadence_flow_factor_schedule: "0: (1)",
  optical_flow_redo_generation: "None",
  redo_flow_factor_schedule: "0: (1)",
  diffusion_redo: "0",
  noise_type: "perlin",
  perlin_octaves: 4,
  perlin_persistence: 0.5,
  use_depth_warping: true,
  depth_algorithm: "Midas-3-Hybrid",
  midas_weight: 0.2,
  padding_mode: "border",
  sampling_mode: "bicubic",
  save_depth_maps: false,
  video_init_path: "https://deforum.github.io/a1/V1.mp4",
  extract_nth_frame: 1,
  extract_from_frame: 0,
  extract_to_frame: -1,
  overwrite_extracted_frames: false,
  use_mask_video: false,
  video_mask_path: "https://deforum.github.io/a1/VM1.mp4",
  hybrid_comp_alpha_schedule: "0:(0.5)",
  hybrid_comp_mask_blend_alpha_schedule: "0:(0.5)",
  hybrid_comp_mask_contrast_schedule: "0:(1)",
  hybrid_comp_mask_auto_contrast_cutoff_high_schedule: "0:(100)",
  hybrid_comp_mask_auto_contrast_cutoff_low_schedule: "0:(0)",
  hybrid_flow_factor_schedule: "0:(1)",
  hybrid_generate_inputframes: false,
  hybrid_generate_human_masks: "None",
  hybrid_use_first_frame_as_init_image: true,
  hybrid_motion: "None",
  hybrid_motion_use_prev_img: false,
  hybrid_flow_consistency: false,
  hybrid_consistency_blur: 2,
  hybrid_flow_method: "RAFT",
  hybrid_composite: "None",
  hybrid_use_init_image: false,
  hybrid_comp_mask_type: "None",
  hybrid_comp_mask_inverse: false,
  hybrid_comp_mask_equalize: "None",
  hybrid_comp_mask_auto_contrast: false,
  hybrid_comp_save_extra_frames: false,
  parseq_manifest: "",
  parseq_use_deltas: true,
  parseq_non_schedule_overrides: true,
  use_looper: false,
  init_images: '{\n    "0": "https://deforum.github.io/a1/Gi1.png",\n    "max_f/4-5": "https://deforum.github.io/a1/Gi2.png",\n    "max_f/2-10": "https://deforum.github.io/a1/Gi3.png",\n    "3*max_f/4-15": "https://deforum.github.io/a1/Gi4.jpg",\n    "max_f-20": "https://deforum.github.io/a1/Gi1.png"\n}',
  image_strength_schedule: "0:(0.75)",
  blendFactorMax: "0:(0.35)",
  blendFactorSlope: "0:(0.25)",
  tweening_frames_schedule: "0:(20)",
  color_correction_factor: "0:(0.075)",
  cn_1_overwrite_frames: true,
  cn_1_vid_path: "",
  cn_1_mask_vid_path: "",
  cn_1_enabled: false,
  cn_1_low_vram: false,
  cn_1_pixel_perfect: false,
  cn_1_module: "none",
  cn_1_model: "None",
  cn_1_weight: "0:(1)",
  cn_1_guidance_start: "0:(0.0)",
  cn_1_guidance_end: "0:(1.0)",
  cn_1_processor_res: 64,
  cn_1_threshold_a: 64,
  cn_1_threshold_b: 64,
  cn_1_resize_mode: "Inner Fit (Scale to Fit)",
  cn_1_control_mode: "Balanced",
  cn_1_loopback_mode: false,
  cn_2_overwrite_frames: true,
  cn_2_vid_path: "",
  cn_2_mask_vid_path: "",
  cn_2_enabled: false,
  cn_2_low_vram: false,
  cn_2_pixel_perfect: false,
  cn_2_module: "none",
  cn_2_model: "None",
  cn_2_weight: "0:(1)",
  cn_2_guidance_start: "0:(0.0)",
  cn_2_guidance_end: "0:(1.0)",
  cn_2_processor_res: 64,
  cn_2_threshold_a: 64,
  cn_2_threshold_b: 64,
  cn_2_resize_mode: "Inner Fit (Scale to Fit)",
  cn_2_control_mode: "Balanced",
  cn_2_loopback_mode: false,
  cn_3_overwrite_frames: true,
  cn_3_vid_path: "",
  cn_3_mask_vid_path: "",
  cn_3_enabled: false,
  cn_3_low_vram: false,
  cn_3_pixel_perfect: false,
  cn_3_module: "none",
  cn_3_model: "None",
  cn_3_weight: "0:(1)",
  cn_3_guidance_start: "0:(0.0)",
  cn_3_guidance_end: "0:(1.0)",
  cn_3_processor_res: 64,
  cn_3_threshold_a: 64,
  cn_3_threshold_b: 64,
  cn_3_resize_mode: "Inner Fit (Scale to Fit)",
  cn_3_control_mode: "Balanced",
  cn_3_loopback_mode: false,
  cn_4_overwrite_frames: true,
  cn_4_vid_path: "",
  cn_4_mask_vid_path: "",
  cn_4_enabled: false,
  cn_4_low_vram: false,
  cn_4_pixel_perfect: false,
  cn_4_module: "none",
  cn_4_model: "None",
  cn_4_weight: "0:(1)",
  cn_4_guidance_start: "0:(0.0)",
  cn_4_guidance_end: "0:(1.0)",
  cn_4_processor_res: 64,
  cn_4_threshold_a: 64,
  cn_4_threshold_b: 64,
  cn_4_resize_mode: "Inner Fit (Scale to Fit)",
  cn_4_control_mode: "Balanced",
  cn_4_loopback_mode: false,
  cn_5_overwrite_frames: true,
  cn_5_vid_path: "",
  cn_5_mask_vid_path: "",
  cn_5_enabled: false,
  cn_5_low_vram: false,
  cn_5_pixel_perfect: false,
  cn_5_module: "none",
  cn_5_model: "None",
  cn_5_weight: "0:(1)",
  cn_5_guidance_start: "0:(0.0)",
  cn_5_guidance_end: "0:(1.0)",
  cn_5_processor_res: 64,
  cn_5_threshold_a: 64,
  cn_5_threshold_b: 64,
  cn_5_resize_mode: "Inner Fit (Scale to Fit)",
  cn_5_control_mode: "Balanced",
  cn_5_loopback_mode: false,
  skip_video_creation: false,
  fps: 15,
  make_gif: false,
  delete_imgs: false,
  delete_input_frames: false,
  add_soundtrack: "None",
  soundtrack_path: "https://deforum.github.io/a1/A1.mp3",
  r_upscale_video: false,
  r_upscale_factor: "x2",
  r_upscale_model: "realesr-animevideov3",
  r_upscale_keep_imgs: true,
  store_frames_in_ram: false,
  frame_interpolation_engine: "None",
  frame_interpolation_x_amount: 2,
  frame_interpolation_slow_mo_enabled: false,
  frame_interpolation_slow_mo_amount: 2,
  frame_interpolation_keep_imgs: true,
  frame_interpolation_use_upscaled: false,
  sd_model_name: "Deliberate_v2.safetensors",
  sd_model_hash: "10ec4b29",
  deforum_git_commit_id: "5d63a339",
  model: MODEL_OPTIONS[0].value
};

const SCHEDULE_EXAMPLES = {
  strength: 'e.g. 0:(0.65),25:(0.55)',
  fov: 'e.g. 0:(120)',
};

const ensureStringSchedules = (settings: any) => {
  const newSettings = { ...settings };
  for (const key in newSettings) {
    if (
      key.endsWith('_schedule') ||
      [
        'blendFactorMax',
        'blendFactorSlope',
        'tweening_frames_schedule',
        'color_correction_factor'
      ].includes(key)
    ) {
      if (newSettings[key] == null || newSettings[key] === '') {
        // Provide a safe default for any schedule
        newSettings[key] = '0:(0)';
        // Special cases
        if (key === 'contrast_schedule') newSettings[key] = '0:(1.0)';
        if (key === 'ddim_eta_schedule') newSettings[key] = '0:(0)';
        if (key === 'ancestral_eta_schedule') newSettings[key] = '0:(1)';
        if (key === 'pix2pix_img_cfg_scale_schedule') newSettings[key] = '0:(1.5)';
        if (key === 'subseed_schedule') newSettings[key] = '0:(1)';
        if (key === 'subseed_strength_schedule') newSettings[key] = '0:(0)';
        if (key === 'steps_schedule') newSettings[key] = '0:(8)';
        if (key === 'cfg_scale_schedule') newSettings[key] = '0:(5)';
        if (key === 'fov_schedule') newSettings[key] = '0:(120)';
        if (key === 'flow_blend_schedule') newSettings[key] = '0:(0.8)';
        if (key === 'style_strength_schedule') newSettings[key] = '0:(0.7)';
        if (key === 'init_scale_schedule') newSettings[key] = '0:(0)';
        if (key === 'latent_scale_schedule') newSettings[key] = '0:(0)';
        if (key === 'mask_schedule') newSettings[key] = '0:({video_mask})';
        if (key === 'noise_mask_schedule') newSettings[key] = '0:({video_mask})';
        if (key === 'checkpoint_schedule') newSettings[key] = '0:(model1.ckpt)';
        if (key === 'clipskip_schedule') newSettings[key] = '0:(2)';
        if (key === 'noise_multiplier_schedule') newSettings[key] = '0:(1.05)';
        if (key === 'amount_schedule') newSettings[key] = '0:(0.1)';
        if (key === 'kernel_schedule') newSettings[key] = '0:(5)';
        if (key === 'sigma_schedule') newSettings[key] = '0:(1)';
        if (key === 'threshold_schedule') newSettings[key] = '0:(0)';
        if (key === 'aspect_ratio_schedule') newSettings[key] = '0:(1)';
        if (key === 'near_schedule') newSettings[key] = '0:(200)';
        if (key === 'far_schedule') newSettings[key] = '0:(10000)';
        if (key === 'image_strength_schedule') newSettings[key] = '0:(0.75)';
      } else {
        newSettings[key] = String(newSettings[key]);
      }
    }
  }
  // FINAL CATCH-ALL: convert any remaining null/undefined to empty string
  for (const key in newSettings) {
    if (newSettings[key] == null) {
      newSettings[key] = '';
    }
  }
  return newSettings;
};

// Add template definitions
const TEMPLATES = [
  {
    label: "Epic Movie Poster (Default)",
    value: "epic_movie_poster",
    settings: {
      text_prompts: {
        "0": "masterpiece, ___________ epic scene, vibrant colors, full hd, full body, dynamic lighting, ultra-high detail, dramatic lighting, movie poster style, asymmetric composition, photorealistic, unreal engine, concept art",
        "30": "masterpiece, ___________ epic scene, vibrant colors, full hd, full body, dynamic lighting, ultra-high detail, dramatic lighting, movie poster style, asymmetric composition, photorealistic, unreal engine, concept art",
        "60": "masterpiece, ___________ epic scene, vibrant colors, full hd, full body, dynamic lighting, ultra-high detail, dramatic lighting, movie poster style, asymmetric composition, photorealistic, unreal engine, concept art",
        "90": "masterpiece, ___________ epic scene, vibrant colors, full hd, full body, dynamic lighting, ultra-high detail, dramatic lighting, movie poster style, asymmetric composition, photorealistic, unreal engine, concept art",
        "150": "masterpiece, ___________ epic scene, vibrant colors, full hd, full body, dynamic lighting, ultra-high detail, dramatic lighting, movie poster style, asymmetric composition, photorealistic, unreal engine, concept art",
        "240": "masterpiece, ___________ epic scene, vibrant colors, full hd, full body, dynamic lighting, ultra-high detail, dramatic lighting, movie poster style, asymmetric composition, photorealistic, unreal engine, concept art",
        "350": "masterpiece, ___________ epic scene, vibrant colors, full hd, full body, dynamic lighting, ultra-high detail, dramatic lighting, movie poster style, asymmetric composition, photorealistic, unreal engine, concept art",
        "480": "masterpiece, ___________ epic scene, vibrant colors, full hd, full body, dynamic lighting, ultra-high detail, dramatic lighting, movie poster style, asymmetric composition, photorealistic, unreal engine, concept art"
      },
      strength_schedule: "0:(0.65),25:(0.55)",
      translation_x: "0:(0),30:(15),210:(15),300:(0)",
      translation_y: "0:(0)",
      translation_z: "0:(0.2),60:(10),300:(15)",
      rotation_3d_x: "0:(0),60:(0),90:(0.5),180:(0.5),300:(0.5)",
      rotation_3d_y: "0:(0),30:(-3.5),90:(-2.5),180:(-2.8),300:(-2),420:(0)",
      rotation_3d_z: "0:(0),60:(0.2),90:(0),180:(-0.5),300:(0),420:(0.5),500:(0.8)",
      fov_schedule: "0:(120)",
      noise_schedule: "0:(-0.06*(cos(3.141*t/15)**100)+0.06)",
      amount_schedule: "0:(0.05)"
    }
  }
];

const VideoGeneratorPage: React.FC = () => {
  const [deforumSettings, setDeforumSettings] = useState(DEFAULT_DEFORUM_SETTINGS);
  const [videos, setVideos] = useState<{ filename: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [initImage, setInitImage] = useState<string | null>(null);
  const [selectedNegativeTags, setSelectedNegativeTags] = useState<string[]>([]);
  const [showAllNegativeTags, setShowAllNegativeTags] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE_PROMPT);
  const [model, setModel] = useState(MODEL_OPTIONS[0].value);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [promptJson, setPromptJson] = useState<Record<string, string>>(() => ({
    "0": "tiny cute bunny, vibrant diffraction, highly detailed, intricate, ultra hd, sharp photo, crepuscular rays, in focus",
    "30": "anthropomorphic clean cat, surrounded by fractals, epic angle and pose, symmetrical, 3d, depth of field",
    "60": "a beautiful coconut --neg photo, realistic",
    "90": "a beautiful durian, award winning photography"
  }));
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].value);

  const fetchVideos = async () => {
    try {
      const res = await fetch(getApiUrl('/api/generated-videos'));
      const data = await res.json();
      setVideos(data.videos || []);
    } catch (err) {
      setMessage('Failed to fetch videos.');
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const pollJobStatus = async (batchId: string) => {
    const statusUrl = getSdApiUrl(`${API_CONFIG.SD_DEFORUM}/batches?id=${batchId}`);
    let isComplete = false;
    setMessage('Video is being generated...');
    while (!isComplete) {
      const res = await fetch(statusUrl);
      const data = await res.json();
      if (data.status === 'completed' && data.output_video_url) {
        isComplete = true;
        setMessage('Video generation complete!');
        setVideoUrl(data.output_video_url);
        setLoading(false);
        setBatchId(null);
      } else {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      }
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setMessage(null);
    setVideoUrl(null);
    setBatchId(null);
    let promptToUse = deforumSettings.text_prompts["0"][0];
    const useInit = !!(initImage && deforumSettings.init_image);
    try {
      const safeSettings = ensureStringSchedules({
        ...deforumSettings,
        text_prompts: { ...deforumSettings.text_prompts, "0": [promptToUse] },
        model,
        use_init: useInit,
        init_image: useInit ? deforumSettings.init_image : ''
      });
      console.log('Sending settings:', safeSettings);
      const res = await fetch(getSdApiUrl(API_CONFIG.SD_DEFORUM), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safeSettings)
      });
      const data = await res.json();
      if (res.ok && data.batch_id) {
        setMessage(`Job submitted! Batch ID: ${data.batch_id}`);
        setBatchId(data.batch_id);
        pollJobStatus(data.batch_id);
      } else {
        setMessage('Failed to submit job: ' + (data.detail || 'Unknown error'));
        setLoading(false);
      }
    } catch (err) {
      setMessage('Failed to submit job.');
      setLoading(false);
    }
  };

  const handleStopProcessing = async () => {
    if (!batchId) return;
    setLoading(false);
    setBatchId(null);
    setMessage('Stopping job...');
    try {
      const res = await fetch(getSdApiUrl(`${API_CONFIG.SD_DEFORUM}/stop`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId })
      });
      if (res.ok) {
        setMessage('Job stopped.');
      } else {
        setMessage('Failed to stop job.');
      }
    } catch (err) {
      setMessage('Failed to stop job.');
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setDeforumSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setMessage('Please upload an image file');
      return;
    }

    // Create FormData and append the file
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(getApiUrl('/api/upload-image'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setInitImage(data.url);
      setDeforumSettings(prev => ({
        ...prev,
        init_image: data.path, // Use the path instead of URL
        use_init: true
      }));
      setMessage('Image uploaded successfully');
    } catch (error) {
      setMessage('Failed to upload image: ' + (error instanceof Error ? error.message : 'Unknown error'));
      console.error('Upload error:', error);
    }
  };

  const handleRemoveInitImage = () => {
    setInitImage(null);
    setDeforumSettings(prev => ({
      ...prev,
      init_image: '',
      use_init: false
    }));
  };

  const handleTagClick = (tag: string) => {
    setSelectedNegativeTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  useEffect(() => {
    const tagPrompt = selectedNegativeTags.join(', ');
    setNegativePrompt(tagPrompt ? `${DEFAULT_NEGATIVE_PROMPT}, ${tagPrompt}` : DEFAULT_NEGATIVE_PROMPT);
    // Update deforum settings with the new negative prompt
    setDeforumSettings(prev => ({
      ...prev,
      animation_prompts_negative: tagPrompt ? `${DEFAULT_NEGATIVE_PROMPT}, ${tagPrompt}` : DEFAULT_NEGATIVE_PROMPT
    }));
  }, [selectedNegativeTags]);

  // Template handler
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const template = TEMPLATES.find(t => t.value === e.target.value);
    if (template) {
      setSelectedTemplate(template.value);
      // Always ensure these keys exist and are arrays of strings
      const keys = ["0", "30", "60", "90"];
      const templatePrompts: Record<string, string> = template.settings.text_prompts as Record<string, string>;
      const textPromptsArrayFormat: { [k: string]: string[] } = {};
      for (const k of keys) {
        const v = templatePrompts[k];
        textPromptsArrayFormat[k] = v ? [v] : [""];
      }
      // Add any extra keys from the template
      for (const [k, v] of Object.entries(templatePrompts)) {
        if (!keys.includes(k)) textPromptsArrayFormat[k] = [v];
      }
      // Remove text_prompts from ...template.settings to avoid type conflict
      const { text_prompts, ...otherSettings } = template.settings;
      setDeforumSettings(prev => ({
        ...prev,
        ...otherSettings,
        text_prompts: textPromptsArrayFormat as {
          "0": string[];
          "30": string[];
          "60": string[];
          "90": string[];
          [k: string]: string[];
        },
      }));
      // For the textarea, keep as { [k: string]: string }
      setPromptJson(templatePrompts);
    }
  };

  // Add handlePromptJsonChange function
  const handlePromptJsonChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      setPromptJson(parsed);
      // Update deforum settings with the new prompts
      setDeforumSettings(prev => ({
        ...prev,
        text_prompts: Object.entries(parsed).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: [String(value)]
        }), {
          "0": [""],
          "30": [""],
          "60": [""],
          "90": [""]
        })
      }));
    } catch (error) {
      console.error('Invalid JSON:', error);
    }
  };

  console.log('loading:', loading, 'batchId:', batchId);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24, position: 'relative' }}>
      {/* Template Dropdown */}
      <div style={{ marginBottom: 16 }}>
        <label><b>Template:</b></label><br />
        <select value={selectedTemplate} onChange={handleTemplateChange} style={{ width: '100%', minHeight: 32 }}>
          {TEMPLATES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      {/* Pulsating logo overlay when loading */}
      {loading && (
        <div className="centered-logo-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1000,
          background: 'rgba(255,255,255,0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src="/images/android-chrome-512x512.png"
            alt="Deepthink AI Logo"
            className="pulsate-logo"
            style={{ width: 120, height: 120 }}
          />
          <div className="pulsate-thinking" style={{ fontSize: 24, fontWeight: 600, marginTop: 24, color: '#1976d2', textAlign: 'center' }}>
            Generating Video…
          </div>
          <div style={{ fontSize: 16, color: '#888', fontStyle: 'italic', marginTop: 8, textAlign: 'center' }}>
            This may take a few minutes. You can stop the job at any time.
          </div>
          {batchId && (
            <button
              onClick={handleStopProcessing}
              style={{
                background: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                padding: '12px 28px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 20,
                marginTop: 32,
                boxShadow: '0 2px 8px rgba(255, 68, 68, 0.12)'
              }}
            >
              Stop Processing
            </button>
          )}
        </div>
      )}
      <h1>AI Video Maker</h1>
      <form style={{ marginBottom: 24 }} onSubmit={e => e.preventDefault()}>
        <div style={{ marginBottom: 12 }}>
          <label><b>Prompts</b></label>
          <div style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>
            full prompts list in a JSON format. value on left side is the frame number
          </div>
          <textarea
            value={JSON.stringify(promptJson, null, 2)}
            onChange={e => handlePromptJsonChange(e.target.value)}
            style={{ width: '100%', minHeight: 120, fontFamily: 'monospace', fontSize: 14 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label><b>Initial Image:</b></label><br />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ flex: 1 }}
            />
            {initImage && (
              <div style={{ width: 100, height: 100, position: 'relative' }}>
                <img 
                  src={initImage} 
                  alt="Initial" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    borderRadius: 4
                  }} 
                />
                <button
                  onClick={handleRemoveInitImage}
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    background: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <small style={{ color: '#666' }}>
            Upload an initial image to start the video generation from. This helps maintain consistency in the generated video. If you do not upload an image, the video will be generated from the prompt only.
          </small>
        </div>
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label><b>Seed:</b></label><br />
            <input
              type="number"
              value={deforumSettings.seed}
              onChange={e => handleFieldChange('seed', Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label><b>Steps:</b></label><br />
            <input
              type="number"
              value={deforumSettings.steps}
              onChange={e => handleFieldChange('steps', Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label><b>Width:</b></label><br />
            <input
              type="number"
              value={deforumSettings.W}
              onChange={e => handleFieldChange('W', Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label><b>Height:</b></label><br />
            <input
              type="number"
              value={deforumSettings.H}
              onChange={e => handleFieldChange('H', Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label><b>Max Frames:</b></label><br />
            <input
              type="number"
              value={deforumSettings.max_frames}
              onChange={e => handleFieldChange('max_frames', Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label><b>Sampler:</b></label><br />
            <select
              value={deforumSettings.sampler}
              onChange={e => handleFieldChange('sampler', e.target.value)}
              style={{ width: '100%' }}
            >
              {SAMPLERS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label><b>Scale (CFG):</b></label><br />
            <input
              type="number"
              value={deforumSettings.strength}
              onChange={e => handleFieldChange('strength', Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label><b>Animation Mode:</b></label><br />
            <select
              value={deforumSettings.animation_mode}
              onChange={e => handleFieldChange('animation_mode', e.target.value)}
              style={{ width: '100%' }}
            >
              {ANIMATION_MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label><b>Strength Schedule:</b> <span title={SCHEDULE_EXAMPLES.strength} style={{ cursor: 'help', color: '#888' }}>?</span></label><br />
            <input
              type="text"
              value={deforumSettings.strength_schedule}
              onChange={e => handleFieldChange('strength_schedule', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label><b>FOV Schedule:</b> <span title={SCHEDULE_EXAMPLES.fov} style={{ cursor: 'help', color: '#888' }}>?</span></label><br />
            <input
              type="text"
              value={deforumSettings.fov_schedule}
              onChange={e => handleFieldChange('fov_schedule', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label><b>Model:</b></label><br />
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            style={{ width: '100%', minHeight: 32 }}
          >
            {MODEL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button type="button" onClick={() => setShowAdvanced(v => !v)} style={{ marginBottom: 12 }}>
          {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
        </button>
        {showAdvanced && (
          <div style={{ marginBottom: 12, border: '1px solid #ccc', borderRadius: 4, padding: 12 }}>
            <div style={{ marginBottom: 8 }}>
              <label><b>Noise Schedule:</b></label><br />
              <input
                type="text"
                value={deforumSettings.noise_schedule || ''}
                onChange={e => handleFieldChange('noise_schedule', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <label><b>Negative Prompt:</b></label><br />
          <textarea
            value={negativePrompt}
            onChange={e => {
              setNegativePrompt(e.target.value);
              setDeforumSettings(prev => ({
                ...prev,
                animation_prompts_negative: e.target.value
              }));
            }}
            style={{ width: '100%', minHeight: 60 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <Typography variant="subtitle2" gutterBottom>Common Negative Prompts:</Typography>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {mostUsedNegativeTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  background: selectedNegativeTags.includes(tag) ? '#1976d2' : 'white',
                  color: selectedNegativeTags.includes(tag) ? 'white' : 'black',
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowAllNegativeTags(v => !v)}
            style={{ marginBottom: 8, fontSize: 12 }}
          >
            {showAllNegativeTags ? 'Hide All Tags' : 'Show All Tags'}
          </button>
          {showAllNegativeTags && (
            <div>
              {Object.entries(negativePromptTags).map(([category, tags]) => (
                <div key={category} style={{ marginBottom: 8 }}>
                  <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
                    {category}:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          border: '1px solid #ccc',
                          background: selectedNegativeTags.includes(tag) ? '#1976d2' : 'white',
                          color: selectedNegativeTags.includes(tag) ? 'white' : 'black',
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label><b>Zoom Schedule:</b> <span title="e.g. 0: (1.04) or schedule expression" style={{ cursor: 'help', color: '#888' }}>?</span></label><br />
            <input
              type="text"
              value={deforumSettings.zoom}
              onChange={e => handleFieldChange('zoom', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label><b>Angle Schedule:</b> <span title="e.g. 0: (0.2) or schedule expression" style={{ cursor: 'help', color: '#888' }}>?</span></label><br />
            <input
              type="text"
              value={deforumSettings.angle}
              onChange={e => handleFieldChange('angle', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label><b>Translation X Schedule:</b> <span title="e.g. 0: (0) or schedule expression" style={{ cursor: 'help', color: '#888' }}>?</span></label><br />
            <input
              type="text"
              value={deforumSettings.translation_x}
              onChange={e => handleFieldChange('translation_x', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label><b>Translation Y Schedule:</b> <span title="e.g. 0: (0) or schedule expression" style={{ cursor: 'help', color: '#888' }}>?</span></label><br />
            <input
              type="text"
              value={deforumSettings.translation_y}
              onChange={e => handleFieldChange('translation_y', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label><b>Color Coherence:</b></label><br />
            <select
              value={deforumSettings.color_coherence}
              onChange={e => handleFieldChange('color_coherence', e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="LAB">LAB</option>
              <option value="RGB">RGB</option>
              <option value="None">None</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label><b>Animation Prompts (Positive):</b></label><br />
          <textarea
            value={deforumSettings.animation_prompts_positive}
            onChange={e => handleFieldChange('animation_prompts_positive', e.target.value)}
            style={{ width: '100%', minHeight: 40 }}
          />
        </div>
      </form>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            marginBottom: 0,
            fontSize: 20,
            padding: '16px 36px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            boxShadow: '0 2px 12px rgba(25, 118, 210, 0.15)',
            letterSpacing: 1,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            outline: 'none',
            opacity: loading ? 0.7 : 1
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#1565c0')}
          onMouseOut={e => (e.currentTarget.style.background = '#1976d2')}
        >
          {loading ? 'Generating...' : 'Generate Video'}
        </button>
      </div>
      {message && <div style={{ marginBottom: 16, color: 'green' }}>{message}</div>}
      {videoUrl && (
        <div style={{ marginBottom: 24 }}>
          <h3>Generated Video</h3>
          <video src={videoUrl} controls width={320} style={{ display: 'block', marginBottom: 8 }} />
          <a href={videoUrl} download target="_blank" rel="noopener noreferrer">Download Video</a>
        </div>
      )}
      <button type="button" onClick={() => setShowJson(v => !v)} style={{ marginBottom: 8 }}>
        {showJson ? 'Hide Settings JSON' : 'Show Settings JSON'}
      </button>
      {showJson && (
        <div style={{ marginBottom: 24 }}>
          <label><b>Current Settings (JSON):</b></label>
          <pre style={{ background: '#f4f4f4', padding: 12, borderRadius: 4, maxHeight: 300, overflow: 'auto', fontSize: 12 }}>
            {JSON.stringify(deforumSettings, null, 2)}
          </pre>
        </div>
      )}
      <h2>Generated Videos</h2>
      {videos.length === 0 && <div>No videos found.</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {videos.map(video => (
          <li key={video.filename} style={{ marginBottom: 24 }}>
            <div><strong>{video.filename}</strong></div>
            <video width="320" controls style={{ display: 'block', marginTop: 8 }}>
              <source src={getApiUrl(video.url)} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div>
              <a href={getApiUrl(video.url)} target="_blank" rel="noopener noreferrer">Download</a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VideoGeneratorPage; 