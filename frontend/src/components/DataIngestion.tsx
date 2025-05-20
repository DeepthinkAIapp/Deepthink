import { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  CircularProgress,
  Paper,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface DataIngestionProps {
  onDataIngested: (data: { title: string; content: string; source: string }) => void;
}

// Utility to add paragraph breaks after sentences
function addParagraphs(text: string) {
  // Add two newlines after a period followed by a space and a capital letter
  return text.replace(/([.?!]) ([A-Z])/g, '$1\n\n$2');
}

const RAG_BACKEND_URL = 'http://localhost:8001';

const DataIngestion = ({ onDataIngested }: DataIngestionProps) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New states for custom ingestion
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [customSource, setCustomSource] = useState('User');
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [customSuccess, setCustomSuccess] = useState<string | null>(null);

  const fetchWikidata = async (searchTerm: string) => {
    try {
      const response = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(`
        SELECT ?item ?itemLabel ?itemDescription 
               ?birthDate ?deathDate ?occupation ?occupationLabel
               ?notableWork ?notableWorkLabel
        WHERE {
          SERVICE wikibase:mwapi {
            bd:serviceParam wikibase:api "EntitySearch" .
            bd:serviceParam wikibase:endpoint "www.wikidata.org" .
            bd:serviceParam mwapi:search "${searchTerm}" .
            bd:serviceParam mwapi:language "en" .
            ?item wikibase:apiOutputItem mwapi:item .
          }
          OPTIONAL { ?item wdt:P569 ?birthDate . }
          OPTIONAL { ?item wdt:P570 ?deathDate . }
          OPTIONAL { ?item wdt:P106 ?occupation . }
          OPTIONAL { ?item wdt:P800 ?notableWork . }
          SERVICE wikibase:label { 
            bd:serviceParam wikibase:language "en" .
            ?occupation rdfs:label ?occupationLabel .
            ?notableWork rdfs:label ?notableWorkLabel .
          }
        }
        LIMIT 1
      `)}`);
      
      const data = await response.json();
      
      // Check if we have results and the required fields
      if (!data.results?.bindings?.length) {
        return null;
      }

      const result = data.results.bindings[0];
      
      // Ensure we have at least a label
      if (!result.itemLabel?.value) {
        return null;
      }
      
      // Format the data into a more detailed description
      let content = result.itemDescription?.value || 'No description available';
      
      // Add birth and death dates if available
      if (result.birthDate?.value) {
        try {
          const birthDate = new Date(result.birthDate.value);
          if (!isNaN(birthDate.getTime())) {
            content += `\n\nBorn: ${birthDate.toLocaleDateString()}`;
          }
        } catch (e) {
          console.warn('Error formatting birth date:', e);
        }
      }
      
      if (result.deathDate?.value) {
        try {
          const deathDate = new Date(result.deathDate.value);
          if (!isNaN(deathDate.getTime())) {
            content += `\n\nDied: ${deathDate.toLocaleDateString()}`;
          }
        } catch (e) {
          console.warn('Error formatting death date:', e);
        }
      }
      
      // Add occupation if available
      if (result.occupationLabel?.value) {
        content += `\n\nOccupation: ${result.occupationLabel.value}`;
      }
      
      // Add notable works if available
      if (result.notableWorkLabel?.value) {
        content += `\n\nNotable Work: ${result.notableWorkLabel.value}`;
      }
      
      // Add paragraph breaks
      content = addParagraphs(content);
      
      return {
        title: result.itemLabel.value,
        content: content,
        source: 'Wikidata'
      };
    } catch (err) {
      console.error('Error fetching Wikidata:', err);
      throw new Error('Failed to fetch Wikidata information');
    }
  };

  const fetchWikipedia = async (searchTerm: string) => {
    try {
      // First, get the page ID
      const searchResponse = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&format=json&origin=*`
      );
      const searchData = await searchResponse.json();
      
      if (searchData.query.search.length === 0) {
        return null;
      }

      const pageId = searchData.query.search[0].pageid;
      
      // Then, get the extract
      const extractResponse = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&pageids=${pageId}&format=json&origin=*`
      );
      const extractData = await extractResponse.json();
      
      const page = extractData.query.pages[pageId];
      let content = page.extract;
      
      // Add paragraph breaks
      content = addParagraphs(content);
      
      return {
        title: page.title,
        content: content,
        source: 'Wikipedia'
      };
    } catch (err) {
      console.error('Error fetching Wikipedia:', err);
      throw new Error('Failed to fetch Wikipedia information');
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let data = await fetchWikidata(query);
      if (!data) {
        data = await fetchWikipedia(query);
      }
      if (data) {
        onDataIngested(data);
        setSuccess('Data ingested from search!');
      } else {
        setError('No information found for this query');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  // New: handle custom ingestion
  const handleCustomIngest = async () => {
    setCustomError(null);
    setCustomSuccess(null);
    if (!customTitle.trim() || !customContent.trim()) {
      setCustomError('Title and content are required.');
      return;
    }
    setCustomLoading(true);
    try {
      const res = await fetch(`${RAG_BACKEND_URL}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle,
          content: customContent,
          source: customSource || 'User',
        })
      });
      if (!res.ok) throw new Error('Failed to ingest data');
      setCustomSuccess('Custom data ingested successfully!');
      setCustomTitle('');
      setCustomContent('');
      setCustomSource('User');
    } catch (err) {
      setCustomError(err instanceof Error ? err.message : 'Failed to ingest data');
    } finally {
      setCustomLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Knowledge Base Search
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Wikidata and Wikipedia..."
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
        >
          Search
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 1 }}>{success}</Alert>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Add Custom Knowledge
        </Typography>
        <TextField
          label="Title"
          fullWidth
          size="small"
          value={customTitle}
          onChange={e => setCustomTitle(e.target.value)}
          sx={{ mb: 1 }}
        />
        <TextField
          label="Content"
          fullWidth
          multiline
          minRows={3}
          value={customContent}
          onChange={e => setCustomContent(e.target.value)}
          sx={{ mb: 1 }}
        />
        <TextField
          label="Source (optional)"
          fullWidth
          size="small"
          value={customSource}
          onChange={e => setCustomSource(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Button
          variant="outlined"
          onClick={handleCustomIngest}
          disabled={customLoading}
        >
          {customLoading ? <CircularProgress size={20} /> : 'Ingest Data'}
        </Button>
        {customError && <Alert severity="error" sx={{ mt: 1 }}>{customError}</Alert>}
        {customSuccess && <Alert severity="success" sx={{ mt: 1 }}>{customSuccess}</Alert>}
      </Box>
    </Paper>
  );
};

export default DataIngestion; 