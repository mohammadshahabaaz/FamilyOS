import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { login } from '../lib/auth'
import { ApiError } from '../lib/api'
import type { AuthUser } from '../lib/auth'

interface Props {
  onLogin:  (user: AuthUser) => void
  onSignup: () => void
}

export default function LoginScreen({ onLogin, onSignup }: Props) {
  const [mobile,   setMobile]   = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [focused,  setFocused]  = useState<'mobile' | 'password' | null>(null)

  async function handleLogin() {
    if (!mobile.trim() || !password) {
      setError('Please enter your mobile number and password.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const user = await login(mobile.trim(), password)
      onLogin(user)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>F</Text>
          </View>
        </View>
        <Text style={styles.logo}>FamilyOS</Text>
        <Text style={styles.tagline}>Your family's memories, forever.</Text>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>Mobile number</Text>
        <TextInput
          style={[styles.input, focused === 'mobile' && styles.inputFocused]}
          placeholder="+91 98765 43210"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          autoComplete="tel"
          value={mobile}
          onChangeText={setMobile}
          onFocus={() => setFocused('mobile')}
          onBlur={() => setFocused(null)}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, focused === 'password' && styles.inputFocused]}
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
          returnKeyType="go"
          onFocus={() => setFocused('password')}
          onBlur={() => setFocused(null)}
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Log in</Text>
          }
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.divLine} />
          <Text style={styles.divText}>OR</Text>
          <View style={styles.divLine} />
        </View>

        <TouchableOpacity style={styles.signupBtn} onPress={onSignup} activeOpacity={0.8}>
          <Text style={styles.signupText}>Create a new account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    // @ts-ignore
    boxShadow: '0 4px 32px rgba(0,0,0,0.09)',
  },
  logoWrap: { alignItems: 'center', marginBottom: 12 },
  logoBadge: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center', justifyContent: 'center',
    // @ts-ignore
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  logoBadgeText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  logo: {
    // @ts-ignore
    fontFamily: 'Georgia, serif',
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: { color: '#B91C1C', fontSize: 13, textAlign: 'center' },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
    marginTop: 14,
    letterSpacing: 0.3,
    // @ts-ignore
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FAFAFA',
    // @ts-ignore
    outlineStyle: 'none',
    // @ts-ignore
    transition: 'border-color 0.15s',
  },
  inputFocused: {
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
  },
  btn: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    // @ts-ignore
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB' },
  divText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  signupBtn: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    // @ts-ignore
    transition: 'border-color 0.15s',
  },
  signupText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
})
