import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { C, F } from '../lib/theme'
import type { Screen } from '../../App'
import type { Person } from '../lib/types'
import type { AuthUser } from '../lib/auth'

interface Props {
  treeName: string
  screen: Screen
  authUser: AuthUser | null
  persons: Person[]
  navigateTo: (s: Screen) => void
  onBack?: () => void
  onBell?: () => void
  bellCount?: number
  title?: string
}

const SCREEN_TITLES: Partial<Record<Screen['name'], string>> = {
  feed:          'Home',
  members:       'Family',
  events:        'Timeline',
  person:        '',
  profile:       'My Profile',
  settings:      'Security',
  notifications: 'Notifications',
}

// Root tabs show avatar on left + bell on right; everything else shows back arrow
const ROOT_TABS = new Set<Screen['name']>(['feed', 'members', 'events'])

export default function TopBar({ treeName, screen, authUser, persons, navigateTo, onBack, onBell, bellCount = 0, title }: Props) {
  const isRootTab = ROOT_TABS.has(screen.name)
  const screenTitle = title ?? SCREEN_TITLES[screen.name] ?? ''

  const linked = authUser ? persons.find(p => p.linkedUserId === authUser.id) : null
  const initials = linked
    ? `${linked.firstName?.[0] ?? ''}${linked.lastName?.[0] ?? ''}`.toUpperCase()
    : authUser?.username?.slice(0, 2).toUpperCase() ?? 'ME'

  return (
    <View style={styles.bar}>

      {/* Left: avatar (root tabs) or back arrow (all other screens) */}
      {isRootTab ? (
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={() => navigateTo({ name: 'profile' })}
          activeOpacity={0.8}
          // @ts-ignore
          cursor="pointer"
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack ?? (() => navigateTo({ name: 'feed' }))}
          activeOpacity={0.7}
          // @ts-ignore
          cursor="pointer"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      )}

      {/* Center: tree name on home feed, screen title elsewhere */}
      <View style={styles.center}>
        {isRootTab && screen.name === 'feed' ? (
          <Text style={styles.treeName}>{treeName}</Text>
        ) : (
          <Text style={styles.screenTitle}>{screenTitle}</Text>
        )}
      </View>

      {/* Right: bell icon on root tabs, empty otherwise */}
      {isRootTab ? (
        <TouchableOpacity
          style={styles.bellWrap}
          onPress={onBell}
          activeOpacity={0.8}
          // @ts-ignore
          cursor="pointer"
        >
          <Text style={styles.bellIcon}>🔔</Text>
          {bellCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{bellCount > 9 ? '9+' : String(bellCount)}</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.right} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  avatarWrap: {
    width: 38, alignItems: 'flex-start',
  },
  avatar: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  backBtn: {
    width: 38, justifyContent: 'center',
  },
  backIcon: { fontSize: 22, color: C.textPrimary, lineHeight: 24 },
  center: { flex: 1, alignItems: 'center' },
  treeName: {
    fontSize: 18, fontWeight: '700', color: C.textPrimary,
    // @ts-ignore
    fontFamily: F.serif,
  },
  screenTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary, letterSpacing: 0.2 },
  bellWrap: {
    width: 38, height: 38, alignItems: 'flex-end', justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: { fontSize: 20 },
  badge: {
    position: 'absolute',
    top: 2, right: -2,
    backgroundColor: '#E05547',
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: C.surface,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  right: { width: 38 },
})
