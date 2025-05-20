import { Box, Button, Menu, MenuItem, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const navLinks = [
  { label: 'DeepThink AI', to: '/' },
  { label: 'Blog', to: '/blog' },
];

const toolLinks = [
  { label: 'Monetization Planner', to: '/monetization-planner' },
  { label: 'Guest Post Outreach', to: '/guestpost-outreach' },
  { label: 'Search Intent Tool', to: '/search-intent-tool' },
  { label: 'AI Image Generator', to: '/image-generator' },
  { label: 'Content Creator Machine', to: '/content-outline-creator' },
  { label: 'Affiliate Article Ideas', to: '/affiliate-article-ideas' },
  { label: 'YouTube Content Planner', to: '/youtube-content-planner' },
  { label: 'Video Generator', to: '/video-generator' },
  { label: 'Website Authority Checker', to: '/website-authority-checker' },
];

export default function TopNav() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const location = useLocation();

  const handleToolsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleToolsClose = () => setAnchorEl(null);

  // Hide on /chat
  if (location.pathname === '/chat') return null;

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      zIndex: 1200,
      bgcolor: 'background.paper',
      boxShadow: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      px: 2,
      py: 1.5,
    }}>
      {navLinks.map(link => (
        <Button
          key={link.to}
          component={Link}
          to={link.to}
          variant="outlined"
          sx={{
            color: '#ff6600',
            borderColor: '#ff6600',
            background: '#fff',
            fontWeight: 700,
            boxShadow: 2,
            textDecoration: 'none',
            '&:hover': { background: 'rgba(255,102,0,0.08)', borderColor: '#ff6600', textDecoration: 'underline', color: '#ff8533' },
          }}
        >
          {link.label}
        </Button>
      ))}
      <Button
        color="primary"
        variant="outlined"
        onClick={handleToolsClick}
        sx={{
          color: '#ff6600',
          borderColor: '#ff6600',
          background: '#fff',
          fontWeight: 700,
          boxShadow: 2,
          '&:hover': { background: 'rgba(255,102,0,0.08)', borderColor: '#ff6600' },
        }}
        endIcon={<MenuIcon />}
      >
        Tools
      </Button>
      <Menu
        id="tools-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleToolsClose}
        MenuListProps={{ 'aria-labelledby': 'tools-button' }}
        PaperProps={{ sx: { bgcolor: '#fff' } }}
      >
        {toolLinks.map(link => (
          <MenuItem
            key={link.to}
            component={Link}
            to={link.to}
            onClick={handleToolsClose}
            sx={{ color: '#ff6600', fontWeight: 600 }}
          >
            {link.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
} 