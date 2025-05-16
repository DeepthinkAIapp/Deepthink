import React, { useState, useRef } from "react";
import { Box, Typography, TextField, Button, Paper, Alert, MenuItem, Select, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

const SYSTEM_PROMPT_1 = `You are an experienced content strategist and YouTube expert. Your task is to help a YouTuber generate 5 sub-niche areas and 5 content topic ideas within each sub-niche based on a main niche they provide. The sub-niches and topic ideas should be tailored to do well on YouTube.\n\nProcess:\n1. Ask the YouTuber to provide their main niche of interest.\n2. Generate 5 relevant sub-niches based on the main niche.\n3. For each sub-niche, create 5 YouTube topic ideas that provide value to the target audience and incorporate relevant keywords. Some can also be viral ideas, like "I did X, this happened" kind of thing.\n4. Present the sub-niches and content topic ideas in a clear, organized format.\n5. Offer guidance on how the YouTuber can mix and match or modify the ideas to suit their channel's unique style and voice.\nTips:\n- Use your SEO expertise to identify sub-niches and content topics that have good potential to get views for a beginner on YouTube.\n- Ensure that the content ideas are specific, informative, and targeted to the YouTuber's intended audience.\n- Encourage the YouTuber to create high-quality, engaging content that provides value to their readers.\n- Remind the YouTuber to optimize their content for YouTube, including creating viral thumbnails, and optimizing their videos for retention.`;

const SYSTEM_PROMPT_2 = `You are an experienced content strategist and YouTube expert. Your task is to help a YouTuber generate 20 targeted video ideas within a chosen sub-niche. The video ideas should be tailored to get views for a beginner on YouTube and include informational video ideas to help an audience, as well as personal videos about their own life, like "I did X in the niche, this happened…"\n\nProcess:\n1. Ask the YouTuber to choose one sub-niche from the previously generated list of 5 sub-niches.\n2. Generate 20 video ideas within the chosen sub-niche: a. The video ideas should be helpful to their target audience. At least 10 of them should be based on a target keyword that their audience searches for on YouTube.\n3. Present the 20 video ideas in a table format with two columns: a. Column 1: Clickworthy video title b. Column 2: Target keyword for the article\n4. Offer guidance on how the YouTuber can prioritize and sequence the video ideas based on their goals and target audience.\nTips:\n* Use your SEO expertise to identify long-tail keywords and low-competition topics within the chosen sub-niche.\n* Ensure that the video titles are compelling, informative, and include the target keyword for better YouTube rankings.\n* Encourage the YouTuber to create comprehensive, high-quality content that provides value to their readers and addresses their pain points or questions.\n* Remind the YouTuber to optimize their content for search engines by incorporating the target keyword in meta descriptions, header tags, and throughout the article.`;

// Add fallback parser for unstructured content
function parseSubnichesAndTopics(rawContent: string): { subniches: string[]; topicIdeas: { [key: string]: string[] } } {
  const subnicheRegex = /Sub-?Niche\s*\d*:?\s*([^\n:]+)[\n:]([\s\S]*?)(?=Sub-?Niche|$)/gi;
  const subniches: string[] = [];
  const topicIdeas: { [key: string]: string[] } = {};
  let match: RegExpExecArray | null;
  while ((match = subnicheRegex.exec(rawContent)) !== null) {
    const subnicheTitle = match[1].trim();
    const block = match[2];
    const ideas: string[] = [];
    block.split(/\n|\*/).forEach((line: string) => {
      const idea = line.replace(/^[-*]\s*/, '').trim();
      if (idea && !idea.toLowerCase().startsWith('sub-niche')) {
        ideas.push(idea);
      }
    });
    if (subnicheTitle && ideas.length) {
      subniches.push(subnicheTitle);
      topicIdeas[subnicheTitle] = ideas;
    }
  }
  return { subniches, topicIdeas };
}

const YouTubeContentPlannerPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [niche, setNiche] = useState("");
  const [subniches, setSubniches] = useState<string[]>([]);
  const [topicIdeas, setTopicIdeas] = useState<{ [sub: string]: string[] }>({});
  const [selectedSubniche, setSelectedSubniche] = useState("");
  const [videoIdeas, setVideoIdeas] = useState<{ title: string; keyword: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<string>("");

  // Step 1: Get sub-niches and topic ideas
  const handleGenerateSubniches = async () => {
    setError(null);
    setLoading(true);
    setSubniches([]);
    setTopicIdeas({});
    setSelectedSubniche("");
    setVideoIdeas([]);
    setGuidance("");
    try {
      const response = await fetch("/api/youtube-content-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: SYSTEM_PROMPT_1,
          niche,
        }),
      });
      if (!response.ok) throw new Error("Failed to get sub-niches");
      const data = await response.json();
      if (data.subniches && data.topicIdeas) {
        setSubniches(data.subniches);
        setTopicIdeas(data.topicIdeas);
        setStep(2);
      } else if (data.content) {
        setError(data.content);
      } else {
        setError("Unexpected response from server");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Get video ideas for selected sub-niche
  const handleGenerateVideoIdeas = async () => {
    setError(null);
    setLoading(true);
    setVideoIdeas([]);
    setGuidance("");
    try {
      const response = await fetch("/api/youtube-content-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: SYSTEM_PROMPT_2,
          niche,
          subniche: selectedSubniche,
        }),
      });
      if (!response.ok) throw new Error("Failed to get video ideas");
      const data = await response.json();
      if (data.videoIdeas) {
        setVideoIdeas(data.videoIdeas);
        setGuidance(data.guidance || "");
        setStep(3);
      } else if (data.content) {
        setError(data.content);
      } else {
        setError("Unexpected response from server");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: -1, backgroundImage: 'url(/images/android-chrome-512x512.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
      <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', background: 'rgba(255,255,255,0.85)' }}>
        <Box sx={{ maxWidth: 700, mx: "auto", mt: 6, p: 2, position: "relative", minHeight: 400 }}>
          {/* Step Indicator */}
          <Typography variant="subtitle2" sx={{ mb: 2, color: '#888' }}>
            {step === 1 && "Step 1 of 3"}
            {step === 2 && "Step 2 of 3"}
            {step === 3 && "Step 3 of 3"}
          </Typography>
          <Typography variant="h4" gutterBottom>
            YouTube Content Planner
          </Typography>
          {step === 1 && (
            <>
              <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                Start Your YouTube Content Plan
              </Typography>
              <Typography variant="body1" gutterBottom>
                Welcome! To begin, enter your main niche or area of interest below (e.g., "Personal Finance," "Home Workouts," "AI Tools for Creators").<br />
                We'll help you discover 5 promising sub-niches and 5 video topic ideas for each—perfect for finding your channel's unique angle.
              </Typography>
              <TextField
                label="Main Niche"
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
                  onClick={handleGenerateSubniches}
                  disabled={!niche.trim() || loading}
                >
                  Generate Sub-niches & Ideas
                </Button>
                {loading && (
                  <Button variant="outlined" color="secondary" disabled>
                    Thinking…
                  </Button>
                )}
              </Box>
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#888' }}>
                Tip: The more specific your niche, the better the suggestions!
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                Explore Sub-niches & Topic Ideas
              </Typography>
              <Typography variant="body1" gutterBottom>
                Here are 5 sub-niches and topic ideas tailored to your main niche.<br />
                Browse the list and select the sub-niche that excites you most—we'll then generate 20 targeted video ideas to kickstart your channel.
              </Typography>
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Sub-niches & Topic Ideas
              </Typography>
              {/* Fallback: If error/content string and no subniches, try to parse and display as subniches/topics */}
              {error && subniches.length === 0 ? (() => {
                const { subniches: fallbackSubs, topicIdeas: fallbackIdeas } = parseSubnichesAndTopics(error);
                if (fallbackSubs.length) {
                  return fallbackSubs.map((sub: string) => (
                    <Paper key={sub} elevation={2} sx={{ mt: 2, p: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{sub}</Typography>
                      <ul>
                        {fallbackIdeas[sub]?.map((idea: string, idx: number) => (
                          <li key={idx}>{idea}</li>
                        ))}
                      </ul>
                    </Paper>
                  ));
                } else {
                  return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
                }
              })() : (
                subniches.map((sub: string) => (
                  <Paper key={sub} elevation={2} sx={{ mt: 2, p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{sub}</Typography>
                    <ul>
                      {topicIdeas[sub]?.map((idea: string, idx: number) => (
                        <li key={idx}>{idea}</li>
                      ))}
                    </ul>
                  </Paper>
                ))
              )}
              <Typography variant="body1" sx={{ mt: 3 }}>
                Select a sub-niche to generate 20 targeted video ideas:
              </Typography>
              <FormControl fullWidth sx={{ my: 2 }}>
                <InputLabel id="subniche-select-label">Sub-niche</InputLabel>
                <Select
                  labelId="subniche-select-label"
                  value={selectedSubniche}
                  label="Sub-niche"
                  onChange={e => setSelectedSubniche(e.target.value)}
                  disabled={loading}
                >
                  {(error && subniches.length === 0
                    ? parseSubnichesAndTopics(error).subniches
                    : subniches
                  ).map((sub: string) => (
                    <MenuItem key={sub} value={sub}>{sub}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGenerateVideoIdeas}
                  disabled={!(selectedSubniche || (error && error.startsWith('Title:'))) || loading}
                >
                  Generate 20 Video Ideas
                </Button>
                {loading && (
                  <Button variant="outlined" color="secondary" disabled>
                    Thinking…
                  </Button>
                )}
              </Box>
              {/* Only show error if not a fallback content string */}
              {error && !error.startsWith('Title:') && (
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
              )}
            </>
          )}
          {step === 3 && videoIdeas.length > 0 && (
            <>
              <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                20 YouTube Video Ideas for {selectedSubniche}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Here are 20 video ideas (with target keywords) for your chosen sub-niche.<br />
                Use these to plan your content calendar, or mix and match to fit your style.<br />
                Scroll down for expert guidance on how to prioritize and sequence your videos for maximum growth.
              </Typography>
              <TableContainer sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Video Title</TableCell>
                      <TableCell>Target Keyword</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {videoIdeas.map((idea, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{idea.title}</TableCell>
                        <TableCell>{idea.keyword}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {guidance && (
                <Paper elevation={2} sx={{ mt: 3, p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Guidance</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>{guidance}</Typography>
                </Paper>
              )}
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
              )}
            </>
          )}
        </Box>
      </Box>
    </>
  );
};

export default YouTubeContentPlannerPage; 