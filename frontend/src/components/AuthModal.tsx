'use client'

import React, { useState, useEffect } from 'react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (username: string) => void
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  
  // Login states
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState('')

  // Register states
  const [regUser, setRegUser] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regCode, setRegCode] = useState('')
  const [regError, setRegError] = useState('')

  // Captcha countdown states
  const [countdown, setCountdown] = useState(0)
  const [generatedCode, setGeneratedCode] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)

  // Countdown timer
  useEffect(() => {
    let interval: any
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else {
      setIsCodeSent(false)
    }
    return () => clearInterval(interval)
  }, [countdown])

  if (!isOpen) return null

  // Trigger Mock Code Generation
  const handleSendCode = () => {
    if (!regEmail || !regEmail.includes('@')) {
      setRegError('请输入有效的邮箱地址')
      return
    }
    setRegError('')
    
    // Generate a premium Web3 style 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    setGeneratedCode(code)
    setCountdown(60)
    setIsCodeSent(true)
    
    // Log verification logs to console/alert mock style
    console.log(`[SYS // CAPTCHA LOG] Sent code to ${regEmail}: ${code}`)
  }

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginUser || !loginPass) {
      setLoginError('请输入用户名和密码')
      return
    }
    
    // Mock login credentials validation
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('username', loginUser)
    localStorage.setItem('email', `${loginUser}@remoteweb3.com`)
    
    onLoginSuccess(loginUser)
    // Dispatch a global event to let other components know login happened
    window.dispatchEvent(new CustomEvent('auth-state-change'))
    onClose()
  }

  // Handle Register submission (Instant login logic)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!regUser || !regPass || !regEmail || !regCode) {
      setRegError('请填写所有必填字段')
      return
    }
    if (regCode !== generatedCode) {
      setRegError('验证码错误，请重新输入')
      return
    }

    // Standard Mock Registration -> Immediately auto login!
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('username', regUser)
    localStorage.setItem('email', regEmail)

    // Save user record to local storage database mock (for admin user manager panel)
    const storedUsers = JSON.parse(localStorage.getItem('mock_registered_users') || '[]')
    const newUser = {
      username: regUser,
      email: regEmail,
      status: 'Active',
      registeredAt: new Date().toISOString()
    }
    storedUsers.push(newUser)
    localStorage.setItem('mock_registered_users', JSON.stringify(storedUsers))

    // Save code to log history
    const storedCodes = JSON.parse(localStorage.getItem('mock_captcha_logs') || '[]')
    storedCodes.push({
      email: regEmail,
      code: generatedCode,
      status: 'VERIFIED',
      time: new Date().toISOString()
    })
    localStorage.setItem('mock_captcha_logs', JSON.stringify(storedCodes))

    onLoginSuccess(regUser)
    // Dispatch state change
    window.dispatchEvent(new CustomEvent('auth-state-change'))
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 6, 10, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem'
    }}>
      {/* Double Bezel Glassmorphic Cockpit Shell */}
      <div 
        className="double-bezel-shell" 
        style={{ 
          maxWidth: '440px', 
          width: '100%', 
          borderColor: 'var(--border-light)',
          animation: 'modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        <div className="double-bezel-core" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Tactical Crosshair corner marks */}
          <span className="tactical-crosshair tl">+</span>
          <span className="tactical-crosshair tr">+</span>
          <span className="tactical-crosshair bl">+</span>
          <span className="tactical-crosshair br">+</span>

          {/* Header Panel */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="telemetry-label" style={{ color: 'var(--accent-cyan)', fontSize: '0.65rem' }}>
                [ SYSTEM_ACCESS // GATEWAY ]
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem', fontFamily: 'var(--font-sans)', letterSpacing: '-0.5px' }}>
                {activeTab === 'login' ? '连接节点 登录' : '创建凭证 注册'}
              </h2>
            </div>
            
            {/* Close trigger (44px responsive target) */}
            <button 
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-light)',
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-cyan)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-light)'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              ✕
            </button>
          </div>

          {/* Visual Dual Tab Switchers */}
          <div style={{
            display: 'flex',
            border: '1px solid var(--border-light)',
            borderRadius: '6px',
            overflow: 'hidden',
            padding: '2px',
            backgroundColor: 'rgba(255, 255, 255, 0.01)'
          }}>
            <button
              onClick={() => { setActiveTab('login'); setLoginError(''); setRegError(''); }}
              style={{
                flex: 1,
                padding: '0.6rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                backgroundColor: activeTab === 'login' ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
                color: activeTab === 'login' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              [ LOG_IN // 登录 ]
            </button>
            <button
              onClick={() => { setActiveTab('register'); setLoginError(''); setRegError(''); }}
              style={{
                flex: 1,
                padding: '0.6rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                backgroundColor: activeTab === 'register' ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
                color: activeTab === 'register' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              [ REGISTER // 注册 ]
            </button>
          </div>

          {/* Login view */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label className="telemetry-label" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>用户名 / 邮箱</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="请输入您的用户名" 
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  style={{ height: '42px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label className="telemetry-label" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>安全密码</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="请输入您的密码" 
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  style={{ height: '42px', fontSize: '0.85rem' }}
                />
              </div>

              {loginError && (
                <div style={{
                  color: '#ef4444',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '4px',
                  marginTop: '0.2rem'
                }}>
                  ● 错误: {loginError}
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ 
                  marginTop: '0.5rem', 
                  height: '44px', 
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--accent-cyan)',
                  color: '#030406'
                }}
              >
                授权并登入系统
              </button>
            </form>
          ) : (
            // Register view with instant login flow
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label className="telemetry-label" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>用户名</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="设置您的账号名" 
                  value={regUser}
                  onChange={(e) => setRegUser(e.target.value)}
                  style={{ height: '42px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label className="telemetry-label" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>电子邮箱</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="请输入您的邮箱" 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  style={{ height: '42px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label className="telemetry-label" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>安全密码</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="请设置您的登录密码" 
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  style={{ height: '42px', fontSize: '0.85rem' }}
                />
              </div>

              {/* Captcha/Verification Row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label className="telemetry-label" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>邮箱验证码</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="4位验证码" 
                    value={regCode}
                    onChange={(e) => setRegCode(e.target.value)}
                    style={{ flex: 1, height: '42px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                  />
                  <button 
                    type="button"
                    onClick={handleSendCode}
                    disabled={countdown > 0}
                    className="btn-secondary"
                    style={{
                      height: '42px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '0 1rem',
                      borderColor: countdown > 0 ? 'var(--border-light)' : 'var(--accent-cyan)',
                      color: countdown > 0 ? 'var(--text-muted)' : 'var(--accent-cyan)',
                      opacity: countdown > 0 ? 0.6 : 1,
                      cursor: countdown > 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {countdown > 0 ? `[ 重试 // ${countdown}s ]` : '[ 发送验证码 ]'}
                  </button>
                </div>

                {/* Tactical visual display box of generated captcha */}
                {generatedCode && countdown > 0 && (
                  <div style={{
                    backgroundColor: 'rgba(0, 242, 254, 0.03)',
                    border: '1px dashed rgba(0, 242, 254, 0.2)',
                    borderRadius: '4px',
                    padding: '0.6rem 0.85rem',
                    marginTop: '0.4rem',
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-cyan)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>[SYS_TELEMETRY: VERIFICATION_CODE_DISPATCHED]</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '2px' }}>
                      CODE: {generatedCode}
                    </span>
                  </div>
                )}
              </div>

              {regError && (
                <div style={{
                  color: '#ef4444',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '4px',
                  marginTop: '0.2rem'
                }}>
                  ● 错误: {regError}
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ 
                  marginTop: '0.5rem', 
                  height: '44px', 
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
                  color: '#000'
                }}
              >
                立即注册并登录系统
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
