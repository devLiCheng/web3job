'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import '../i18n/config'
import AuthModal from './AuthModal'

export default function Header() {
  const { t, i18n } = useTranslation()
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')

  // Load auth state and listen for changes
  const checkAuth = () => {
    const logged = localStorage.getItem('isLoggedIn') === 'true'
    setIsLoggedIn(logged)
    if (logged) {
      setUsername(localStorage.getItem('username') || '')
    } else {
      setUsername('')
    }
  }

  useEffect(() => {
    checkAuth()
    window.addEventListener('auth-state-change', checkAuth)
    
    // Custom listener for triggering Auth Modal from outside
    const triggerAuth = () => setIsAuthOpen(true)
    window.addEventListener('trigger-auth-modal', triggerAuth)

    return () => {
      window.removeEventListener('auth-state-change', checkAuth)
      window.removeEventListener('trigger-auth-modal', triggerAuth)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('username')
    localStorage.removeItem('email')
    setIsLoggedIn(false)
    setUsername('')
    window.dispatchEvent(new CustomEvent('auth-state-change'))
  }

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'zh' ? 'en' : 'zh'
    i18n.changeLanguage(nextLang)
  }

  return (
    <header style={{
      height: 'var(--header-height)',
      borderBottom: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      maxWidth: 'var(--max-width)',
      margin: '0 auto',
      width: '100%',
      position: 'sticky',
      top: 0,
      backgroundColor: 'rgba(5, 5, 7, 0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          fontWeight: 800,
          fontSize: '1.4rem',
          fontFamily: 'var(--font-sans)',
          letterSpacing: '-0.5px'
        }} className="gradient-text">
          {t('nav.title')}
        </span>
      </div>

      {/* Nav Links */}
      <nav style={{ 
        display: 'flex', 
        gap: '2rem', 
        fontWeight: 500, 
        fontSize: '0.9rem',
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-secondary)'
      }}>
        <a href="#job-search-feed" style={{ transition: 'var(--transition-spring)' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
          {t('nav.findJobs')}
        </a>
        <a href="#post-job" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-post-modal')) }} style={{ transition: 'var(--transition-spring)' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
          {t('nav.postJob')}
        </a>
        <a href="http://localhost:6004" target="_blank" rel="noopener noreferrer" style={{ transition: 'var(--transition-spring)' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
          {t('nav.scraperPanel')}
        </a>
      </nav>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        
        {/* Tactical Language Switcher Button (design-taste-v1 style) */}
        <button 
          onClick={toggleLanguage}
          className="btn-secondary"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            padding: '0.4rem 0.8rem',
            minHeight: '36px',
            minWidth: '70px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: 'var(--accent-cyan)',
            color: 'var(--accent-cyan)'
          }}
        >
          {i18n.language === 'zh' ? '[ZH // EN]' : '[EN // ZH]'}
        </button>

        {isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span 
              className="telemetry-label" 
              style={{ 
                fontSize: '0.75rem', 
                color: 'var(--accent-cyan)', 
                backgroundColor: 'rgba(0, 242, 254, 0.03)',
                border: '1px solid rgba(0, 242, 254, 0.15)',
                padding: '0.35rem 0.75rem',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              [ Operator: {username} ]
            </span>
            <button 
              onClick={handleLogout}
              className="btn-secondary"
              style={{
                fontSize: '0.7rem',
                padding: '0.35rem 0.65rem',
                minHeight: '32px',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#ef4444'
              }}
            >
              {i18n.language === 'zh' ? '[ 退出 ]' : '[ OUT ]'}
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsAuthOpen(true)}
            className="btn-primary" 
            style={{ minHeight: '36px', fontSize: '0.75rem', padding: '0.5rem 1.25rem' }}
          >
            {t('nav.connect')}
          </button>
        )}
      </div>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onLoginSuccess={(user) => {
          setIsLoggedIn(true)
          setUsername(user)
        }}
      />
    </header>
  )
}
