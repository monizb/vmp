import { Chip } from '@mui/material';
import { StatusColors } from '../../types/models';

export function StatusChip({ status, size = 'small' }) {
  return (
    <Chip
      label={status}
      size={size}
      sx={{
        backgroundColor: StatusColors[status] || '#757575',
        color: 'white',
        fontWeight: 'bold',
      }}
    />
  );
} 