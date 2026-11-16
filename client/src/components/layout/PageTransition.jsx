import React from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '../../styles/variants';

const PageTransition = ({ children }) => (
  <motion.div
    variants={pageTransition}
    initial="hidden"
    animate="visible"
    exit="exit"
    style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      minWidth: 0,
    }}
  >
    {children}
  </motion.div>
);

export default PageTransition;
