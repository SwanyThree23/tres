import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
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
import { useAuthStore } from '@/stores/authStore'

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

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppInit />
      <Routes>
        {/* Auth routes (no navbar/footer) */}
        <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
        <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />

        {/* Main layout routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/browse" element={<Layout><Browse /></Layout>} />
        <Route path="/watch/:streamId" element={<Layout><Watch /></Layout>} />
        <Route path="/watch-party/:streamId" element={<Layout><WatchParty /></Layout>} />
        <Route path="/watch-party/:streamId/:partyId" element={<Layout><WatchParty /></Layout>} />
        <Route path="/profile/:username" element={<Layout><Profile /></Layout>} />
        <Route path="/creators" element={<Layout><Creators /></Layout>} />
        <Route path="/why" element={<Layout><WhyItWorks /></Layout>} />

        {/* Protected routes */}
        <Route path="/studio" element={
          <ProtectedRoute>
            <Layout><Studio /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}
