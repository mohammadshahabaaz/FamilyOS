import { useState, useEffect, useRef } from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native'
import { C, F, shadow, THEMES, applyTheme, getStoredTheme } from '../lib/theme'
import type { ThemeName, ThemeColors } from '../lib/theme'
import { personApi } from '../lib/api'
import type { AuthUser } from '../lib/auth'
import type { Person, FamilyEvent, Relative } from '../lib/types'
import type { Screen } from '../../App'
import ProfileStatsSheet from '../components/ProfileStatsSheet'
import type { StatsSheetType } from '../components/ProfileStatsSheet'

interface Props {
  authUser: AuthUser
  persons: Person[]
  events: FamilyEvent[]
  treeId: string
  navigateTo: (s: Screen) => void
  onLogout: () => void
  onPersonUpdate?: (updated: Person) => void
  profileRequestPending?: boolean
}

type ThemePreset = ThemeColors & { label: string; preview: [string, string] }

export default function ProfileScreen({
  authUser,
  persons,
  events,
  treeId,
  navigateTo,
  onLogout,
  onPersonUpdate,
  profileRequestPending = false,
}: Props) {
  const [relatives, setRelatives] = useState<Relative[]>([])
  const [loadingRel, setLoadingRel] = useState(false)
  const [activeTheme, setActiveTheme] = useState<ThemeName>(getStoredTheme)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [statsSheet, setStatsSheet] = useState<StatsSheetType | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const me = persons.find((p) => p.linkedUserId === authUser.id)
  const myEvents = me ? events.filter((e) => e.taggedPersons.some((p) => p.id === me.id)) : []
  const memoriesCount = myEvents.reduce((n, e) => n + e.media.length, 0)

  useEffect(() => {
    if (!me) return
    setLoadingRel(true)
    personApi
      .relatives(treeId, me.id)
      .then(setRelatives)
      .catch(() => setRelatives([]))
      .finally(() => setLoadingRel(false))
  }, [me?.id, treeId])

  const initials = me
    ? `${me.firstName?.[0] ?? ''}${me.lastName?.[0] ?? ''}`.toUpperCase()
    : authUser.username.slice(0, 2).toUpperCase()

  function handleThemeChange(name: ThemeName) {
    setActiveTheme(name)
    applyTheme(name)
  }

  function handleAvatarEdit() {
    if (typeof document === 'undefined' || !me) return
    if (!fileInputRef.current) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        setUploadingPhoto(true)
        const reader = new FileReader()
        reader.onload = async (ev) => {
          const dataUrl = ev.target?.result as string
          if (!dataUrl) {
            setUploadingPhoto(false)
            return
          }
          try {
            const updated = await personApi.update(treeId, me.id, { profilePicUrl: dataUrl })
            onPersonUpdate?.(updated)
          } catch {
            onPersonUpdate?.({ ...me, profilePicUrl: dataUrl })
          } finally {
            setUploadingPhoto(false)
          }
        }
        reader.readAsDataURL(file)
      }
      // @ts-ignore
      fileInputRef.current = input
    }
    // @ts-ignore
    fileInputRef.current.click()
  }

  const profilePic = me?.profilePicUrl ?? authUser.profilePicUrl
  const themePreset = THEMES[activeTheme]

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* ── Hero Banner + Inset Avatar ────────────────────────────────────── */}
      <View style={styles.heroWrapper}>
        <View
          style={[
            styles.heroBand,
            {
              // @ts-ignore
              background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentSoft} 100%)`,
            },
          ]}
        />
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            style={styles.avatarBubble}
            onPress={me ? handleAvatarEdit : undefined}
            activeOpacity={me ? 0.85 : 1}
            // @ts-ignore
            cursor={me ? 'pointer' : 'default'}
          >
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImg} />
            ) : (
              <View
                style={[
                  styles.avatarImg,
                  styles.avatarFallback,
                  {
                    // @ts-ignore
                    background: `linear-gradient(150deg, ${C.accent} 0%, ${C.accentSoft} 100%)`,
                  },
                ]}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator color="#FFFFFF" size="large" />
                ) : (
                  <Text style={styles.avatarInitials}>{initials}</Text>
                )}
              </View>
            )}
            {me && (
              <View style={styles.avatarEditBadge}>
                <Text style={styles.avatarEditIcon}>✎</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Identity Text ─────────────────────────────────────────────────── */}
      <View style={styles.identityBlock}>
        <Text style={styles.fullName}>
          {me ? `${me.firstName} ${me.lastName}` : authUser.username}
        </Text>
        <Text style={styles.usernameText}>@{authUser.username}</Text>
        {!me && profileRequestPending && (
          <Text style={styles.bioMeta}>Request submitted — pending admin review</Text>
        )}
        {!me && !profileRequestPending && (
          <>
            <Text style={styles.bioMeta}>Not linked to a family member yet</Text>
            <TouchableOpacity
              style={styles.requestBtn}
              onPress={() => navigateTo({ name: 'requestProfile' })}
              activeOpacity={0.85}
            >
              <Text style={styles.requestBtnText}>Request to Join the Tree</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <TouchableOpacity
          style={styles.statTouchable}
          onPress={() => setStatsSheet('events')}
          activeOpacity={0.7}
        >
          <StatBlock value={myEvents.length} label="Events" />
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity
          style={styles.statTouchable}
          onPress={() => setStatsSheet('relatives')}
          activeOpacity={0.7}
        >
          <StatBlock value={loadingRel ? '…' : relatives.length} label="Relatives" />
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity
          style={styles.statTouchable}
          onPress={() => setStatsSheet('memories')}
          activeOpacity={0.7}
        >
          <StatBlock value={memoriesCount} label="Memories" />
        </TouchableOpacity>
      </View>

      <ProfileStatsSheet
        type={statsSheet}
        events={myEvents}
        relatives={relatives}
        treeId={treeId}
        myPersonId={me?.id}
        navigateTo={navigateTo}
        onClose={() => setStatsSheet(null)}
      />

      {/* ── Relatives Strip ───────────────────────────────────────────────── */}
      {me && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Family</Text>
          {loadingRel ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={C.accent} />
            </View>
          ) : relatives.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relStrip}
            >
              {relatives.slice(0, 8).map((r) => (
                <TouchableOpacity
                  key={r.person.id}
                  style={styles.relChip}
                  onPress={() =>
                    navigateTo({ name: 'person', personId: r.person.id, from: 'members' })
                  }
                  activeOpacity={0.8}
                  // @ts-ignore
                  cursor="pointer"
                >
                  <View style={styles.relChipAvatar}>
                    {r.person.profilePicUrl ? (
                      <Image source={{ uri: r.person.profilePicUrl }} style={styles.relChipImg} />
                    ) : (
                      <Text style={styles.relChipInitial}>{r.person.firstName?.[0] ?? '?'}</Text>
                    )}
                  </View>
                  <Text style={styles.relChipName} numberOfLines={1}>
                    {r.person.firstName}
                  </Text>
                  <Text style={styles.relChipRel} numberOfLines={1}>
                    {r.relationship.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
              {relatives.length > 8 && (
                <TouchableOpacity
                  style={styles.relChip}
                  onPress={() => navigateTo({ name: 'members' })}
                  activeOpacity={0.8}
                  // @ts-ignore
                  cursor="pointer"
                >
                  <View style={[styles.relChipAvatar, styles.relChipMoreAvatar]}>
                    <Text style={styles.relChipMoreText}>+{relatives.length - 8}</Text>
                  </View>
                  <Text style={styles.relChipName}>More</Text>
                  <Text style={styles.relChipRel}>members</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          ) : (
            <TouchableOpacity
              style={styles.noRelCard}
              onPress={() => navigateTo({ name: 'members' })}
              activeOpacity={0.8}
            >
              <Text style={styles.noRelText}>No relatives linked yet. Add family members →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!me && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Position</Text>
          <View style={styles.settingsCard}>
            <View style={styles.navRow}>
              <View style={styles.navRowLeft}>
                <View style={[styles.navIcon, { backgroundColor: C.accentBg }]}>
                  <Text style={styles.navIconText}>🌳</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.navLabel}>Not in the family tree</Text>
                  <Text style={styles.navSub}>Ask an admin to link your account</Text>
                </View>
              </View>
            </View>
            <View style={styles.settingsDivider} />
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => navigateTo({ name: 'members' })}
              activeOpacity={0.7}
            >
              <View style={styles.navRowLeft}>
                <View style={[styles.navIcon, { backgroundColor: C.accentBg }]}>
                  <Text style={styles.navIconText}>👥</Text>
                </View>
                <Text style={styles.navLabel}>Go to Family Members</Text>
              </View>
              <Text style={styles.navChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Appearance ────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingsCard}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.themeRow}
          >
            {(Object.keys(THEMES) as ThemeName[]).map((name) => {
              const t = THEMES[name]
              const isActive = activeTheme === name
              return (
                <TouchableOpacity
                  key={name}
                  style={styles.themeOption}
                  onPress={() => handleThemeChange(name)}
                  activeOpacity={0.8}
                  // @ts-ignore
                  cursor="pointer"
                >
                  <View
                    style={[
                      styles.themePreview,
                      {
                        backgroundColor: t.preview[0],
                        borderWidth: isActive ? 2.5 : 1.5,
                        borderColor: isActive ? t.preview[1] : t.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.themePreviewDot,
                        {
                          // @ts-ignore
                          background: `linear-gradient(135deg, ${t.preview[1]}, ${t.accentSoft})`,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.themeLabel,
                      isActive && { color: t.preview[1], fontWeight: '800' },
                    ]}
                  >
                    {t.label}
                  </Text>
                  {isActive && (
                    <View style={[styles.themeActiveDot, { backgroundColor: t.preview[1] }]} />
                  )}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>
      </View>

      {/* ── Privacy ───────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>PREVIEW</Text>
          </View>
        </View>
        <Text style={styles.previewNote}>
          Not saved yet — enforcement is coming in a future update.
        </Text>
        <View style={styles.settingsCard}>
          <ToggleRow
            label="Show my profile to all members"
            sub="When off, only admins can see your full profile"
            defaultOn
            themePreset={themePreset}
          />
          <View style={styles.settingsDivider} />
          <ToggleRow
            label="Allow tagging in memories"
            sub="Family members can tag you in events and photos"
            defaultOn
            themePreset={themePreset}
          />
          <View style={styles.settingsDivider} />
          <ToggleRow
            label="Notify me when I'm tagged"
            sub="Receive a notification when added to a memory"
            defaultOn
            themePreset={themePreset}
          />
        </View>
      </View>

      {/* ── Security ──────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigateTo({ name: 'settings' })}
            activeOpacity={0.7}
          >
            <View style={styles.navRowLeft}>
              <View style={[styles.navIcon, { backgroundColor: '#C0392B12' }]}>
                <Text style={styles.navIconText}>🔐</Text>
              </View>
              <View>
                <Text style={styles.navLabel}>Advanced Security</Text>
                <Text style={styles.navSub}>Devices, invites, visibility controls</Text>
              </View>
            </View>
            <Text style={styles.navChevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.settingsDivider} />
          <TouchableOpacity style={styles.navRow} activeOpacity={0.7}>
            <View style={styles.navRowLeft}>
              <View style={[styles.navIcon, { backgroundColor: '#2980B912' }]}>
                <Text style={styles.navIconText}>📱</Text>
              </View>
              <View>
                <Text style={styles.navLabel}>Active Sessions</Text>
                <Text style={styles.navSub}>Manage devices where you're signed in</Text>
              </View>
            </View>
            <Text style={styles.navChevron}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Account ───────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingsCard}>
          <View style={styles.navRow}>
            <View style={styles.navRowLeft}>
              <View style={[styles.navIcon, { backgroundColor: C.accentBg }]}>
                <Text style={styles.navIconText}>◎</Text>
              </View>
              <View>
                <Text style={styles.navLabel}>Username</Text>
                <Text style={styles.navSub}>@{authUser.username}</Text>
              </View>
            </View>
          </View>
          <View style={styles.settingsDivider} />
          <TouchableOpacity style={styles.navRow} onPress={onLogout} activeOpacity={0.7}>
            <View style={styles.navRowLeft}>
              <View style={[styles.navIcon, { backgroundColor: '#C0392B12' }]}>
                <Text style={[styles.navIconText, { color: C.danger }]}>↩</Text>
              </View>
              <Text style={[styles.navLabel, { color: C.danger }]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Prominent Sign Out ────────────────────────────────────────────── */}
      <View style={[styles.section, { marginTop: 24 }]}>
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={onLogout}
          activeOpacity={0.85}
          // @ts-ignore
          cursor="pointer"
        >
          <Text style={styles.signOutText}>Sign out of FamilyOS</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPad} />
    </ScrollView>
  )
}

function StatBlock({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function ToggleRow({
  label,
  sub,
  defaultOn,
  themePreset,
}: {
  label: string
  sub: string
  defaultOn: boolean
  themePreset: ThemePreset
}) {
  const [on, setOn] = useState(defaultOn)
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLeft}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleSub}>{sub}</Text>
      </View>
      <Switch
        value={on}
        onValueChange={setOn}
        trackColor={{ false: themePreset.border, true: themePreset.accentSoft }}
        thumbColor={on ? themePreset.accent : '#FFFFFF'}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Hero ──
  heroWrapper: {
    height: 150,
    position: 'relative',
  },
  heroBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  avatarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  avatarBubble: {
    width: 96,
    height: 96,
    borderRadius: 22,
    borderWidth: 3.5,
    borderColor: C.surface,
    overflow: 'hidden',
    backgroundColor: C.accentBg,
    // @ts-ignore
    boxShadow: '0 4px 24px rgba(0,0,0,0.16)',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.surface,
  },
  avatarEditIcon: { fontSize: 11, color: '#FFFFFF', fontWeight: '700' },

  // ── Identity ──
  identityBlock: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  fullName: {
    fontSize: 22,
    fontWeight: '800',
    color: C.textPrimary,
    // @ts-ignore
    fontFamily: F.serif,
    textAlign: 'center',
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'center',
  },
  bioMeta: {
    fontSize: 12,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  requestBtn: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: C.accent,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  requestBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 16,
  },
  statBlock: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, backgroundColor: C.border, marginVertical: 6 },
  statTouchable: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: C.accent },
  statLabel: {
    fontSize: 10,
    color: C.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.8,
    // @ts-ignore
    textTransform: 'uppercase',
  },

  // ── Sections ──
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 10,
    // @ts-ignore
    textTransform: 'uppercase',
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  previewBadge: {
    backgroundColor: C.accentBg,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 10,
  },
  previewBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.accent,
    letterSpacing: 0.5,
  },
  previewNote: {
    fontSize: 12,
    color: C.textSecondary,
    fontStyle: 'italic',
    marginBottom: 10,
    marginTop: -6,
  },

  // ── Relatives strip ──
  loadingRow: { padding: 20, alignItems: 'center' },
  relStrip: { paddingVertical: 6, gap: 18 },
  relChip: { alignItems: 'center', width: 64 },
  relChipAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    borderWidth: 1.5,
    borderColor: C.accentSoft,
    overflow: 'hidden',
  },
  relChipImg: { width: '100%', height: '100%' },
  relChipInitial: { fontSize: 22, fontWeight: '700', color: C.accent },
  relChipName: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textPrimary,
    textAlign: 'center',
  },
  relChipRel: {
    fontSize: 10,
    color: C.accentSoft,
    textAlign: 'center',
    marginTop: 1,
  },
  relChipMoreAvatar: {
    backgroundColor: C.accentBg,
    borderColor: C.border,
  },
  relChipMoreText: { fontSize: 14, fontWeight: '700', color: C.accent },
  noRelCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  noRelText: { fontSize: 13, color: C.accentSoft, fontWeight: '500' },

  // ── Settings card ──
  settingsCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    // @ts-ignore
    boxShadow: shadow.card,
  },
  settingsDivider: { height: 1, backgroundColor: C.borderSoft, marginLeft: 52 },

  // ── Theme picker ──
  themeRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 10,
    alignItems: 'flex-start',
  },
  themeOption: {
    width: 66,
    alignItems: 'center',
    gap: 7,
    // @ts-ignore
    cursor: 'pointer',
  },
  themePreview: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themePreviewDot: { width: 22, height: 22, borderRadius: 11 },
  themeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textSecondary,
    textAlign: 'center',
    // @ts-ignore
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  themeActiveDot: { width: 6, height: 6, borderRadius: 3 },

  // ── Toggle rows ──
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  toggleLeft: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  toggleSub: { fontSize: 12, color: C.textSecondary, marginTop: 2 },

  // ── Nav rows ──
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    // @ts-ignore
    cursor: 'pointer',
  },
  navRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  navIconText: { fontSize: 18 },
  navLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  navSub: { fontSize: 12, color: C.textSecondary, marginTop: 1 },
  navChevron: { fontSize: 22, color: C.border },

  // ── Sign out ──
  signOutBtn: {
    backgroundColor: C.danger,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    // @ts-ignore
    boxShadow: '0 2px 10px rgba(192,57,43,0.25)',
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },

  bottomPad: { height: 100 },
})
