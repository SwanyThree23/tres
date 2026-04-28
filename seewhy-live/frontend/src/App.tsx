import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FloatingChat from '@/components/FloatingChat'
import Home from '@/pages/Home'
import Browse from '@/pages/Browse'
import Watch from '@/pages/Watch'
import WatchParty from '@/pages/WatchParty'
import Studio from '@/pages/Studio'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Profile from '@/pages/Profile'
import Creators from '@/pages/Creators'
import WhyItWorks from '@/pages/WhyItWorks'
import NotFound from '@/pages/NotFound'
import BetaGate from '@/pages/BetaGate'
import WelcomeGate from '@/pages/WelcomeGate'
import CreatorOnboarding from '@/pages/CreatorOnboarding'
import JoyceAI from '@/pages/JoyceAI'
import WashingtonClassic from '@/pages/WashingtonClassic'
import VibeNBones from '@/pages/VibeNBones'
import PKBattleArena from '@/pages/PKBattleArena'
import { useAuthStore } from '@/stores/authStore'

type Phase = 'beta' | 'welcome' | 'onboarding' | 'platform'

function getInitialPhase(): Phase {
  if (!localStorage.getItem('sw_beta_access')) return 'beta'
  if (!localStorage.getItem('sw_welcome_done')) return 'welcome'
  if (!localStorage.getItem('sw_onboarding_done')) return 'onboarding'
  return 'platform'
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

function FullscreenLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col min-h-screen">{children}</div>
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function AppInit() {
  const { fetchMe, accessToken } = useAuthStore()
  useEffect(() => {
    if (accessToken) fetchMe()
  }, [accessToken, fetchMe])
  return null
}

function GatedApp() {
  const [phase, setPhase] = useState<Phase>(getInitialPhase)

  if (phase === 'beta') {
    return <BetaGate onAccess={() => setPhase('welcome')} />
  }

  if (phase === 'welcome') {
    return <WelcomeGate onComplete={() => setPhase('onboarding')} />
  }

  if (phase === 'onboarding') {
    return <CreatorOnboarding onComplete={() => setPhase('platform')} />
  }

  return (
    <>
      <ScrollToTop />
      <AppInit />
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
        <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />

        {/* Fullscreen feature pages */}
        <Route path="/joyce" element={<FullscreenLayout><JoyceAI /></FullscreenLayout>} />
        <Route path="/pk-battle" element={<FullscreenLayout><PKBattleArena /></FullscreenLayout>} />
        <Route path="/classic" element={<FullscreenLayout><WashingtonClassic /></FullscreenLayout>} />
        <Route path="/vibe" element={<FullscreenLayout><VibeNBones /></FullscreenLayout>} />

        {/* Main layout */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/browse" element={<Layout><Browse /></Layout>} />
        <Route path="/watch/:streamId" element={<Layout><Watch /></Layout>} />
        <Route path="/watch-party/:streamId" element={<Layout><WatchParty /></Layout>} />
        <Route path="/watch-party/:streamId/:partyId" element={<Layout><WatchParty /></Layout>} />
        <Route path="/profile/:username" element={<Layout><Profile /></Layout>} />
        <Route path="/creators" element={<Layout><Creators /></Layout>} />
        <Route path="/why" element={<Layout><WhyItWorks /></Layout>} />

        {/* Protected */}
        <Route path="/studio" element={
          <ProtectedRoute><Layout><Studio /></Layout></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>

      {/* Global floating chat — only on platform pages */}
      <FloatingChat />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <GatedApp />
    </BrowserRouter>
  )
}
