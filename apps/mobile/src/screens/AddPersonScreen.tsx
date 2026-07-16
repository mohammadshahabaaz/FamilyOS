import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Switch,
} from 'react-native'
import { personApi } from '../lib/api'
import { ApiError } from '../lib/api'
import type { Person } from '../lib/types'

interface Props {
  treeId: string
  persons: Person[]
  onSave: (person: Person) => void
  onCancel: () => void
}

const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
] as const

export default function AddPersonScreen({ treeId, persons, onSave, onCancel }: Props) {
  const [firstName,  setFirstName]  = useState('')
  const [lastName,   setLastName]   = useState('')
  const [gender,     setGender]     = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE')
  const [dob,        setDob]        = useState('')
  const [isDeceased, setIsDeceased] = useState(false)
  const [relPerson,  setRelPerson]  = useState<string | null>(null)
  const [relType,    setRelType]    = useState<'PARENT' | 'SPOUSE' | 'SIBLING'>('PARENT')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const person = await personApi.create(treeId, {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        gender,
        dateOfBirth: dob || undefined,
        isDeceased,
      })
      // Surface person immediately — edge failure must not hide them
      onSave(person as Person)
      if (relPerson) {
        try {
          await personApi.addEdge(treeId, {
            fromPersonId: relPerson,
            toPersonId:   person.id,
            relationType: relType,
          })
        } catch {
          setError('Person added, but relationship could not be saved. You can add it from the Members screen.')
          setLoading(false)
          return
        }
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to add person.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Person</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.saveText}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.section}>Identity</Text>

        <Text style={styles.label}>First name *</Text>
        <TextInput style={styles.input} placeholder="e.g. Tariq" placeholderTextColor="#9CA3AF"
          value={firstName} onChangeText={setFirstName} />

        <Text style={styles.label}>Last name *</Text>
        <TextInput style={styles.input} placeholder="e.g. Khan" placeholderTextColor="#9CA3AF"
          value={lastName} onChangeText={setLastName} />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          {GENDERS.map(g => (
            <TouchableOpacity
              key={g.value}
              style={[styles.genderChip, gender === g.value && styles.genderChipActive]}
              onPress={() => setGender(g.value)}
            >
              <Text style={[styles.genderText, gender === g.value && styles.genderTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Date of birth</Text>
        {/* @ts-ignore — web native date picker */}
        <input
          type="date"
          value={dob}
          onChange={(e: any) => setDob(e.target.value)}
          max={new Date().toLocaleDateString('en-CA')}
          style={{
            fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px',
            marginBottom: 12, width: '100%', boxSizing: 'border-box', outline: 'none',
          }}
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Deceased</Text>
          <Switch value={isDeceased} onValueChange={setIsDeceased} />
        </View>

        {persons.length > 0 && (
          <>
            <Text style={styles.section}>Relationship to existing member</Text>
            <Text style={styles.hint}>Optional — you can always add edges later.</Text>

            <Text style={styles.label}>Relationship type</Text>
            <View style={styles.genderRow}>
              {(['PARENT', 'SPOUSE', 'SIBLING'] as const).map(rt => (
                <TouchableOpacity
                  key={rt}
                  style={[styles.genderChip, relType === rt && styles.genderChipActive]}
                  onPress={() => setRelType(rt)}
                >
                  <Text style={[styles.genderText, relType === rt && styles.genderTextActive]}>
                    {rt.charAt(0) + rt.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {relPerson && (
              <Text style={styles.edgeHint}>
                {persons.find(p => p.id === relPerson)?.firstName ?? '?'} is {relType.toLowerCase()} of the new person
              </Text>
            )}
            <Text style={styles.label}>From person</Text>
            <ScrollView style={styles.personList} nestedScrollEnabled>
              <TouchableOpacity
                style={[styles.personRow, relPerson === null && styles.personRowActive]}
                onPress={() => setRelPerson(null)}
              >
                <Text style={[styles.personName, relPerson === null && styles.personNameActive]}>
                  None
                </Text>
              </TouchableOpacity>
              {persons.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.personRow, relPerson === p.id && styles.personRowActive]}
                  onPress={() => setRelPerson(p.id)}
                >
                  <Text style={[styles.personName, relPerson === p.id && styles.personNameActive]}>
                    {p.firstName} {p.lastName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DBDBDB',
  },
  cancelBtn: { minWidth: 60 },
  cancelText: { fontSize: 15, color: '#262626' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#262626' },
  saveBtn: {
    backgroundColor: '#111827', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 7, minWidth: 60, alignItems: 'center',
  },
  saveText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  error: { fontSize: 13, color: '#EF4444', marginBottom: 12 },
  section: { fontSize: 12, fontWeight: '800', color: '#6B7280', letterSpacing: 1, marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  hint: { fontSize: 12, color: '#9CA3AF', marginBottom: 8 },
  edgeHint: {
    fontSize: 13, color: '#0369A1', backgroundColor: '#E0F2FE',
    borderRadius: 8, padding: 10, marginBottom: 8,
    fontWeight: '500',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: '#111827', marginBottom: 12,
  },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  genderChip: {
    flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center',
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  genderChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  genderText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  genderTextActive: { color: '#FFFFFF' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  personList: { maxHeight: 200, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, marginBottom: 12 },
  personRow: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6' },
  personRowActive: { backgroundColor: '#F0F9FF' },
  personName: { fontSize: 14, color: '#374151' },
  personNameActive: { fontWeight: '700', color: '#0369A1' },
})
