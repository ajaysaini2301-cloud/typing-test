
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
    const { user, loading, register } = useAuth()
    const navigate = useNavigate()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    if (loading) return <p>Checking login...</p>
    if (user) return <Navigate to="/learning" replace />

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setSubmitting(true)

        try {
            await register({ name, email, password })
            navigate('/login', {
                replace: true,
                state: { message: 'Account created. Please login.' },
            })
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
                <h1 style={styles.heading}>Create your account</h1>
                <p style={styles.subtitle}>Start your typing learning journey.</p>

                {error && <div role="alert" style={styles.error}>{error}</div>}

                <label style={styles.label} htmlFor="name">Full name</label>
                <input
                    id="name"
                    autoComplete="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={100}
                    required
                    style={styles.input}
                    placeholder="Your name"
                />

                <label style={styles.label} htmlFor="email">Email address</label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    maxLength={255}
                    required
                    style={styles.input}
                    placeholder="you@example.com"
                />

                <label style={styles.label} htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    minLength={8}
                    maxLength={128}
                    required
                    style={styles.input}
                    placeholder="At least 8 characters"
                />

                <label style={styles.label} htmlFor="confirmPassword">Confirm password</label>
                <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    minLength={8}
                    maxLength={128}
                    required
                    style={styles.input}
                    placeholder="Re-enter password"
                />

                <button disabled={submitting} type="submit" style={styles.button}>
                    {submitting ? 'Creating account...' : 'Create account'}
                </button>

                <p style={styles.footer}>
                    Already registered? <Link to="/login">Login</Link>
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
        width: '100%', maxWidth: 440, boxSizing: 'border-box',
        padding: 32, background: '#fff', borderRadius: 20,
        boxShadow: '0 15px 50px rgba(30, 50, 100, .09)',
    },
    logo: { color: '#4f46e5', fontWeight: 800, fontSize: 22 },
    heading: { marginBottom: 8, color: '#172033' },
    subtitle: { color: '#64748b', marginBottom: 24 },
    label: { display: 'block', margin: '14px 0 7px', fontSize: 14, fontWeight: 600 },
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
}