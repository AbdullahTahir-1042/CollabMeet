import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';
import { fadeIn } from '../../styles/variants';

const EmptyState = ({ icon: Icon, title, description, action, sx }) => (
  <Box
    component={motion.div}
    variants={fadeIn}
    initial="hidden"
    animate="visible"
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: 1.5,
      py: 8,
      px: 3,
      ...sx,
    }}
  >
    {Icon ? (
      <Box
        sx={{
          width: 76,
          height: 76,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'action.hover',
          color: 'text.secondary',
        }}
      >
        <Icon sx={{ fontSize: 36 }} />
      </Box>
    ) : null}
    <Typography variant="h6">{title}</Typography>
    {description ? (
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340 }}>
        {description}
      </Typography>
    ) : null}
    {action}
  </Box>
);

export default EmptyState;
