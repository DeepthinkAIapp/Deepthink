import { MenuItem, List } from '@mui/material';
import { Link } from 'react-router-dom';

const Menu = () => (
    <List>
        <MenuItem>
            <Link to="/youtube-content-planner">YouTube Content Planner</Link>
        </MenuItem>
    </List>
);

export default Menu; 