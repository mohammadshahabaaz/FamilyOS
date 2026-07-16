import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Screen } from '../../App'
import type { AuthUser } from '../lib/auth'
import type { Person } from '../lib/types'

interface Props {
  screen:        Screen
  navigateTo:    (s: Screen) => void
  onCreateEvent: () => void
  authUser:      AuthUser | null
  persons:       Person[]
}

export default function BottomNav({ screen, navigateTo, onCreateEvent, authUser, persons }: Props) {
  const active = screen.name === 'person'
    ? (screen.from ?? 'members')
    : screen.name === 'createEvent' ? '' : screen.name

  function handleProfile() {
    if (!authUser) { navigateTo({ name: 'feed' }); return }
    const linked = persons.find(p => p.linkedUserId === authUser.id)
    if (linked) {
      navigateTo({ name: 'person', personId: linked.id })
    } else {
      navigateTo({ name: 'members' })
    }
  }

  const isProfileActive = screen.name === 'person' && persons.some(
    p => p.linkedUserId === authUser?.id && (screen as any).personId === p.id
  )

  return (
    <View style={styles.nav}>
      <Tab icon="◎" label="Feed"     isActive={active === 'feed'}    onPress={() => navigateTo({ name: 'feed' })} />
      <Tab icon="⊞" label="People"   isActive={active === 'members'} onPress={() => navigateTo({ name: 'members' })} />

      <TouchableOpacity style={styles.plusWrap} onPress={onCreateEvent} activeOpacity={0.85}>
        <View style={styles.plusBtn}>
          <Text style={styles.plusIcon}>+</Text>
        </View>
      </TouchableOpacity>

      <Tab icon="▦" label="Timeline" isActive={active === 'events'}  onPress={() => navigateTo({ name: 'events' })} />
      <Tab icon="◯" label="Profile"  isActive={isProfileActive}      onPress={handleProfile} />
    </View>
  )
}

function Tab({
  icon, label, isActive, onPress,
}: { icon: string; label: string; isActive: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.tab} onPress={onPress} activeOpacity={0.7}>
      {isActive && <View style={styles.activeBar} />}
      <Text style={[styles.icon, isActive && styles.iconActive]}>{icon}</Text>
      <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DBDBDB',
    height: 60,
    // @ts-ignore
    position: 'sticky',
    bottom: 0,
    zIndex: 100,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
    position: 'relative',
    // @ts-ignore
    cursor: 'pointer',
    // @ts-ignore
    transition: 'opacity 0.15s',
  },
  activeBar: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: '#262626',
    borderRadius: 1,
  },
  icon: { fontSize: 18, color: '#BDBDBD', lineHeight: 22 },
  iconActive: { color: '#262626' },
  label: { fontSize: 10, color: '#BDBDBD', marginTop: 2, fontWeight: '500', letterSpacing: 0.3 },
  labelActive: { color: '#262626', fontWeight: '700' },
  plusWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    cursor: 'pointer',
  },
  plusBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center', justifyContent: 'center',
    // @ts-ignore
    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
  },
  plusIcon: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30, marginTop: -1 },
})
