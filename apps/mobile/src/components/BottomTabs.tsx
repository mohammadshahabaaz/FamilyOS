import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { C, shadow } from '../lib/theme'
import type { Screen } from '../../App'

interface Props {
  screen: Screen
  navigateTo: (s: Screen) => void
  onCreateEvent: () => void
}

const TABS = [
  { name: 'feed' as const, label: 'Home' },
  { name: 'members' as const, label: 'Family' },
  { name: 'events' as const, label: 'Timeline' },
]

export default function BottomTabs({ screen, navigateTo, onCreateEvent }: Props) {
  const active =
    screen.name === 'person'
      ? ((screen as any).from ?? 'members')
      : screen.name === 'createEvent' ||
          screen.name === 'editEvent' ||
          screen.name === 'addPerson' ||
          screen.name === 'profile' ||
          screen.name === 'settings' ||
          screen.name === 'notifications'
        ? ''
        : screen.name

  return (
    <View style={styles.container}>
      {/* Tab strip */}
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const isActive = active === tab.name
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => navigateTo({ name: tab.name })}
              activeOpacity={0.7}
            >
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
              {isActive && <View style={styles.activeBar} />}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onCreateEvent}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Create a memory"
        // @ts-ignore — web-only hover-lift opt-in, see theme.ts
        className="fo-lift"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  tabs: {
    flexDirection: 'row',
    height: 52,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // @ts-ignore
    cursor: 'pointer',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSecondary,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: C.accent,
    fontWeight: '800',
  },
  activeBar: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: C.accent,
    borderRadius: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 60,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    boxShadow: shadow.fab,
    // @ts-ignore
    cursor: 'pointer',
    zIndex: 50,
  },
  fabIcon: { color: '#FFFFFF', fontSize: 28, fontWeight: '300', lineHeight: 32, marginTop: -1 },
})
