import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';

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

  const drawer = (
    <Box sx={{ 
      width: DRAWER_WIDTH, 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider',
        minHeight: 64
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img src="/images/android-chrome-512x512.png" alt="Logo" style={{ height: 36, width: 36, borderRadius: 8, marginRight: 8 }} />
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: 1 }}>DEEPTHINK</span>
        </Box>
        {isMobile && (
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box>
          <button onClick={onNewChat} style={{ width: '100%', padding: '10px 0', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
            + New chat
          </button>
        </Box>
        <List>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/blog" onClick={isMobile ? onClose : undefined}>
              <ListItemText primary="Blog" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/monetization-planner" onClick={isMobile ? onClose : undefined}>
              <ListItemText primary="Monetization Planner" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/guestpost-outreach" onClick={isMobile ? onClose : undefined}>
              <ListItemText primary="Guest Post Outreach" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/search-intent-tool" onClick={isMobile ? onClose : undefined}>
              <ListItemText primary="Search Intent Tool" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/image-generator" onClick={isMobile ? onClose : undefined}>
              <ListItemText primary="Image Generator" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/content-outline-creator" onClick={isMobile ? onClose : undefined}>
              <ListItemText primary="Content Creator Machine" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/youtube-content-planner" onClick={isMobile ? onClose : undefined}>
              <ListItemText primary="YouTube Content Planner" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/affiliate-article-ideas" onClick={isMobile ? onClose : undefined}>
              <ListItemText primary="Affiliate Article Ideas" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/video-generator" onClick={isMobile ? onClose : undefined}>
              <ListItemText primary="Video Generator" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/website-authority-checker" onClick={isMobile ? onClose : undefined}>
              <ListItemText primary="Website Authority Checker" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      <List sx={{ flex: 1, overflow: 'auto' }}>
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
                  bgcolor: 'primary.light',
                  '&:hover': {
                    bgcolor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemText 
                primary={chat.title} 
                primaryTypographyProps={{
                  noWrap: true,
                  sx: { 
                    color: chat.id === currentChatId ? 'primary.contrastText' : 'text.primary'
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      {isMobile && !open && (
        <IconButton
          onClick={onNewChat /* This should open the sidebar, but we need a prop for onOpen. For now, just placeholder. */}
          sx={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: 2000,
            bgcolor: 'background.paper',
            boxShadow: 3,
            borderRadius: 2,
            width: 44,
            height: 44,
            display: { xs: 'flex', sm: 'none' },
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