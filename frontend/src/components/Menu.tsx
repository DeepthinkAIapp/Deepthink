import { MenuItem, List } from '@mui/material';
import { Link } from 'react-router-dom';

const Menu = () => (
    <List>
        <MenuItem>
            <Link to="/monetization-planner" style={{ color: '#ff6600', fontWeight: 600, textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>Monetization Planner</Link>
        </MenuItem>
        <MenuItem>
            <Link to="/guestpost-outreach" style={{ color: '#ff6600', fontWeight: 600, textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>Guest Post Outreach</Link>
        </MenuItem>
        <MenuItem>
            <Link to="/search-intent-tool" style={{ color: '#ff6600', fontWeight: 600, textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>Search Intent Tool</Link>
        </MenuItem>
        <MenuItem>
            <Link to="/content-outline-creator" style={{ color: '#ff6600', fontWeight: 600, textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>Content Creator Machine</Link>
        </MenuItem>
        <MenuItem>
            <Link to="/affiliate-article-ideas" style={{ color: '#ff6600', fontWeight: 600, textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>Affiliate Article Ideas</Link>
        </MenuItem>
        <MenuItem>
            <Link to="/youtube-content-planner" style={{ color: '#ff6600', fontWeight: 600, textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>YouTube Content Planner</Link>
        </MenuItem>
        <MenuItem>
            <Link to="/blog" style={{ color: '#ff6600', fontWeight: 600, textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>Blog</Link>
        </MenuItem>
    </List>
);

export default Menu; 