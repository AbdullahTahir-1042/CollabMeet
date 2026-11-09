import { createTheme } from '@mui/material/styles';
import { palette, radii, shadows, fontStack, fontWeights, typeScale } from './styles/tokens';

export const getTheme = (mode = 'light') => {
  const p = palette[mode] || palette.light;

  return createTheme({
    palette: {
      mode,
      primary: { main: p.primary, dark: p.primaryDark, contrastText: '#FFFFFF' },
      secondary: { main: p.accent, contrastText: '#FFFFFF' },
      success: { main: p.success },
      warning: { main: p.warning },
      error: { main: p.error },
      info: { main: p.info },
      background: { default: p.bg, paper: p.paper },
      text: { primary: p.text, secondary: p.textSecondary },
      divider: p.border,
    },
    shape: { borderRadius: radii.md },
    typography: {
      fontFamily: fontStack,
      fontWeightRegular: fontWeights.regular,
      fontWeightMedium: fontWeights.medium,
      fontWeightBold: fontWeights.bold,
      h1: { fontSize: typeScale['3xl'], fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontSize: typeScale['2xl'], fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontSize: typeScale.xl, fontWeight: 600, letterSpacing: '-0.01em' },
      h4: { fontSize: typeScale.lg, fontWeight: 600 },
      h5: { fontSize: typeScale.md, fontWeight: 600 },
      h6: { fontSize: typeScale.base, fontWeight: 600 },
      body1: { fontSize: typeScale.base, lineHeight: 1.55 },
      body2: { fontSize: typeScale.sm, lineHeight: 1.55 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: p.bg,
            color: p.text,
            transition: 'background-color 200ms ease, color 200ms ease',
          },
          '::selection': {
            backgroundColor: p.primarySubtle,
            color: p.text,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: radii.md,
            fontWeight: 600,
            paddingInline: 18,
          },
          containedPrimary: {
            boxShadow: shadows.glow,
            '&:hover': { boxShadow: shadows.glow },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: radii.md,
            transition: 'background-color 160ms ease, transform 120ms ease',
            '&:active': { transform: 'scale(0.94)' },
          },
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: true },
        styleOverrides: {
          tooltip: {
            backgroundColor: mode === 'dark' ? '#2A2F3A' : '#111827',
            fontSize: typeScale.xs,
            borderRadius: radii.sm,
            padding: '6px 10px',
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: radii.md,
            backgroundColor: mode === 'dark' ? p.elevated : '#FFFFFF',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: p.border },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: p.primary },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: p.primary,
              borderWidth: 2,
            },
          },
          input: {
            paddingBlock: 12,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, minHeight: 48 },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: radii.md,
            border: `1px solid ${p.border}`,
            boxShadow: shadows.md,
            marginTop: 8,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: radii.lg, border: `1px solid ${p.border}`, boxShadow: shadows.lg },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(17,24,39,0.06)' },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: radii.pill },
        },
      },
    },
  });
};

export default getTheme;
