import React from 'react';
import { HashRouter, Switch, Route, useLocation, Redirect } from 'react-router-dom';
import { AnimatePresence, LayoutGroup } from 'framer-motion';

import AppShell from './components/layout/AppShell';
import PageTransition from './components/layout/PageTransition';

import Auth from './views/Auth';
import VideoCall from './views/VideoCall';
import Chat from './views/Chat';
import Meetings from './views/Meetings';

import { ContextProvider } from './SocketContext';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence exitBeforeEnter initial={false}>
      <Switch location={location} key={location.pathname}>
        <Route path="/meeting/:id" exact>
          <ContextProvider>
            <PageTransition>
              <VideoCall />
            </PageTransition>
          </ContextProvider>
        </Route>

        <Route path="/video-call/:id" exact render={({ match }) => <Redirect to={`/meeting/${match.params.id}`} />} />

        <Route path="/auth" exact>
          <PageTransition>
            <Auth />
          </PageTransition>
        </Route>

        <Route path="/meetings" exact>
          <AppShell>
            <PageTransition>
              <Meetings />
            </PageTransition>
          </AppShell>
        </Route>

        <Route path="/">
          <AppShell>
            <PageTransition>
              <Chat />
            </PageTransition>
          </AppShell>
        </Route>
      </Switch>
    </AnimatePresence>
  );
};

const App = () => (
  <HashRouter>
    <LayoutGroup id="collabmeet">
      <AnimatedRoutes />
    </LayoutGroup>
  </HashRouter>
);

export default App;
