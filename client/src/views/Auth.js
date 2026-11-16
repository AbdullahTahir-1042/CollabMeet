import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import ScreenShareRoundedIcon from '@mui/icons-material/ScreenShareRounded';
import { useSnackbar } from 'notistack';

import Input from '../components/Input';
import BrandLogo from '../components/ui/BrandLogo';
import { signin, signup } from '../actions/auth';
import { radii, shadows, fontStack } from '../styles/tokens';
import { scaleIn, fadeIn, staggerContainer, staggerItem } from '../styles/variants';

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const emailPattern = /^\S+@\S+\.\S+$/;

const features = [
  { icon: ChatBubbleRoundedIcon, label: 'Threaded team chat' },
  { icon: VideocamRoundedIcon, label: 'Crystal-clear video calls' },
  { icon: ScreenShareRoundedIcon, label: 'Instant screen sharing' },
  { icon: BoltRoundedIcon, label: 'Lightning-fast setup' },
];

const Auth = () => {
  const [formData, setFormData] = useState(initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const theme = useTheme();
  const redirectTo = useMemo(() => {
    const params = new URLSearchParams((location.search || '').replace(/^\?/, ''));
    const fromHash = (window.location.hash || '').split('?')[1] || '';
    const params2 = new URLSearchParams(fromHash);
    const target = params.get('redirect') || params2.get('redirect') || '/';
    return target.startsWith('/') ? target : `/${target}`;
  }, [location.search]);
  const isDesktop = useMediaQuery('(min-width:900px)');
  const controls = useAnimation();
  const { enqueueSnackbar } = useSnackbar();

  const p = theme.palette;

  const fail = (message) => {
    setError(message);
    controls.start({
      x: [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.42 },
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (isSignUp) {
      if (!firstName.trim() || !lastName.trim()) return fail('Please enter your first and last name.');
      if (!emailPattern.test(email)) return fail('Enter a valid email address.');
      if (password.length < 6) return fail('Password must be at least 6 characters.');
      if (password !== confirmPassword) return fail('Passwords do not match.');
    } else {
      if (!emailPattern.test(email)) return fail('Enter a valid email address.');
      if (!password) return fail('Please enter your password.');
    }

    setError('');
    setSubmitting(true);
    try {
      const data = isSignUp
        ? await dispatch(signup(formData, history))
        : await dispatch(signin(formData, history));

      if (!data && !localStorage.getItem('profile')) {
        fail(
          isSignUp
            ? 'Could not create your account. Try a different email address.'
            : 'Incorrect email or password. Please try again.',
        );
      } else {
        if (redirectTo.startsWith('/meeting/')) sessionStorage.setItem('collabmeet:autoJoin', '1');
        enqueueSnackbar(isSignUp ? 'Welcome to CollabMeet!' : 'Welcome back!', {
          variant: 'success',
        });
        history.replace(redirectTo);
      }
    } catch (err) {
      fail('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    if (error) setError('');
  };

  const switchMode = () => {
    setIsSignUp((prev) => !prev);
    setError('');
  };

  const Logo = <BrandLogo height={28} />;

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100vh',
        '@supports (height: 100dvh)': { height: '100dvh' },
        display: 'flex',
        bgcolor: 'background.default',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: p.mode === 'dark'
              ? 'radial-gradient(1200px 600px at 10% 10%, rgba(63,114,180,0.24), transparent 60%), radial-gradient(900px 500px at 90% 20%, rgba(23,62,118,0.30), transparent 55%), radial-gradient(800px 600px at 50% 100%, rgba(52,211,153,0.10), transparent 60%)'
              : 'radial-gradient(1200px 600px at 10% 10%, rgba(47,99,176,0.24), transparent 60%), radial-gradient(900px 500px at 90% 20%, rgba(23,62,118,0.18), transparent 55%), radial-gradient(800px 600px at 50% 100%, rgba(16,185,129,0.14), transparent 60%)',
          }}
        />

        <motion.div
          aria-hidden
          animate={{ y: [0, -28, 0], x: [0, 14, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '-12%',
            left: '-8%',
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, rgba(47,99,176,0.42), transparent 62%)',
            filter: 'blur(6px)',
          }}
        />
        <motion.div
          aria-hidden
          animate={{ y: [0, 26, 0], x: [0, -18, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            bottom: '-18%',
            right: '-6%',
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 60% 40%, rgba(16,185,129,0.26), transparent 62%)',
            filter: 'blur(8px)',
          }}
        />
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', minHeight: '100%' }}>
        {isDesktop ? (
          <Box
            sx={{
              flex: '0 0 56%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              p: 6,
              pr: 12,
              mr: '-8%',
              zIndex: 0,
              background:
                p.mode === 'dark'
                  ? 'linear-gradient(100deg, #060D1C 0%, #0B1630 22%, #173E76 58%, #1E4F96 100%)'
                  : 'linear-gradient(100deg, #081A36 0%, #0F2C57 22%, #173E76 58%, #2458A3 100%)',
              color: '#fff',
              position: 'relative',
              overflow: 'visible',
              fontFamily: fontStack,
              WebkitMaskImage: 'linear-gradient(to right, black 0%, black 62%, rgba(0,0,0,0.85) 78%, rgba(0,0,0,0.35) 90%, transparent 100%)',
              maskImage: 'linear-gradient(to right, black 0%, black 62%, rgba(0,0,0,0.85) 78%, rgba(0,0,0,0.35) 90%, transparent 100%)',
            }}
          >
            <BrandLogo height={24} />

            <Box component={motion.div} variants={staggerContainer} initial="hidden" animate="visible" sx={{ maxWidth: 460 }}>
              <Box component={motion.div} variants={staggerItem}>
                <Typography
                  variant="h2"
                  sx={{ fontSize: { md: '2.5rem', lg: '3rem' }, lineHeight: 1.1, mb: 2, color: '#fff' }}
                >
                  Where conversations and meetings come together.
                </Typography>
              </Box>
              <Box component={motion.div} variants={staggerItem}>
                <Typography sx={{ color: 'rgba(255,255,255,0.82)', fontSize: '1.05rem', mb: 4 }}>
                  Chat, meet, and share your screen with your team in one calm, beautifully fast
                  workspace.
                </Typography>
              </Box>
              <Stack spacing={1.75} component={motion.div} variants={staggerContainer}>
                {features.map(({ icon: Icon, label }) => (
                  <Stack key={label} component={motion.div} variants={staggerItem} direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: `${radii.sm}px`,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: 'rgba(255,255,255,0.16)',
                        border: '1px solid rgba(255,255,255,0.22)',
                      }}
                    >
                      <Icon sx={{ fontSize: 20 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.92)' }}>{label}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              &copy; {new Date().getFullYear()} CollabMeet. All rights reserved.
            </Typography>
          </Box>
        ) : null}

        <Box
          sx={{
            flex: isDesktop ? 1 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 2, sm: 3, md: 5 },
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 440 }}>
            <Box component={motion.div} variants={scaleIn} initial="hidden" animate="visible">
              <Paper
                component={motion.div}
                animate={controls}
                elevation={0}
                sx={{
                  width: '100%',
                  p: { xs: 3, sm: 4.5 },
                  borderRadius: `${radii.xl}px`,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: p.mode === 'dark' ? 'rgba(23,26,33,0.86)' : 'rgba(255,255,255,0.82)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: shadows.lg,
                }}
              >
                {!isDesktop ? <Box sx={{ mb: 3 }}>{Logo}</Box> : null}

                <Typography variant="h3" sx={{ mb: 0.5 }}>
                  {isSignUp ? 'Create your account' : 'Welcome back'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {isSignUp
                    ? 'Join your team in a few seconds. No credit card needed.'
                    : 'Sign in to continue to your chats and meetings.'}
                </Typography>

                <form onSubmit={handleSubmit} noValidate>
                  <Stack spacing={2}>
                    <AnimatePresence initial={false}>
                      {isSignUp ? (
                        <motion.div
                          key="names"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <Stack spacing={2} sx={{ pb: 0.5, pt: 1.25 }}>
                            <Input
                              name="firstName"
                              label="First Name"
                              handleChange={handleChange}
                              value={formData.firstName}
                              autoFocus
                            />
                            <Input
                              name="lastName"
                              label="Last Name"
                              handleChange={handleChange}
                              value={formData.lastName}
                            />
                          </Stack>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <Input
                      name="email"
                      label="Email Address"
                      handleChange={handleChange}
                      value={formData.email}
                      type="email"
                    />

                    <Input
                      name="password"
                      label="Password"
                      handleChange={handleChange}
                      value={formData.password}
                      type={showPassword ? 'text' : 'password'}
                      handleShowPassword={() => setShowPassword((prev) => !prev)}
                    />

                    <AnimatePresence initial={false}>
                      {isSignUp ? (
                        <motion.div
                          key="confirm"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <Box sx={{ pt: 1.25 }}>
                            <Input
                              name="confirmPassword"
                              label="Confirm Password"
                              handleChange={handleChange}
                              value={formData.confirmPassword}
                              type={showConfirmPassword ? 'text' : 'password'}
                              handleShowPassword={() => setShowConfirmPassword((prev) => !prev)}
                            />
                          </Box>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </Stack>

                  <AnimatePresence>
                    {error ? (
                      <Box
                        component={motion.div}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        role="alert"
                        sx={{ mt: 1.5, color: 'error.main', fontSize: 13, fontWeight: 500 }}
                      >
                        {error}
                      </Box>
                    ) : null}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    fullWidth
                    size="large"
                    variant="contained"
                    disabled={submitting}
                    sx={{
                      mt: 2.5,
                      py: 1.35,
                      fontSize: '1rem',
                      borderRadius: `${radii.md}px`,
                      boxShadow: shadows.glow,
                    }}
                  >
                    {submitting ? (
                      <CircularProgress size={22} sx={{ color: '#fff' }} />
                    ) : isSignUp ? (
                      'Create account'
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </form>

                <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                  <Typography variant="body2" color="text.secondary" component="span">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  </Typography>
                  <Button
                    variant="text"
                    onClick={switchMode}
                    sx={{ textTransform: 'none', fontWeight: 700, minWidth: 0, p: 0.5 }}
                  >
                    {isSignUp ? 'Sign in' : 'Sign up'}
                  </Button>
                </Box>
              </Paper>
            </Box>

            {!isDesktop ? (
              <Box component={motion.div} variants={fadeIn} initial="hidden" animate="visible" sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  &copy; {new Date().getFullYear()} CollabMeet. All rights reserved.
                </Typography>
              </Box>
            ) : null}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Auth;
