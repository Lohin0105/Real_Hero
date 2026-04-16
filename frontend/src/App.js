import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { CircularProgress, Box, createTheme, ThemeProvider, CssBaseline } from '@mui/material';


import Splash from "./pages/Splash"; // Restored Splash
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Forgot from "./pages/Forgot";
import Donate from "./pages/Donate";
import Request from "./pages/Request";
import MapPage from "./pages/MapPage";
import MyRequests from "./pages/MyRequests";
import RequestedDonations from "./pages/RequestedDonations";
import Donations from "./pages/Donations";
import Gamification from "./pages/Gamification";
import Rewards from "./pages/Rewards";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import MediBotPage from "./pages/MediBotPage";
import Analytics from "./pages/Analytics";
import VerifyOtp from "./pages/VerifyOtp";
import LanguageSettings from "./pages/LanguageSettings";
import AboutUs from "./pages/AboutUs";
import HelpQueries from "./pages/HelpQueries";
import DonorTracker from "./pages/DonorTracker";
import ReceiverTracker from "./pages/ReceiverTracker";
import { authUtils } from "./utils/auth";

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#090909', paper: 'rgba(255,255,255,0.04)' },
    primary: { main: '#ff2b2b' },
    error: { main: '#ff2b2b' },
  },
  typography: {
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    allVariants: { color: '#fff' },
  },
  components: {
    MuiButton: { styleOverrides: { root: { fontFamily: "'Poppins', sans-serif", fontWeight: 600, borderRadius: 10 } } },
    MuiCard: { styleOverrides: { root: { background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.07)' } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiDrawer: { styleOverrides: { paper: { background: '#0d0d0d', borderRight: '1px solid rgba(255,43,43,0.1)' } } },
    MuiDialog: { styleOverrides: { paper: { background: '#111', border: '1px solid rgba(255,43,43,0.15)', borderRadius: 16 } } },
  },
});

function App() {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Check local JWT first for immediate response
    setAuthReady(true);
  }, []);
  if (!authReady) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <CircularProgress sx={{ color: '#ff2b2b' }} />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>

          {/* Default route → Beautiful Home page */}
          <Route path="/" element={<Home />} />
          <Route path="/splash" element={<Splash />} />

          {/* Auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/request" element={<Request />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/medibot" element={<MediBotPage />} />
          <Route path="/my-requests" element={<MyRequests />} />
          <Route path="/requested-donations" element={<RequestedDonations />} />
          <Route path="/donations" element={<Donations />} />
          <Route path="/gamification" element={<Gamification />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/language" element={<LanguageSettings />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/help" element={<HelpQueries />} />
          <Route path="/track-mission/:id" element={<DonorTracker />} />
          <Route path="/live-tracking/:id" element={<ReceiverTracker />} />

        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
