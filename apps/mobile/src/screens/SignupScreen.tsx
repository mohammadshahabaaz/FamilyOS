import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native'
import { signup } from '../lib/auth'
import { ApiError } from '../lib/api'
import type { AuthUser } from '../lib/auth'

interface Props {
  onSignup: (user: AuthUser) => void
  onLogin:  () => void
}

export default function SignupScreen({ onSignup, onLogin }: Props) {
  const [form, setForm] = useState({
    firstName:    '',
    lastName:     '',
    username:     '',
    mobileNumber: '',
    password:     '',
    confirmPwd:   '',
  })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [focused,  setFocused]  = useState<string | null>(null)

  function update(key: keyof typeof form) {
    return (val: string) => setForm((f) => ({ ...f, [key]: val }))
  }

  function focus(key: string) { return () => setFocused(key) }
  function blur() { setFocused(null) }

  async function handleSignup() {
    const { firstName, lastName, username, mobileNumber, password, confirmPwd } = form
    if (!firstName || !lastName || !username || !mobileNumber || !password) {
      setError('All fields are required.')
      return
    }
    if (password !== confirmPwd) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      setError('Username: lowercase letters, numbers and _ only.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const user = await signup({ firstName, lastName, username, mobileNumber: mobileNumber.trim(), password })
      onSignup(user)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inp = (key: string) => [styles.input, focused === key && styles.inputFocused]

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Logo badge */}
          <View style={styles.logoWrap}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>F</Text>
            </View>
          </View>
          <Text style={styles.logo}>FamilyOS</Text>
          <Text style={styles.subtitle}>Create your account</Text>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>First name</Text>
              <TextInput
                style={inp('firstName')}
                placeholder="Tariq"
                placeholderTextColor="#9CA3AF"
                value={form.firstName}
                onChangeText={update('firstName')}
                onFocus={focus('firstName')}
                onBlur={blur}
                autoComplete="given-name"
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Last name</Text>
              <TextInput
                style={inp('lastName')}
                placeholder="Khan"
                placeholderTextColor="#9CA3AF"
                value={form.lastName}
                onChangeText={update('lastName')}
                onFocus={focus('lastName')}
                onBlur={blur}
                autoComplete="family-name"
              />
            </View>
          </View>

          <Text style={styles.label}>Username</Text>
          <View style={[styles.inputRow, focused === 'username' && styles.inputRowFocused]}>
            <Text style={styles.inputPrefix}>@</Text>
            <TextInput
              style={[styles.input, styles.inputWithPrefix]}
              placeholder="tariq_khan"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              value={form.username}
              onChangeText={(v) => update('username')(v.toLowerCase())}
              onFocus={focus('username')}
              onBlur={blur}
            />
          </View>

          <Text style={styles.label}>Mobile number</Text>
          <TextInput
            style={inp('mobile')}
            placeholder="+91 98765 43210"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            autoComplete="tel"
            value={form.mobileNumber}
            onChangeText={update('mobileNumber')}
            onFocus={focus('mobile')}
            onBlur={blur}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={inp('password')}
            placeholder="Min 8 characters"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={form.password}
            onChangeText={update('password')}
            onFocus={focus('password')}
            onBlur={blur}
          />

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={inp('confirm')}
            placeholder="Re-enter password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={form.confirmPwd}
            onChangeText={update('confirmPwd')}
            returnKeyType="go"
            onSubmitEditing={handleSignup}
            onFocus={focus('confirm')}
            onBlur={blur}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Create account</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={onLogin} activeOpacity={0.7}>
            <Text style={styles.loginText}>
              Already have an account?{'  '}
              <Text style={styles.loginBold}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8F8' },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingVertical: 40,
  },
  card: {
    width: '100%',
    maxWidth: 440,
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
    fontSize: 28, fontWeight: '700', color: '#111827',
    textAlign: 'center', marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },

  errorBanner: {
    backgroundColor: '#FEF2F2', borderRadius: 10,
    borderWidth: 1, borderColor: '#FECACA',
    padding: 12, marginBottom: 16,
  },
  errorBannerText: { color: '#B91C1C', fontSize: 13, textAlign: 'center' },

  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },

  label: {
    fontSize: 12, fontWeight: '700', color: '#374151',
    marginBottom: 6, marginTop: 14, letterSpacing: 0.3,
    // @ts-ignore
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827', backgroundColor: '#FAFAFA',
    // @ts-ignore
    outlineStyle: 'none',
    transition: 'border-color 0.15s',
  },
  inputFocused: { borderColor: '#111827', backgroundColor: '#FFFFFF' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    backgroundColor: '#FAFAFA', overflow: 'hidden',
    // @ts-ignore
    transition: 'border-color 0.15s',
  },
  inputRowFocused: { borderColor: '#111827', backgroundColor: '#FFFFFF' },
  inputPrefix: { paddingLeft: 14, fontSize: 16, color: '#6B7280', fontWeight: '500' },
  inputWithPrefix: {
    flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingLeft: 4,
    // @ts-ignore
    outlineStyle: 'none',
  },

  btn: {
    backgroundColor: '#111827', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 24,
    // @ts-ignore
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  loginLink: { marginTop: 20, alignItems: 'center' },
  loginText: { fontSize: 14, color: '#6B7280' },
  loginBold: { color: '#111827', fontWeight: '700' },
})
