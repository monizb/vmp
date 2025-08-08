import { Chip } from '@mui/material';
import { Platform } from '../../types/models';

const platformColors = {
  [Platform.Web]: '#2196f3',
  [Platform.iOS]: '#ff9800',
  [Platform.Android]: '#4caf50',
};

export function PlatformBadge({ platform, size = 'small' }) {
  return (
    <Chip
      label={platform}
      size={size}
      sx={{
        backgroundColor: platformColors[platform] || '#757575',
        color: 'white',
        fontWeight: 'bold',
      }}
    />
  );
} 