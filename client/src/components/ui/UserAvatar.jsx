import React from 'react';
import { Avatar } from '@mui/material';
import { avatarColors } from '../../styles/tokens';

const hashString = (value = '') => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export const initialsOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';

export const colorForName = (name = '') => avatarColors[hashString(name) % avatarColors.length];

const UserAvatar = ({ name = '', size = 40, sx, ...rest }) => (
  <Avatar
    alt={name}
    sx={{
      width: size,
      height: size,
      bgcolor: colorForName(name),
      color: '#FFFFFF',
      fontSize: Math.max(12, size * 0.4),
      fontWeight: 600,
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)',
      ...sx,
    }}
    {...rest}
  >
    {initialsOf(name)}
  </Avatar>
);

export default UserAvatar;
