import React, { useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { getApiUrl } from '../config';

const LABELS = ['Domain Rating', 'Backlinks', 'Linking Websites'];

export default function WebsiteAuthorityCheckerPage() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<string[]>([]);
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
        // Extract numbers from the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.html;
        // Find all <span> elements (your numbers)
        const spans = Array.from(tempDiv.querySelectorAll('span'));
        const numbers = spans.map(span => span.textContent?.trim() || '').filter(Boolean);
        setMetrics(numbers.slice(0, 3)); // Only first 3 numbers
      } else {
        setError('No results found');
      }
    } catch (err) {
      setError('Error fetching results');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '2em auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', position: 'relative' }}>
      <h2 style={{
        color: theme.palette.mode === 'dark' ? '#222' : undefined,
        fontWeight: 700,
        marginBottom: 24
      }}>Website Authority Checker</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          value={domain}
          onChange={e => setDomain(e.target.value)}
          placeholder="Enter domain"
          style={{
            flex: 1,
            padding: 8,
            fontSize: 16,
            borderRadius: 4,
            border: '1px solid #ccc',
            color: theme.palette.mode === 'dark' ? '#222' : undefined,
            background: theme.palette.mode === 'dark' ? '#f5f5f5' : undefined
          }}
        />
        <button type="submit" disabled={loading} style={{ padding: '8px 16px', fontSize: 16, borderRadius: 4 }}>
          {loading ? 'Checking...' : 'Check Authority'}
        </button>
      </form>
      {loading && (
        <Box className="centered-logo-overlay">
          <img
            src="/images/logo.png"
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
      {/* Optionally show the raw HTML for debugging */}
      {/* resultHtml && <div dangerouslySetInnerHTML={{ __html: resultHtml }} /> */}
    </div>
  );
} 