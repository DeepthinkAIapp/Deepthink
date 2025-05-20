import React, { useState } from 'react';
import { Box, Typography, useTheme, MenuItem, Select } from '@mui/material';
import { getApiUrl } from '../config';
import { Helmet } from 'react-helmet-async';

const LABELS = ['Domain Rating', 'Backlinks', 'Linking Websites'];

export default function WebsiteAuthorityCheckerPage() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<string[]>([]);
  const [scope, setScope] = useState('subdomains');
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMetrics([]);
    try {
      const res = await fetch(getApiUrl('/api/authority-checker'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (data.html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.html;
        const spans = Array.from(tempDiv.querySelectorAll('span'));
        const numbers = spans.map(span => span.textContent?.trim() || '').filter(Boolean);
        setMetrics(numbers.slice(0, 3));
      } else {
        setError('No results found');
      }
    } catch (err) {
      setError('Error fetching results');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#323b4a' }}>
      <Helmet>
        <title>Website Authority Checker | DeepThink AI</title>
        <meta name="description" content="Check your website's authority with DeepThink AI's Website Authority Checker. Get insights on domain rating, backlinks, and linking websites." />
        <link rel="canonical" href="https://www.deepthinkai.app/website-authority-checker" />
        <meta property="og:title" content="Website Authority Checker | DeepThink AI" />
        <meta property="og:description" content="Check your website's authority with DeepThink AI's Website Authority Checker. Get insights on domain rating, backlinks, and linking websites." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.deepthinkai.app/website-authority-checker" />
        <meta property="og:image" content="https://www.deepthinkai.app/images/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Website Authority Checker | DeepThink AI" />
        <meta name="twitter:description" content="Check your website's authority with DeepThink AI's Website Authority Checker. Get insights on domain rating, backlinks, and linking websites." />
        <meta name="twitter:image" content="https://www.deepthinkai.app/images/logo.png" />
        <meta name="twitter:url" content="https://www.deepthinkai.app/website-authority-checker" />
      </Helmet>
      {/* Hero/Header Section */}
      <Box sx={{
        bgcolor: '#323b4a',
        color: '#fff',
        px: { xs: 2, sm: 6 },
        pt: 6,
        pb: 4,
        borderBottom: '1px solid #2a3140',
        maxWidth: '100vw',
      }}>
        <Typography variant="body2" sx={{ color: '#bfc7d5', mb: 1, fontWeight: 500 }}>
          Free SEO Tools /
        </Typography>
        <Typography variant="h2" sx={{ fontWeight: 700, fontSize: { xs: 36, sm: 56 }, mb: 2, letterSpacing: -1 }}>
          Backlink Checker
        </Typography>
        <Typography variant="body1" sx={{ color: '#e0e6ef', fontSize: 20, maxWidth: 700, mb: 3 }}>
          Try the free version of DeepThink AI's Backlink Checker. Get a glimpse into the power of our premium tool.
        </Typography>
        {/* Tab Navigation */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, fontSize: 18, fontWeight: 500 }}>
          <Box
            component="a"
            href="/website-authority-checker"
            sx={{
              color: '#ff9900',
              borderBottom: '2px solid #ff9900',
              pb: 0.5,
              cursor: 'pointer',
              textDecoration: 'none',
              mr: 2
            }}
          >
            DeepThink AI Backlink Checker
          </Box>
          <Box
            component="a"
            href="/website-authority-checker"
            sx={{
              color: '#bfc7d5',
              textDecoration: 'none',
              pb: 0.5,
              '&:hover': { color: '#fff' },
              borderBottom: 'none',
            }}
          >
            Website Authority Checker
          </Box>
        </Box>
        {/* Input Row */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, maxWidth: 700, marginBottom: 8 }}>
        <input
          value={domain}
          onChange={e => setDomain(e.target.value)}
            placeholder="Enter domain or URL"
          style={{
              flex: 2,
              padding: '12px 16px',
              fontSize: 20,
            borderRadius: 4,
              border: '1px solid #4a5368',
              color: '#fff',
              background: '#2a3140',
              outline: 'none',
              fontWeight: 500,
            }}
          />
          <Select
            value={scope}
            onChange={e => setScope(e.target.value)}
            variant="outlined"
            sx={{
              minWidth: 150,
              bgcolor: '#2a3140',
              color: '#fff',
              borderRadius: 1,
              border: '1px solid #4a5368',
              fontSize: 18,
              fontWeight: 500,
              '.MuiOutlinedInput-notchedOutline': { border: 0 },
              '& .MuiSelect-icon': { color: '#fff' },
            }}
            size="small"
            displayEmpty
          >
            <MenuItem value="subdomains" sx={{ color: '#222' }}>Subdomains</MenuItem>
            <MenuItem value="exact" sx={{ color: '#222' }}>Exact URL</MenuItem>
            <MenuItem value="domain" sx={{ color: '#222' }}>Domain</MenuItem>
          </Select>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0 32px',
              fontSize: 20,
              borderRadius: 4,
              background: '#ff9900',
              color: '#fff',
              fontWeight: 700,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              height: 48,
              transition: 'background 0.2s',
              boxShadow: '0 2px 8px #ff990033',
            }}
          >
            {loading ? 'Checking...' : 'Check backlinks'}
        </button>
      </form>
        <Typography variant="body2" sx={{ color: '#bfc7d5', mt: 1, fontSize: 16 }}>
          For example, <span style={{ color: '#fff' }}>ahrefs.com</span> <span style={{ color: '#fff' }}>yelp.com</span>
        </Typography>
      </Box>
      {/* Results Section */}
      <Box sx={{ maxWidth: 700, mx: 'auto', mt: 6, p: 3, background: '#fff', borderRadius: 3, boxShadow: '0 2px 12px #0001', position: 'relative' }}>
      {loading && (
        <Box className="centered-logo-overlay">
          <img
              src="/images/blog/logo.png"
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
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      {metrics.length === 3 && !loading && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          {metrics.map((num, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', padding: 16, background: '#f7f7fa', borderRadius: 8, margin: '0 8px' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#2d72d9' }}>{num}</div>
              <div style={{ fontSize: 14, color: '#555', marginTop: 8 }}>{LABELS[i]}</div>
            </div>
          ))}
        </div>
      )}
      </Box>
    </Box>
  );
} 