// Cleaned up: removed commented-out code and invalid top-level JSX
import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, TextField, Button, Paper, CircularProgress, Alert, IconButton, Tooltip, Grid, Card, CardMedia, CardContent, CardActions, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from "@mui/material";
import { SketchPicker } from 'react-color';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import "./MonetizationPlannerPage.css";
import { getApiUrl, API_CONFIG } from '../config';
import HelpIcon from '@mui/icons-material/Help';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

// Remove unused imports
// import backgroundImg from '../assets/ai-cyber-girl-bg.jpg';
// import InfoIcon from '@mui/icons-material/Info';

// Remove unused useState for maskImage
// const [maskImage, setMaskImage] = useState<string | null>(null);

// In the ReactSketchCanvas component:
<ReactSketchCanvas
  ref={canvasRef}
  strokeWidth={brushSize}
  strokeColor={brushColor}
  backgroundImage={inputImage}
  exportWithBackgroundImage={true}
  style={{ border: '1px solid #ccc' }}
  strokeStyle="solid"
  paths={defaultStroke.paths}
  allowOnlyPointerType="all"
  canvasColor="transparent"
  exportWithTransparentBackground={true}
  preserveBackgroundImageAspectRatio={true}
/> 