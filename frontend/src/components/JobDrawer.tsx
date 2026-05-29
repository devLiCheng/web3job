'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import '../i18n/config'

export interface Job {
  id: string
  title: string
  company: string
  tags: string[]
  salary: string
  description: string
  apply_url: string
  timeAgo: string
  source?: string
}

interface JobDrawerProps {
  job: Job | null
  onClose: () => void
}

export default function JobDrawer({ job, onClose }: JobDrawerProps) {
  const { t, i18n } = useTranslation()

  if (!job) return null

  // Class assignment helper for spot pastels
  const getTagClass = (tag: string) => {
    const t = tag.toLowerCase()
    if (t === 'solidity' || t === 'ethereum' || t === 'evm') return 'tag-solidity'
    if (t === 'rust' || t === 'zk-proofs' || t === 'cryptography') return 'tag-rust'
    if (t === 'react' || t === 'next.js' || t === 'typescript') return 'tag-frontend'
    return 'tag-neutral'
  }

  // Bilingual time helper to keep typography pristine
  const formatTimeAgo = (timeAgo: string) => {
    if (i18n.language === 'zh') {
      return timeAgo
        .replace('2 hours ago', '2 小时前')
        .replace('4 hours ago', '4 小时前')
        .replace('1 day ago', '1 天前')
        .replace('Recently Sourced', '刚刚获取')
    }
    return timeAgo
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      maxWidth: '540px',
      backgroundColor: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-light)',
      boxShadow: '-15px 0 45px rgba(0, 0, 0, 0.75)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    }}>
      
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Header Container */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span className="telemetry-label" style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)' }}>
            [{job.company.toUpperCase()}]
          </span>
          <h2 className="editorial-title" style={{
            fontSize: '1.5rem',
            marginTop: '0.15rem',
            color: '#fff'
          }}>
            {job.title}
          </h2>
        </div>
        
        {/* Vector SVG Close Button - Verified 44px tap zone */}
        <button 
          onClick={onClose}
          style={{
            color: 'var(--text-secondary)',
            padding: '0.5rem',
            borderRadius: '50%',
            transition: 'var(--transition-spring)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '44px',
            minWidth: '44px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Content Container (Scrollable) */}
      <div style={{
        flex: 1,
        padding: '1.5rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        
        {/* Concentric Double-Bezel frame for metadata metrics */}
        <div className="double-bezel-shell">
          <div className="double-bezel-core" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1rem',
            padding: '1rem'
          }}>
            <span className="tactical-crosshair tl">+</span>
            <span className="tactical-crosshair tr">+</span>
            <span className="tactical-crosshair bl">+</span>
            <span className="tactical-crosshair br">+</span>

            <div>
              <span className="telemetry-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {t('drawer.compensation')}
              </span>
              <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', display: 'block', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                {job.salary || t('card.retainer')}
              </span>
            </div>
            <div>
              <span className="telemetry-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {t('drawer.posted')}
              </span>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                {formatTimeAgo(job.timeAgo).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="telemetry-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                SOURCE / 来源
              </span>
              <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.85rem', display: 'block', marginTop: '0.2rem', fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>
                {job.source || 'manual'}
              </span>
            </div>
          </div>
        </div>

        {/* Tags Block */}
        <div>
          <span className="telemetry-label" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
            {t('drawer.skills')}
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {job.tags.map(tag => (
              <span 
                key={tag}
                className={getTagClass(tag)}
                style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '3px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Detailed description */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
          <span className="telemetry-label" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.6rem' }}>
            {t('drawer.specs')}
          </span>
          <div 
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              fontFamily: 'var(--font-sans)'
            }}
          >
            {job.description.split('\n\n').map((paragraph, idx) => (
              <p key={idx} style={{ maxWidth: '65ch' }}>{paragraph}</p>
            ))}
          </div>
        </div>

      </div>

      {/* Direct Apply Action Panel - 44px min touch limits */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderTop: '1px solid var(--border-light)',
        backgroundColor: 'var(--bg-tertiary)',
        display: 'flex',
        gap: '1rem'
      }}>
        <a 
          href={job.apply_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{
            flex: 1,
            justifyContent: 'center',
            lineHeight: 1.5,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            letterSpacing: '0.5px',
            minHeight: '44px',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          {t('drawer.apply')}
        </a>
      </div>

    </div>
  )
}
