import React, { useState, useRef } from "react";
import { Box, Typography, TextField, Button, Alert, CircularProgress } from "@mui/material";
import "./MonetizationPlannerPage.css";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MonetizationPlannerPage: React.FC = () => {
  const [niche, setNiche] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    setPlan("");
    setError(null);
    setLoading(true);
    abortController.current = new AbortController();
    try {
      const response = await fetch("/api/monetize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche }),
        signal: abortController.current.signal,
      });
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullPlan = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // Process SSE chunks
        let sseLines = buffer.split("\n\n");
        buffer = sseLines.pop() || ""; // last incomplete chunk stays in buffer
        for (const sse of sseLines) {
          if (sse.startsWith("data: ")) {
            try {
              const jsonStr = sse.replace(/^data: /, "");
              const data = JSON.parse(jsonStr);
              if (typeof data.plan === "string") {
                console.log("Received plan chunk:", data.plan);
                fullPlan += data.plan;
                setPlan(fullPlan);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
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

  return (
    <>
      <Box sx={{ minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: -1, backgroundImage: 'url(/images/android-chrome-512x512.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
      <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', background: 'rgba(255,255,255,0.85)' }}>
        <Box sx={{ maxWidth: 600, mx: "auto", mt: 6, p: 2, position: "relative", minHeight: 400 }}>
          {loading && (
            <Box className="centered-logo-overlay">
              <img
                src="/images/android-chrome-512x512.png"
                alt="Deepthink AI Logo"
                className="pulsate-logo"
                style={{ width: 120, height: 120 }}
              />
              <Typography className="pulsate-thinking" variant="h6" sx={{ mt: 2 }}>
                Thinking
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: '#888', fontStyle: 'italic' }}>
                Response can take 2-5 minutes
              </Typography>
            </Box>
          )}
          <Typography variant="h4" gutterBottom>
            DeepThink AI Monetization Planner
          </Typography>
          <Typography variant="body1" gutterBottom>
            Enter your niche or topic below to generate a comprehensive monetization blueprint for YouTube and blogs.
          </Typography>
          <TextField
            label="Your Niche"
            variant="outlined"
            fullWidth
            value={niche}
            onChange={e => setNiche(e.target.value)}
            sx={{ my: 2 }}
            disabled={loading}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerate}
              disabled={!niche.trim() || loading}
            >
              Generate Plan
            </Button>
            {loading && (
              <Button variant="outlined" color="secondary" onClick={handleStop}>
                Stop
              </Button>
            )}
          </Box>
          {loading && (
            <Box sx={{ display: "flex", alignItems: "center", mt: 2, visibility: "hidden" }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography variant="body2">Generating plan...</Typography>
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          )}
          {plan && (
            <Box sx={{ mt: 4, mb: 2, px: { xs: 0, sm: 2 } }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Generated Monetization Plan
              </Typography>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {plan}
              </ReactMarkdown>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

export default MonetizationPlannerPage; 