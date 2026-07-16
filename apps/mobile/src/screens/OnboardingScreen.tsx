import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { familyApi } from '../lib/api'
import { ApiError } from '../lib/api'

interface Props {
  onDone: () => void
  onLogout: () => void
}

export default function OnboardingScreen({ onDone, onLogout }: Props) {
  const [tab,       setTab]       = useState<'join' | 'create'>('join')
  const [code,      setCode]      = useState('')
  const [treeName,  setTreeName]  = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function handleJoin() {
    if (!code.trim()) { setError('Enter an invite code.'); return }
    setError(null); setLoading(true)
    try {
      await familyApi.join(code.trim().toUpperCase())
      onDone()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Invalid code. Try again.')
    } finally { setLoading(false) }
  }

  async function handleCreate() {
    if (!treeName.trim()) { setError('Family name is required.'); return }
    if (!firstName.trim() || !lastName.trim()) { setError('Your name is required.'); return }
    setError(null); setLoading(true)
    try {
      await familyApi.create({
        name: treeName.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: 'OTHER',
      })
      onDone()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not create family. Try again.')
    } finally { setLoading(false) }
  }

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome to FamilyOS</Text>
        <Text style={styles.sub}>Join your family tree or start a new one.</Text>

        {/* Tab switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'join' && styles.tabBtnActive]}
            onPress={() => { setTab('join'); setError(null) }}
          >
            <Text style={[styles.tabText, tab === 'join' && styles.tabTextActive]}>Join with code</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'create' && styles.tabBtnActive]}
            onPress={() => { setTab('create'); setError(null) }}
          >
            <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>Start a family</Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {tab === 'join' ? (
          <>
            <Text style={styles.label}>Invite code</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ABC12345"
              placeholderTextColor="#9CA3AF"
              value={code}
              onChangeText={v => setCode(v.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
            />
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleJoin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnText}>Join family</Text>
              }
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Family name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Khan Family"
              placeholderTextColor="#9CA3AF"
              value={treeName}
              onChangeText={setTreeName}
              maxLength={60}
            />
            <Text style={styles.label}>Your first name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Tariq"
              placeholderTextColor="#9CA3AF"
              value={firstName}
              onChangeText={setFirstName}
              maxLength={40}
            />
            <Text style={styles.label}>Your last name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Khan"
              placeholderTextColor="#9CA3AF"
              value={lastName}
              onChangeText={setLastName}
              maxLength={40}
            />
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleCreate}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnText}>Create family tree</Text>
              }
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.logoutLink} onPress={onLogout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    // @ts-ignore
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 6, textAlign: 'center' },
  sub:   { fontSize: 14, color: '#6B7280', marginBottom: 20, textAlign: 'center' },

  tabs: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 10, marginBottom: 20, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#FFFFFF', // @ts-ignore
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#111827' },

  error: { fontSize: 13, color: '#EF4444', marginBottom: 12, textAlign: 'center' },

  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
    marginBottom: 16,
  },

  btn: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  logoutLink: { marginTop: 20, alignItems: 'center' },
  logoutText: { fontSize: 13, color: '#9CA3AF', textDecorationLine: 'underline' },
})
