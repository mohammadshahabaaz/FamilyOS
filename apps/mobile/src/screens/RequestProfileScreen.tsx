import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { profileRequestApi, ApiError } from '../lib/api'
import type { Person, BranchLabel } from '../lib/types'
import { BRANCH_LABEL_TEXT } from '../lib/types'
import { C, F } from '../lib/theme'

interface Props {
  treeId: string
  persons: Person[]
  onSubmitted: () => void
  onCancel: () => void
}

const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
] as const

const RELATION_TYPES = ['PARENT', 'SPOUSE', 'SIBLING'] as const
const BRANCH_LABELS: BranchLabel[] = ['DADIYAL', 'NANIYAL', 'IMMEDIATE', 'EXTENDED']

export default function RequestProfileScreen({ treeId, persons, onSubmitted, onCancel }: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE')
  const [relationType, setRelationType] = useState<'PARENT' | 'SPOUSE' | 'SIBLING'>('PARENT')
  const [relatedTo, setRelatedTo] = useState<string | null>(null)
  const [branchLabel, setBranchLabel] = useState<BranchLabel>('IMMEDIATE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required.')
      return
    }
    if (!mobileNumber.trim()) {
      setError('Mobile number is required.')
      return
    }
    if (!relatedTo) {
      setError('Choose the family member you’re related to.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await profileRequestApi.submit(treeId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobileNumber: mobileNumber.trim(),
        gender,
        claimedRelationType: relationType,
        claimedRelatedToPersonId: relatedTo,
        branchLabel,
      })
      onSubmitted()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to submit request.')
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
        <Text style={styles.headerTitle}>Join the Tree</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.intro}>
          Tell an admin who you are, and how you're related to someone already in the tree. They'll
          review and approve your request.
        </Text>

        <Text style={styles.section}>Your details</Text>

        <Text style={styles.label}>First name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Aisha"
          placeholderTextColor={C.textSecondary}
          value={firstName}
          onChangeText={setFirstName}
        />

        <Text style={styles.label}>Last name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Khan"
          placeholderTextColor={C.textSecondary}
          value={lastName}
          onChangeText={setLastName}
        />

        <Text style={styles.label}>Mobile number *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. +923001234567"
          placeholderTextColor={C.textSecondary}
          value={mobileNumber}
          onChangeText={setMobileNumber}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.chipRow}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.chip, gender === g.value && styles.chipActive]}
              onPress={() => setGender(g.value)}
            >
              <Text style={[styles.chipText, gender === g.value && styles.chipTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Your relationship</Text>

        <Text style={styles.label}>Relationship type</Text>
        <View style={styles.chipRow}>
          {RELATION_TYPES.map((rt) => (
            <TouchableOpacity
              key={rt}
              style={[styles.chip, relationType === rt && styles.chipActive]}
              onPress={() => setRelationType(rt)}
            >
              <Text style={[styles.chipText, relationType === rt && styles.chipTextActive]}>
                {rt.charAt(0) + rt.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {relatedTo && (
          <Text style={styles.edgeHint}>
            {persons.find((p) => p.id === relatedTo)?.firstName ?? '?'} is my{' '}
            {relationType.toLowerCase()}
          </Text>
        )}

        <Text style={styles.label}>Related to *</Text>
        <ScrollView style={styles.personList} nestedScrollEnabled>
          {persons.length === 0 ? (
            <Text style={styles.emptyHint}>No family members yet.</Text>
          ) : (
            persons.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.personRow, relatedTo === p.id && styles.personRowActive]}
                onPress={() => setRelatedTo(p.id)}
              >
                <Text style={[styles.personName, relatedTo === p.id && styles.personNameActive]}>
                  {p.firstName} {p.lastName}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <Text style={styles.label}>Family side</Text>
        <View style={styles.chipRow}>
          {BRANCH_LABELS.map((bl) => (
            <TouchableOpacity
              key={bl}
              style={[styles.chip, branchLabel === bl && styles.chipActive]}
              onPress={() => setBranchLabel(bl)}
            >
              <Text style={[styles.chipText, branchLabel === bl && styles.chipTextActive]}>
                {BRANCH_LABEL_TEXT[bl]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  cancelBtn: { padding: 4 },
  cancelText: { fontSize: 16, color: C.textSecondary },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    // @ts-ignore
    fontFamily: F.serif,
  },
  submitBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 72,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  error: {
    backgroundColor: '#FEF2F2',
    color: C.danger,
    padding: 12,
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    fontSize: 13,
    textAlign: 'center',
  },

  scroll: { flex: 1, padding: 16 },
  intro: { fontSize: 13, color: C.textSecondary, lineHeight: 19, marginBottom: 16 },

  section: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    // @ts-ignore
    textTransform: 'uppercase',
    color: C.accent,
    marginTop: 8,
    marginBottom: 10,
  },
  label: { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: C.textPrimary,
    backgroundColor: C.surfaceEl,
    marginBottom: 14,
  },

  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surfaceEl,
  },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  chipTextActive: { color: '#fff' },

  edgeHint: { fontSize: 12, fontStyle: 'italic', color: C.accent, marginBottom: 8 },

  personList: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    marginBottom: 14,
  },
  personRow: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  personRowActive: { backgroundColor: C.accentBg },
  personName: { fontSize: 14, color: C.textPrimary },
  personNameActive: { color: C.accent, fontWeight: '700' },
  emptyHint: { padding: 14, fontSize: 13, color: C.textSecondary, fontStyle: 'italic' },
})
