import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import type { Person } from '../lib/types'
import { C } from '../lib/theme'

interface Props {
  person: Person
  navigateTo: (personId: string) => void
  seen?: boolean
}

export default function StoryCircle({ person, navigateTo, seen = false }: Props) {
  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={() => navigateTo(person.id)}
      activeOpacity={0.8}
    >
      <View style={[styles.ring, seen ? styles.ringSeen : undefined]}>
        <View style={styles.ringInner}>
          {person.profilePicUrl ? (
            <Image source={{ uri: person.profilePicUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.initial}>{person.firstName?.[0] ?? '?'}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.name} numberOfLines={1}>{person.firstName}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: 72,
    // @ts-ignore
    cursor: 'pointer',
  },
  ring: {
    width: 68,
    height: 68,
    borderRadius: 16,
    padding: 2,
    marginBottom: 5,
    // @ts-ignore
    background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentSoft} 100%)`,
  },
  ringSeen: {
    // @ts-ignore
    background: undefined,
    backgroundColor: C.border,
  },
  ringInner: {
    flex: 1,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: C.surface,
    overflow: 'hidden',
    backgroundColor: C.accentBg,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accentBg,
  },
  initial: {
    fontSize: 22,
    fontWeight: '700',
    color: C.accent,
  },
  name: {
    fontSize: 11,
    color: C.textPrimary,
    textAlign: 'center',
    maxWidth: 68,
    fontWeight: '600',
  },
})
