import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Avatar,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { signOutUser } from './firebase';

interface Chat {
  id: string;
  title: string;
  messages: any[];
}

interface SidebarProps {
  chats: Chat[];
  currentChatId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  open: boolean;
  onClose: () => void;
  onDeleteChat: (id: string) => void;
}

const DRAWER_WIDTH = 280;

function Sidebar({ chats, currentChatId, onSelectChat, onNewChat, open, onClose, onDeleteChat }: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOutUser();
    window.location.reload();
  };

  const handleSettings = () => {
    // This will be implemented to open the custom instructions dialog
    const event = new CustomEvent('openCustomInstructions');
    window.dispatchEvent(event);
  };

  const drawer = (
    <Box sx={{ 
      width: DRAWER_WIDTH, 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      overflow: 'auto',
      position: 'relative',
      background: 'linear-gradient(to bottom, #ff6600 0%, #ffffff 100%)',
    }}>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '2px solid',
        borderColor: '#ff6600',
        minHeight: 80,
        background: 'linear-gradient(135deg, rgba(255,102,0,0.15) 0%, rgba(255,255,255,0.9) 100%)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 12px rgba(255,102,0,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              position: 'relative',
              width: 44,
              height: 44,
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(255,102,0,0.2)',
              border: '2px solid #ff6600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff'
            }}
          >
            <img 
              src="/images/blog/logo.png" 
              alt="Logo" 
              style={{ 
                height: '100%', 
                width: '100%', 
                objectFit: 'cover'
              }} 
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography 
              sx={{ 
                fontWeight: 800, 
                fontSize: 20, 
                letterSpacing: 1,
                color: '#ff6600',
                textShadow: '0 1px 2px rgba(255,102,0,0.1)',
                lineHeight: 1.2
              }}
            >
              DEEPTHINK AI
            </Typography>
            <Typography 
              sx={{ 
                fontSize: 12, 
                color: 'text.secondary',
                letterSpacing: 0.5,
                fontWeight: 500
              }}
            >
              AI-Powered Tools
            </Typography>
          </Box>
        </Box>
        {isMobile && (
          <IconButton 
            onClick={onClose}
            sx={{
              color: '#ff6600',
              '&:hover': {
                bgcolor: 'rgba(255,102,0,0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <Box>
        <button onClick={onNewChat} style={{ 
          width: '100%', 
          padding: '10px 0', 
          background: '#ff6600', 
          color: '#fff', 
          border: 'none', 
          borderRadius: 6, 
          fontWeight: 600, 
          fontSize: 16, 
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(255, 102, 0, 0.3)'
        }}>
          + New chat
        </button>
      </Box>
      <List sx={{ 
        '& .MuiListItemButton-root': {
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#fff',
          },
          '&.Mui-selected': {
            background: '#ff6600',
            color: '#fff',
            '&:hover': {
              background: '#ff8533',
              color: '#fff',
            }
          },
          color: '#fff',
        },
        '& .MuiListItemText-root': {
          color: '#fff',
        },
      }}>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/blog" onClick={isMobile ? onClose : undefined} sx={{ color: '#fff', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: '#fff' } }}>
            <ListItemText primary="Blog" sx={{ color: '#fff', fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/monetization-planner" onClick={isMobile ? onClose : undefined} sx={{ color: '#fff', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: '#fff' } }}>
            <ListItemText primary="Monetization Planner" sx={{ color: '#fff', fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/guestpost-outreach" onClick={isMobile ? onClose : undefined} sx={{ color: '#fff', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: '#fff' } }}>
            <ListItemText primary="Guest Post Outreach" sx={{ color: '#fff', fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/search-intent-tool" onClick={isMobile ? onClose : undefined} sx={{ color: '#fff', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: '#fff' } }}>
            <ListItemText primary="Search Intent Tool" sx={{ color: '#fff', fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/image-generator" onClick={isMobile ? onClose : undefined} sx={{ color: '#fff', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: '#fff' } }}>
            <ListItemText primary="Image Generator" sx={{ color: '#fff', fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/content-outline-creator" onClick={isMobile ? onClose : undefined} sx={{ color: '#fff', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: '#fff' } }}>
            <ListItemText primary="Content Creator Machine" sx={{ color: '#fff', fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/youtube-content-planner" onClick={isMobile ? onClose : undefined} sx={{ color: '#fff', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: '#fff' } }}>
            <ListItemText primary="YouTube Content Planner" sx={{ color: '#fff', fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/affiliate-article-ideas" onClick={isMobile ? onClose : undefined} sx={{ color: '#fff', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: '#fff' } }}>
            <ListItemText primary="Affiliate Article Ideas" sx={{ color: '#fff', fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/video-generator" onClick={isMobile ? onClose : undefined} sx={{ color: '#fff', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: '#fff' } }}>
            <ListItemText primary="Video Generator" sx={{ color: '#fff', fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/website-authority-checker" onClick={isMobile ? onClose : undefined} sx={{ color: '#fff', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline', color: '#fff' } }}>
            <ListItemText primary="Website Authority Checker" sx={{ color: '#fff', fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
      </List>
      <List sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {chats.map((chat) => (
          <ListItem key={chat.id} disablePadding
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="Delete chat"
                title="Delete chat"
                onClick={() => onDeleteChat(chat.id)}
                size="small"
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemButton
              selected={chat.id === currentChatId}
              onClick={() => {
                onSelectChat(chat.id);
                if (isMobile) onClose();
              }}
              sx={{
                '&.Mui-selected': {
                  bgcolor: '#ff6600',
                  color: '#fff',
                  '&:hover': {
                    bgcolor: '#ff6600',
                  },
                },
              }}
            >
              <ListItemText 
                primary={chat.title} 
                primaryTypographyProps={{
                  noWrap: true,
                  sx: { 
                    color: chat.id === currentChatId ? '#fff' : 'text.primary'
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: '#ff6600', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        bgcolor: 'background.paper', 
        position: 'sticky', 
        bottom: 0, 
        zIndex: 2,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)'
      }}>
        {user && (
          <>
            <Avatar src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} sx={{ 
              width: 36, 
              height: 36, 
              mr: 1,
              border: '2px solid #ff6600'
            }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff6600' }}>{user.displayName || 'User'}</Typography>
              <Typography variant="caption" color="text.secondary">{user.email}</Typography>
            </Box>
          </>
        )}
        <IconButton onClick={handleSettings} title="Settings" sx={{ 
          color: '#ff6600',
          '&:hover': {
            bgcolor: 'rgba(255, 102, 0, 0.1)'
          }
        }}>
          <SettingsIcon />
        </IconButton>
        <IconButton onClick={handleSignOut} title="Sign Out" sx={{ 
          color: '#ff6600',
          '&:hover': {
            bgcolor: 'rgba(255, 102, 0, 0.1)'
          }
        }}>
          <LogoutIcon />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile && !open && (
        <IconButton
          onClick={onNewChat}
          sx={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: 2000,
            bgcolor: '#ff6600',
            color: '#fff',
            boxShadow: 3,
            borderRadius: 2,
            width: 44,
            height: 44,
            display: { xs: 'flex', sm: 'none' },
            '&:hover': {
              bgcolor: '#ff8533',
            },
          }}
          aria-label="Open sidebar"
        >
          <MenuIcon />
        </IconButton>
      )}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            '& .MuiDrawer-paper': { 
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Box
          component="nav"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
          }}
        >
          {drawer}
        </Box>
      )}
    </>
  );
}

export default Sidebar; 