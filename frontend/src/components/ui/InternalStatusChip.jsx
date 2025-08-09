import { useState } from 'react';
import { Chip, Menu, MenuItem } from '@mui/material';
import { InternalStatusColors, InternalStatusOptions } from '../../types/models';

export function InternalStatusChip({ value, size = 'small', onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const label = value && value.length > 0 ? value : 'None';
  const backgroundColor = value && value.length > 0 ? (InternalStatusColors[value] || '#757575') : '#757575';

  const handleOpen = (event) => {
    if (!onChange) return;
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelect = (newValue) => {
    handleClose();
    if (!onChange) return;
    if (newValue !== value) onChange(newValue);
  };

  return (
    <>
      <Chip
        label={label}
        size={size}
        onClick={onChange ? handleOpen : undefined}
        sx={{
          backgroundColor,
          color: 'white',
          fontWeight: 'bold',
          cursor: onChange ? 'pointer' : 'default',
        }}
      />
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} onClick={(e) => e.stopPropagation()}>
        <MenuItem selected={!value} onClick={() => handleSelect('')}>None</MenuItem>
        {InternalStatusOptions.map((option) => (
          <MenuItem key={option} selected={option === value} onClick={() => handleSelect(option)}>
            {option}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

