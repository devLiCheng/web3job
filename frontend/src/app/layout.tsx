import type { Metadata } from 'next'
import './globals.css'
import Header from '../components/Header'

export const metadata: Metadata = {
  title: 'RemoteWeb3 | Elite Web3 Remote Jobs & Careers',
  description: 'Discover premium remote Web3, Crypto, Blockchain, Smart Contract, Solidity and DeFi jobs. Find top global talent and build the decentralized future today.',
  keywords: ['web3 jobs', 'remote blockchain jobs', 'solidity engineer jobs', 'crypto remote jobs', 'web3 career', 'smart contract developer'],
  openGraph: {
    title: 'RemoteWeb3 | Elite Web3 Remote Jobs & Careers',
    description: 'Find premium remote Web3, Crypto, Blockchain and DeFi jobs. Connect with world-class projects.',
    url: 'https://remoteweb3.com',
    siteName: 'RemoteWeb3',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RemoteWeb3 | Premium Remote Web3 Careers',
    description: 'Work in Web3 from anywhere. Top Solidity, DeFi, and blockchain jobs updated daily.',
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Animated backgrounds for premium aesthetic */}
        <div className="mesh-bg" />
        <div className="grid-bg" />
        
        {/* Interactive Header Client Component */}
        <Header />

        {/* Main Content Area */}
        <main style={{ flex: 1, maxWidth: 'var(--max-width)', margin: '0 auto', width: '100%', padding: '2rem' }}>
          {children}
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid var(--border-light)',
          padding: '3rem 2rem',
          textAlign: 'center',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>
          <p>© 2026 remoteweb3.com. Built for the decentralized future.</p>
        </footer>
      </body>
    </html>
  )
}
