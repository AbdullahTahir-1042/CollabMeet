import './process-shim';
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { MotionConfig } from 'framer-motion';

import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

import App from './App';
import './index.css';

import { reducers } from './reducer';
import { getTheme } from './theme';
import { ThemeModeProvider, useThemeMode } from './context/ThemeModeContext';
import { AppSocketProvider } from './context/AppSocketContext';

const store = createStore(reducers, compose(applyMiddleware(thunk)));

const Root = () => {
  const { mode } = useThemeMode();
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MotionConfig reducedMotion="user">
        <SnackbarProvider
          maxSnack={3}
          autoHideDuration={2600}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Provider store={store}>
            <AppSocketProvider>
              <App />
            </AppSocketProvider>
          </Provider>
        </SnackbarProvider>
      </MotionConfig>
    </ThemeProvider>
  );
};

ReactDOM.render(
  <ThemeModeProvider>
    <Root />
  </ThemeModeProvider>,
  document.getElementById('root'),
);
