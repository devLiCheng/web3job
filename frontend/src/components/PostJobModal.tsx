'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import '../i18n/config'

interface PostJobModalProps {
  onClose: () => void
  onSubmitSuccess: (newJob: any) => void
}

export default function PostJobModal({ onClose, onSubmitSuccess }: PostJobModalProps) {
  const { t } = useTranslation()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    tags: '',
    salary: '',
    description: '',
    apply_url: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Check auth status
  const checkAuth = () => {
    const logged = localStorage.getItem('isLoggedIn') === 'true'
    setIsLoggedIn(logged)
  }

  useEffect(() => {
    checkAuth()
    window.addEventListener('auth-state-change', checkAuth)
    return () => {
      window.removeEventListener('auth-state-change', checkAuth)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const triggerLogin = () => {
    window.dispatchEvent(new CustomEvent('trigger-auth-modal'))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.company || !formData.tags || !formData.description) {
      setErrorMsg(t('modal.errorEmpty'))
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const res = await fetch('http://localhost:6002/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          is_featured: false
        })
      })

      if (!res.ok) {
        throw new Error('Database insertion rejected submission.')
      }

      const parsed = await res.json()
      
      const newJobItem = {
        ...parsed.data,
        id: String(Date.now()),
        tags: formData.tags.split(',').map(s => s.trim()),
        timeAgo: 'Recently Sourced'
      }

      onSubmitSuccess(newJobItem)
      onClose()
    } catch (err: any) {
      setErrorMsg(t('modal.errorOffline'))
      
      const fallbackMock = {
        id: String(Date.now()),
        title: formData.title,
        company: formData.company,
        tags: formData.tags.split(',').map(s => s.trim()),
        salary: formData.salary || 'Competitive',
        description: formData.description,
        apply_url: formData.apply_url || '#',
        timeAgo: 'Recently Sourced'
      }
      setTimeout(() => {
        onSubmitSuccess(fallbackMock)
        onClose()
      }, 500)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 5, 7, 0.9)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '1.5rem'
    }}>
      
      {/* Concentric Double-Bezel frame for the modal itself (Doppelrand) */}
      <div className="double-bezel-shell" style={{ width: '100%', maxWidth: '560px', height: 'auto' }}>
        <div 
          className="double-bezel-core"
          style={{
            animation: 'fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            padding: '1.5rem'
          }}
        >
          {/* Corner crosshairs */}
          <span className="tactical-crosshair tl">+</span>
          <span className="tactical-crosshair tr">+</span>
          <span className="tactical-crosshair bl">+</span>
          <span className="tactical-crosshair br">+</span>

          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Modal Header */}
          <div style={{
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div>
              <span className="telemetry-label" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>[SYS_FORM // PUBLISH_ROLE]</span>
              <h2 className="editorial-title" style={{ fontSize: '1.25rem', marginTop: '0.15rem', color: '#fff' }}>
                {t('modal.title')}
              </h2>
            </div>
            <button 
              onClick={onClose}
              style={{ 
                color: 'var(--text-secondary)', 
                display: 'inline-flex',
                padding: '0.4rem',
                borderRadius: '50%',
                transition: 'var(--transition-spring)',
                minHeight: '44px',
                minWidth: '44px',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* If not logged in, display beautiful blocking overlay */}
          {!isLoggedIn ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2.5rem 1rem',
              textAlign: 'center',
              gap: '1.25rem'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                fontSize: '1.8rem',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.1)'
              }}>
                🔒
              </div>
              <div>
                <span className="telemetry-label" style={{ color: '#ef4444', fontSize: '0.75rem' }}>
                  [ ACCESS_DENIED // AUTHORIZATION_REQUIRED ]
                </span>
                <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, marginTop: '0.35rem' }}>
                  发布岗位需要先登入系统
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', maxWidth: '380px', lineHeight: 1.4 }}>
                  为了维护 Web3 招聘生态的真实与安全，发布远程岗位必须建立有效的操作凭证节点。请点击下方按钮完成连接。
                </p>
              </div>
              
              <button 
                type="button" 
                onClick={triggerLogin}
                className="btn-primary"
                style={{
                  height: '44px',
                  fontSize: '0.8rem',
                  padding: '0 1.5rem',
                  background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
                  color: '#000',
                  fontWeight: 700
                }}
              >
                立即登录 / 注册并解锁
              </button>
            </div>
          ) : (
            // Form (Only shown if logged in)
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {errorMsg && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.12)',
                  color: '#f87171',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-button)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span className="telemetry-label" style={{ fontSize: '0.7rem', color: '#f87171' }}>[ {errorMsg} ]</span>
                </div>
              )}

              {/* Form Rows */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label className="telemetry-label" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    {t('modal.fieldTitle')}
                  </label>
                  <input 
                    type="text" 
                    name="title" 
                    className="form-input" 
                    placeholder="e.g. Solidity Architect"
                    value={formData.title} 
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label className="telemetry-label" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    {t('modal.fieldCompany')}
                  </label>
                  <input 
                    type="text" 
                    name="company" 
                    className="form-input" 
                    placeholder="e.g. Uniswap Labs"
                    value={formData.company} 
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label className="telemetry-label" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    {t('modal.fieldTags')}
                  </label>
                  <input 
                    type="text" 
                    name="tags" 
                    className="form-input" 
                    placeholder="e.g. Solidity, Rust, EVM"
                    value={formData.tags} 
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label className="telemetry-label" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    {t('modal.fieldSalary')}
                  </label>
                  <input 
                    type="text" 
                    name="salary" 
                    className="form-input" 
                    placeholder="e.g. $120k - $160k"
                    value={formData.salary} 
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label className="telemetry-label" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  {t('modal.fieldUrl')}
                </label>
                <input 
                  type="url" 
                  name="apply_url" 
                  className="form-input" 
                  placeholder="https://company.com/careers"
                  value={formData.apply_url} 
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label className="telemetry-label" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  {t('modal.fieldDesc')}
                </label>
                <textarea 
                  name="description" 
                  className="form-input" 
                  rows={3}
                  placeholder="List out core specs, expectations..."
                  value={formData.description} 
                  onChange={handleInputChange}
                  style={{ resize: 'none' }}
                  required
                />
              </div>

              {/* Action Row */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '0.25rem',
                borderTop: '1px solid var(--border-light)',
                paddingTop: '1rem'
              }}>
                <button type="button" className="btn-secondary" onClick={onClose} style={{ minHeight: '44px', minWidth: '100px' }}>
                  {t('modal.cancel')}
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ minHeight: '44px', minWidth: '100px' }}>
                  {isSubmitting ? t('modal.submitting') : t('modal.submit')}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  )
}
