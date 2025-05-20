import { Box, Typography, Paper, Button, Link as MuiLink, Divider } from '@mui/material';
import { BlogPost } from '../types/blog';

interface TocSection {
  key: string;
  title: string;
}

interface BlogSidebarProps {
  post: BlogPost;
  tocSections: TocSection[];
}

const BlogSidebar = ({ post, tocSections }: BlogSidebarProps) => {
  const editorial = post.content.editorial;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'sticky', top: 32 }}>
      {/* Meet DeepThink AI */}
      <Paper elevation={2} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
        <Box component="img" src="/images/blog/prompthero-prompt-b6d0d1fd443.webp" alt="DeepThink AI Logo" sx={{ width: 80, height: 80, borderRadius: '50%', mb: 2, border: '2px solid #ff6600' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#ff6600' }}>Meet DeepThink AI</Typography>
        <Typography variant="body2" align="center" sx={{ mb: 2 }}>
          DeepThink AI empowers creators, marketers, and businesses with advanced AI tools for content, SEO, and digital growth. Try our free tools and see the difference for yourself!
        </Typography>
        <Button variant="contained" color="primary" href="/chat" sx={{ bgcolor: '#ff6600', '&:hover': { bgcolor: '#ff8533' }, fontWeight: 700, borderRadius: 2 }}>
          Try DeepThink AI Tools
        </Button>
      </Paper>
      {/* Editorial Process */}
      {editorial && (
        <Paper elevation={1} sx={{ p: 3, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ff6600', mb: 1 }}>Editorial Process</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>{editorial.process}</Typography>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Box component="img" src={editorial.author.image} alt={editorial.author.name} sx={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #ff6600' }} />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{editorial.author.name}</Typography>
          </Box>
        </Paper>
      )}
      {/* Table of Contents */}
      {tocSections.length > 0 && (
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ff6600', mb: 1 }}>Table of Contents</Typography>
          <Box component="ul" sx={{ pl: 2, mb: 0 }}>
            {tocSections.map(({ key, title }) => (
              <li key={key}>
                <MuiLink href={`#section-${key}`} underline="hover" color="primary" sx={{ fontSize: 15 }}>
                  {title}
                </MuiLink>
              </li>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default BlogSidebar; 