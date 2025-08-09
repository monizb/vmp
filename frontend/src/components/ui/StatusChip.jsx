import { useState } from 'react';
import { Chip, Menu, MenuItem } from '@mui/material';
import { StatusColors, VulnStatus } from '../../types/models';

export function StatusChip({ status, size = 'small', onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    if (!onChange) return;
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelect = (newStatus) => {
    handleClose();
    if (onChange && newStatus !== status) onChange(newStatus);
  };

  return (
    <>
      <Chip
        label={status}
        size={size}
        onClick={onChange ? handleOpen : undefined}
        sx={{
          backgroundColor: StatusColors[status] || '#757575',
          color: 'white',
          fontWeight: 'bold',
          cursor: onChange ? 'pointer' : 'default',
        }}
      />
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} onClick={(e) => e.stopPropagation()}>
        {Object.values(VulnStatus).map((option) => (
          <MenuItem key={option} selected={option === status} onClick={() => handleSelect(option)}>
            {option}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}