import { MenuItem, List } from '@mui/material';
import { Link } from 'react-router-dom';

const Menu = () => (
    <List>
        <MenuItem>
            <Link to="/monetization-planner">Monetization Planner</Link>
        </MenuItem>
        <MenuItem>
            <Link to="/guestpost-outreach">Guest Post Outreach</Link>
        </MenuItem>
        <MenuItem>
            <Link to="/search-intent-tool">Search Intent Tool</Link>
        </MenuItem>
        <MenuItem>
            <Link to="/image-generator">Image Generator</Link>
        </MenuItem>
        <MenuItem>
            <Link to="/content-outline-creator">Content Creator Machine</Link>
        </MenuItem>
        <MenuItem>
            <Link to="/affiliate-article-ideas">Affiliate Article Ideas</Link>
        </MenuItem>
        <MenuItem>
            <Link to="/youtube-content-planner">YouTube Content Planner</Link>
        </MenuItem>
        <MenuItem>
            <Link to="/blog">Blog</Link>
        </MenuItem>
    </List>
);

export default Menu; 