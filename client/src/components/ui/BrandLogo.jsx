import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

import wordmark from '../../assets/collabmeet-logo.png';
import markSrc from '../../assets/collabmeet-mark.png';

const shimmer = {
  '0%': { backgroundPosition: '200% 0' },
  '100%': { backgroundPosition: '-200% 0' },
};

const pulse = {
  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
  '50%': { opacity: 0.45, transform: 'scale(0.72)' },
};

const ping = {
  '0%': { opacity: 0.65, transform: 'scale(1)' },
  '75%, 100%': { opacity: 0, transform: 'scale(2.4)' },
};

const surface = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  flexShrink: 0,
  width: 'fit-content',
  borderRadius: 1.5,
  background: 'linear-gradient(135deg, #152A46 0%, #0B1220 100%)',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: '0 8px 22px rgba(11,18,32,0.32)',
  transform: 'translateY(-15px)',
  position: 'relative',
  overflow: 'visible',
};

const LiveDot = ({ size = 8 }) => (
  <Box
    sx={{
      position: 'absolute',
      top: -2,
      right: -2,
      width: size,
      height: size,
      zIndex: 2,
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        bgcolor: '#22C55E',
        animation: 'collabmeet-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite',
        '@keyframes collabmeet-ping': ping,
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        bgcolor: '#22C55E',
        boxShadow: '0 0 0 2px #0B1220, 0 0 10px rgba(34,197,94,0.7)',
        animation: 'collabmeet-pulse 1.6s ease-in-out infinite',
        '@keyframes collabmeet-pulse': pulse,
      }}
    />
  </Box>
);

const BrandLogo = ({ height = 28, mark = false, sx }) => {
  if (mark) {
    const size = height;
    return (
      <Box sx={{ ...surface, width: size, height: size, ...sx }}>
        <LiveDot size={Math.max(7, Math.round(size * 0.22))} />
        <Box
          component={motion.img}
          src={markSrc}
          alt="CollabMeet"
          animate={{ scale: [1, 1.04, 1], rotate: [0, -1.5, 1.5, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          sx={{
            display: 'block',
            width: '78%',
            height: '78%',
            objectFit: 'contain',
            filter: 'brightness(1.55) saturate(1.2) drop-shadow(0 0 8px rgba(47,99,176,0.35))',
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ ...surface, px: 0.75, py: 0.5, ...sx }}>
      <LiveDot />
      <Box
        component={motion.img}
        src={wordmark}
        alt="CollabMeet"
        animate={{ y: [0, -1.5, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          display: 'block',
          height,
          width: 'auto',
          filter: 'brightness(1.55) saturate(1.2) drop-shadow(0 0 10px rgba(47,99,176,0.28))',
        }}
      />
      <Box
        aria-hidden="true"
        sx={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.16) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
            animation: 'collabmeet-shimmer 3.6s linear infinite',
            '@keyframes collabmeet-shimmer': shimmer,
          },
        }}
      />
    </Box>
  );
};

export default BrandLogo;
