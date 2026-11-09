import React from 'react';
import { Box, Skeleton, Stack } from '@mui/material';

const SkeletonList = ({ rows = 5 }) => (
  <Stack spacing={1} sx={{ p: 1.5 }}>
    {Array.from({ length: rows }).map((_, index) => (
      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1 }}>
        <Skeleton variant="circular" width={42} height={42} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="55%" height={20} />
          <Skeleton variant="text" width="80%" height={16} />
        </Box>
      </Box>
    ))}
  </Stack>
);

export default SkeletonList;
