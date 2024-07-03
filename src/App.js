import React from 'react';
import '@fontsource/roboto';
import Dashboard from './pages/Dashboard';
import ToggleColorMode from './ToggleColorMode';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <ToggleColorMode>
      <Header username="Sahil" />
      <Dashboard />
      <Footer />
    </ToggleColorMode>
  );
}

export default App;