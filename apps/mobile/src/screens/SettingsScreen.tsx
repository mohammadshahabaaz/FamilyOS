import { useState, useEffect } from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native'
import { C, shadow } from '../lib/theme'
import type { Screen } from '../../App'
import { profileRequestApi } from '../lib/api'
import type { ProfileRequestItem } from '../lib/types'
import { BRANCH_LABEL_TEXT } from '../lib/types'

interface Props {
  navigateTo: (s: Screen) => void
  treeId: string
  myRole?: string
}

interface Setting {
  id: string
  title: string
  description: string
  type: 'toggle' | 'choice' | 'link'
  defaultOn?: boolean
  choices?: string[]
  defaultChoice?: string
  icon: string
  iconBg: string
  iconColor: string
  dangerous?: boolean
}

const SECURITY_SETTINGS: Setting[] = [
  {
    id: 'invite_authority',
    title: 'Member Invite Authority',
    description: 'Who can send invites to join this family tree',
    type: 'choice',
    choices: ['Admins only', 'Any verified member'],
    defaultChoice: 'Admins only',
    icon: '✉',
    iconBg: '#1B4F7215',
    iconColor: '#1B4F72',
  },
  {
    id: 'deceased_visibility',
    title: 'Deceased Member Visibility',
    description: "How much of a deceased member's profile non-admins can see",
    type: 'choice',
    choices: ['Full profile', 'Summary only', 'Admins only'],
    defaultChoice: 'Summary only',
    icon: '†',
    iconBg: C.accentBg,
    iconColor: C.textSecondary,
  },
  {
    id: 'profile_edit_lock',
    title: 'Lock Profiles After Passing',
    description: "Prevent edits to a member's record once marked as deceased",
    type: 'toggle',
    defaultOn: true,
    icon: '🔒',
    iconBg: '#B03A2E12',
    iconColor: C.danger,
  },
  {
    id: 'device_trust',
    title: 'Require Device Approval',
    description: 'New sign-ins from unrecognised devices need admin confirmation',
    type: 'toggle',
    defaultOn: false,
    icon: '📱',
    iconBg: '#2D6A4F12',
    iconColor: C.success,
  },
  {
    id: 'join_expiry',
    title: 'Pending Invite Expiry',
    description: 'Auto-expire unaccepted invites after this period',
    type: 'choice',
    choices: ['7 days', '14 days', '30 days', 'Never'],
    defaultChoice: '14 days',
    icon: '⏱',
    iconBg: '#1B4F7215',
    iconColor: '#1B4F72',
  },
  {
    id: 'media_download',
    title: 'Original Photo Downloads',
    description: 'Who can download full-resolution photos from memories',
    type: 'choice',
    choices: ['Only me', 'Admins', 'All members'],
    defaultChoice: 'Admins',
    icon: '⬇',
    iconBg: C.accentBg,
    iconColor: C.accent,
  },
  {
    id: 'event_visibility',
    title: 'Default Event Visibility',
    description: 'Who can see new events unless overridden per-event',
    type: 'choice',
    choices: ['Entire tree', 'Direct branch only', 'Admins only'],
    defaultChoice: 'Entire tree',
    icon: '👁',
    iconBg: '#2D6A4F12',
    iconColor: C.success,
  },
  {
    id: 'treelink_gate',
    title: 'In-Law Tree Link Approval',
    description: 'Require both-tree admin approval before linking an in-law tree',
    type: 'toggle',
    defaultOn: true,
    icon: '🤝',
    iconBg: C.accentBg,
    iconColor: C.accent,
  },
]

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN']

export default function SettingsScreen({ navigateTo, treeId, myRole }: Props) {
  const isAdmin = !!myRole && ADMIN_ROLES.includes(myRole)
  const [pendingRequests, setPendingRequests] = useState<ProfileRequestItem[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [actioningId, setActioningId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    setLoadingRequests(true)
    profileRequestApi
      .listPending(treeId)
      .then(setPendingRequests)
      .catch(() => setPendingRequests([]))
      .finally(() => setLoadingRequests(false))
  }, [isAdmin, treeId])

  async function handleApprove(requestId: string) {
    setActioningId(requestId)
    try {
      await profileRequestApi.approve(treeId, requestId)
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
    } catch {
    } finally {
      setActioningId(null)
    }
  }

  async function handleReject(requestId: string) {
    setActioningId(requestId)
    try {
      await profileRequestApi.reject(treeId, requestId)
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))
    } catch {
    } finally {
      setActioningId(null)
    }
  }

  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      SECURITY_SETTINGS.filter((s) => s.type === 'toggle').map((s) => [s.id, s.defaultOn ?? false]),
    ),
  )
  const [choices, setChoices] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      SECURITY_SETTINGS.filter((s) => s.type === 'choice').map((s) => [
        s.id,
        s.defaultChoice ?? s.choices?.[0] ?? '',
      ]),
    ),
  )
  const [openChoice, setOpenChoice] = useState<string | null>(null)

  function setChoice(id: string, val: string) {
    setChoices((prev) => ({ ...prev, [id]: val }))
    setOpenChoice(null)
  }

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <View style={styles.intro}>
        <Text style={styles.introTitle}>Family Security</Text>
        <Text style={styles.introSub}>
          These settings govern who can access, edit, and share content within your family tree.
          Changes apply to all members.
        </Text>
      </View>

      {isAdmin && (loadingRequests || pendingRequests.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Requests</Text>
          <View style={styles.card}>
            {loadingRequests ? (
              <View style={styles.requestLoading}>
                <ActivityIndicator size="small" color={C.accent} />
              </View>
            ) : (
              pendingRequests.map((r, i) => (
                <View
                  key={r.id}
                  style={[styles.requestRow, i === pendingRequests.length - 1 && styles.rowLast]}
                >
                  <Text style={styles.requestName}>
                    {r.firstName} {r.lastName}
                  </Text>
                  <Text style={styles.requestMeta}>
                    Claims to be {r.claimedRelationType.toLowerCase()} of{' '}
                    {r.claimedRelatedTo.firstName} {r.claimedRelatedTo.lastName} ·{' '}
                    {BRANCH_LABEL_TEXT[r.branchLabel]}
                  </Text>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.requestBtn, styles.requestBtnReject]}
                      onPress={() => handleReject(r.id)}
                      disabled={actioningId === r.id}
                    >
                      <Text style={styles.requestBtnRejectText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.requestBtn, styles.requestBtnApprove]}
                      onPress={() => handleApprove(r.id)}
                      disabled={actioningId === r.id}
                    >
                      {actioningId === r.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.requestBtnApproveText}>Approve</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Access Controls</Text>
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>PREVIEW</Text>
          </View>
        </View>
        <Text style={styles.previewNote}>
          Not saved yet — enforcement is coming in a future update.
        </Text>
        <View style={styles.card}>
          {SECURITY_SETTINGS.slice(0, 4).map((s, i) => (
            <SettingRow
              key={s.id}
              setting={s}
              toggleValue={toggles[s.id]}
              choiceValue={choices[s.id]}
              isOpen={openChoice === s.id}
              onToggle={(v) => setToggles((prev) => ({ ...prev, [s.id]: v }))}
              onOpenChoice={() => setOpenChoice(openChoice === s.id ? null : s.id)}
              onChooseOption={(val) => setChoice(s.id, val)}
              isLast={i === 3}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Content & Visibility</Text>
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>PREVIEW</Text>
          </View>
        </View>
        <Text style={styles.previewNote}>
          Not saved yet — enforcement is coming in a future update. The In-Law Tree Link Approval
          setting also depends on an unresolved product decision about cross-tree visibility.
        </Text>
        <View style={styles.card}>
          {SECURITY_SETTINGS.slice(4).map((s, i) => (
            <SettingRow
              key={s.id}
              setting={s}
              toggleValue={toggles[s.id]}
              choiceValue={choices[s.id]}
              isOpen={openChoice === s.id}
              onToggle={(v) => setToggles((prev) => ({ ...prev, [s.id]: v }))}
              onOpenChoice={() => setOpenChoice(openChoice === s.id ? null : s.id)}
              onChooseOption={(val) => setChoice(s.id, val)}
              isLast={i === 3}
            />
          ))}
        </View>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Security changes are logged. Family admins will be notified of any modifications.
        </Text>
      </View>

      <View style={styles.bottomPad} />
    </ScrollView>
  )
}

interface RowProps {
  setting: Setting
  toggleValue?: boolean
  choiceValue?: string
  isOpen: boolean
  onToggle: (v: boolean) => void
  onOpenChoice: () => void
  onChooseOption: (v: string) => void
  isLast: boolean
}

function SettingRow({
  setting: s,
  toggleValue,
  choiceValue,
  isOpen,
  onToggle,
  onOpenChoice,
  onChooseOption,
  isLast,
}: RowProps) {
  return (
    <View>
      <View style={[styles.row, isLast && styles.rowLast]}>
        <View style={[styles.rowIcon, { backgroundColor: s.iconBg }]}>
          <Text style={[styles.rowIconText, { color: s.iconColor }]}>{s.icon}</Text>
        </View>

        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{s.title}</Text>
          <Text style={styles.rowDesc}>{s.description}</Text>

          {s.type === 'choice' && (
            <TouchableOpacity style={styles.choiceBtn} onPress={onOpenChoice} activeOpacity={0.7}>
              <Text style={styles.choiceValue}>{choiceValue}</Text>
              <Text style={styles.choiceChevron}>{isOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {s.type === 'toggle' && (
          <Switch
            value={toggleValue ?? false}
            onValueChange={onToggle}
            trackColor={{ false: C.border, true: C.accentSoft }}
            thumbColor={toggleValue ? C.accent : '#FFFFFF'}
          />
        )}
      </View>

      {/* Choice dropdown */}
      {isOpen && s.type === 'choice' && (
        <View style={styles.dropdown}>
          {s.choices?.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.dropdownItem, choiceValue === opt && styles.dropdownItemActive]}
              onPress={() => onChooseOption(opt)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.dropdownLabel, choiceValue === opt && styles.dropdownLabelActive]}
              >
                {opt}
              </Text>
              {choiceValue === opt && <Text style={styles.dropdownCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!isLast && <View style={styles.divider} />}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  intro: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.textPrimary,
    marginBottom: 6,
  },
  introSub: { fontSize: 13, color: C.textSecondary, lineHeight: 19 },

  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
    // @ts-ignore
    textTransform: 'uppercase',
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewBadge: {
    backgroundColor: C.accentBg,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 8,
  },
  previewBadgeText: { fontSize: 9, fontWeight: '800', color: C.accent, letterSpacing: 0.5 },
  previewNote: {
    fontSize: 12,
    color: C.textSecondary,
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 17,
  },

  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    // @ts-ignore
    boxShadow: shadow.card,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  rowLast: { borderBottomWidth: 0 },

  requestLoading: { paddingVertical: 24, alignItems: 'center' },
  requestRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
    gap: 4,
  },
  requestName: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  requestMeta: { fontSize: 12, color: C.textSecondary, lineHeight: 17 },
  requestActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  requestBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  requestBtnReject: { backgroundColor: C.surfaceEl, borderWidth: 1, borderColor: C.border },
  requestBtnRejectText: { fontSize: 13, fontWeight: '700', color: C.textSecondary },
  requestBtnApprove: { backgroundColor: C.accent },
  requestBtnApproveText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  rowIconText: { fontSize: 16 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: C.textPrimary, marginBottom: 3 },
  rowDesc: { fontSize: 12, color: C.textSecondary, lineHeight: 17 },

  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: C.accentBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  choiceValue: { fontSize: 13, fontWeight: '600', color: C.accent },
  choiceChevron: { fontSize: 10, color: C.textSecondary },

  dropdown: {
    backgroundColor: C.surfaceEl,
    marginHorizontal: 14,
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    // @ts-ignore
    boxShadow: shadow.card,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  dropdownItemActive: { backgroundColor: C.accentBg },
  dropdownLabel: { fontSize: 14, color: C.textPrimary },
  dropdownLabelActive: { color: C.accent, fontWeight: '700' },
  dropdownCheck: { fontSize: 14, color: C.accent, fontWeight: '700' },

  divider: { height: 1, backgroundColor: C.borderSoft, marginLeft: 62 },

  note: {
    margin: 16,
    padding: 14,
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    borderLeftColor: C.accentSoft,
  },
  noteText: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },

  bottomPad: { height: 80 },
})
