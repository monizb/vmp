import { Box, Chip, Tooltip } from '@mui/material';

export function TagList({ tags = [], maxDisplay = 3, size = 'small' }) {
  if (!tags || tags.length === 0) {
    return null;
  }

  const displayTags = tags.slice(0, maxDisplay);
  const remainingCount = tags.length - maxDisplay;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {displayTags.map((tag, index) => (
        <Chip
          key={index}
          label={tag}
          size={size}
          variant="outlined"
          sx={{ fontSize: '0.75rem' }}
        />
      ))}
      {remainingCount > 0 && (
        <Tooltip title={tags.slice(maxDisplay).join(', ')}>
          <Chip
            label={`+${remainingCount}`}
            size={size}
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          />
        </Tooltip>
      )}
    </Box>
  );
} 