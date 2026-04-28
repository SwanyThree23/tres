import { Link } from 'react-router-dom'
import { Zap, Twitter, Github, Youtube, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-dark-300/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">
                <span className="gradient-text">SeeWhy</span>
                <span className="text-white"> LIVE</span>
              </span>
            </Link>
            <p className="text-sm text-white/50 mb-4">
              Where curiosity goes live. Watch, learn, and ask why — in real time.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Twitter, href: '#' },
                { icon: Youtube, href: '#' },
                { icon: Github, href: '#' },
                { icon: Linkedin, href: '#' },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-brand-500/20 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4 text-white/60" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {['Browse Streams', 'Top Creators', 'Categories', 'Schedule'].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-sm text-white/50 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Creators</h4>
            <ul className="space-y-2.5">
              {['Go Live', 'Creator Dashboard', 'Monetization', 'Analytics', 'Creator Guide'].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-sm text-white/50 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2.5">
              {['About', 'Blog', 'Careers', 'Press', 'Privacy', 'Terms'].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-sm text-white/50 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} SeeWhy LIVE. All rights reserved.
          </p>
          <p className="text-sm text-white/40">
            Made for curious minds everywhere
          </p>
        </div>
      </div>
    </footer>
  )
}
