import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { familyApi } from '../lib/api'
import { ApiError } from '../lib/api'
import { C } from '../lib/theme'

interface Props {
  onDone: () => void
  onLogout: () => void
}

export default function OnboardingScreen({ onDone, onLogout }: Props) {
  const [tab, setTab] = useState<'join' | 'create'>('join')
  const [code, setCode] = useState('')
  const [treeName, setTreeName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin() {
    if (!code.trim()) {
      setError('Enter an invite code.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await familyApi.join(code.trim().toUpperCase())
      onDone()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Invalid code. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!treeName.trim()) {
      setError('Family name is required.')
      return
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError('Your name is required.')
      return
    }
    setError(null)
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
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
            onPress={() => {
              setTab('join')
              setError(null)
            }}
          >
            <Text style={[styles.tabText, tab === 'join' && styles.tabTextActive]}>
              Join with code
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'create' && styles.tabBtnActive]}
            onPress={() => {
              setTab('create')
              setError(null)
            }}
          >
            <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>
              Start a family
            </Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {tab === 'join' ? (
          <>
            <Text style={styles.label}>Invite code</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ABC12345"
              placeholderTextColor={C.textSecondary}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
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
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>Join family</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Family name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Khan Family"
              placeholderTextColor={C.textSecondary}
              value={treeName}
              onChangeText={setTreeName}
              maxLength={60}
            />
            <Text style={styles.label}>Your first name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Tariq"
              placeholderTextColor={C.textSecondary}
              value={firstName}
              onChangeText={setFirstName}
              maxLength={40}
            />
            <Text style={styles.label}>Your last name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Khan"
              placeholderTextColor={C.textSecondary}
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
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>Create family tree</Text>
              )}
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
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    // @ts-ignore
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: C.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  sub: { fontSize: 14, color: C.textSecondary, marginBottom: 20, textAlign: 'center' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: C.surfaceEl,
    borderRadius: 10,
    marginBottom: 20,
    padding: 3,
  },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: {
    backgroundColor: C.surface, // @ts-ignore
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },
  tabText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  tabTextActive: { color: C.textPrimary },

  error: { fontSize: 13, color: C.danger, marginBottom: 12, textAlign: 'center' },

  label: { fontSize: 13, fontWeight: '600', color: C.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: C.surfaceEl,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: C.textPrimary,
    marginBottom: 16,
  },

  btn: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  logoutLink: { marginTop: 20, alignItems: 'center' },
  logoutText: { fontSize: 13, color: C.textSecondary, textDecorationLine: 'underline' },
})
