import { Chip } from '@mui/material';
import { SeverityColors } from '../../types/models';

export function SeverityChip({ severity, size = 'small' }) {
  return (
    <Chip
      label={severity}
      size={size}
      sx={{
        backgroundColor: SeverityColors[severity] || '#757575',
        color: 'white',
        fontWeight: 'bold',
      }}
    />
  );
} 