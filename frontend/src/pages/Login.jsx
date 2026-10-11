import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const { user, loading, login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    if (loading) return <p>Checking login...</p>
    if (user) return <Navigate to="/learning" replace />

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            await login({ email, password })
            const destination = location.state?.from || '/learning'
            navigate(destination, { replace: true })
        } catch (err) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main style={styles.page}>
            <form onSubmit={handleSubmit} style={styles.card}>
                <div style={styles.logo}>TypeMaster</div>
                <h1 style={styles.heading}>Welcome back</h1>
                <p style={styles.subtitle}>Login to continue your typing journey.</p>

                {error && <div role="alert" style={styles.error}>{error}</div>}

                <label style={styles.label} htmlFor="email">Email address</label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={styles.input}
                />

                <label style={styles.label} htmlFor="password">
                    Password
                </label>

                <div style={styles.passwordWrapper}>
                    <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        style={styles.passwordInput}
                    />

                    <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                        style={styles.eyeButton}
                    >
                        {showPassword ? (
                            <svg width="21" height="21" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="1.8"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 3l18 18" />
                                <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                                <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7a11 11 0 01-3 4.2" />
                                <path d="M6.2 6.2A12 12 0 002.5 12c1 2.5 4.5 7 9.5 7 1.3 0 2.5-.3 3.6-.8" />
                            </svg>
                        ) : (
                            <svg width="21" height="21" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="1.8"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                </div>


                <button disabled={submitting} type="submit" style={styles.button}>
                    {submitting ? 'Logging in...' : 'Login'}
                </button>

                <p style={styles.footer}>
                    Don't have an account? <Link to="/register">Create account</Link>
                </p>
            </form>
        </main>
    )
}

const styles = {
    page: {
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        padding: 20, background: '#f1f5ff', fontFamily: 'Inter, sans-serif',
    },
    card: {
        width: '100%', maxWidth: 420, boxSizing: 'border-box',
        padding: 32, background: '#fff', borderRadius: 20,
        boxShadow: '0 15px 50px rgba(30, 50, 100, .09)',
    },
    logo: { color: '#4f46e5', fontWeight: 800, fontSize: 22 },
    heading: { marginBottom: 8, color: '#172033' },
    subtitle: { color: '#64748b', marginBottom: 24 },
    label: { display: 'block', margin: '16px 0 7px', fontSize: 14, fontWeight: 600 },
    input: {
        width: '100%', boxSizing: 'border-box', padding: 12,
        border: '1px solid #cbd5e1', borderRadius: 9, fontSize: 15,
    },
    button: {
        width: '100%', padding: 13, marginTop: 22, border: 0,
        borderRadius: 9, background: '#4f46e5', color: '#fff',
        fontWeight: 700, cursor: 'pointer',
    },
    footer: { marginTop: 22, textAlign: 'center', color: '#64748b', fontSize: 14 },
    error: {
        padding: 12, borderRadius: 8, background: '#fef2f2',
        color: '#b91c1c', fontSize: 14,
    },
    passwordWrapper: {
        position: 'relative',
        width: '100%',
    },

    passwordInput: {
        width: '100%',
        boxSizing: 'border-box',
        padding: '12px 44px 12px 12px',
        border: '1px solid #cbd5e1',
        borderRadius: 9,
        fontSize: 15,
    },

    eyeButton: {
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        background: 'transparent',
        color: '#64748b',
        cursor: 'pointer',
        padding: 4,
    },
}