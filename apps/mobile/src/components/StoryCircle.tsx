import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { C } from '../lib/theme'

interface Props {
  name: string
  avatarUrl?: string | null
  onPress: () => void
  seen?: boolean
  isAdd?: boolean // renders a dashed "+" tile for creating a new story
}

export default function StoryCircle({
  name,
  avatarUrl,
  onPress,
  seen = false,
  isAdd = false,
}: Props) {
  return (
    <TouchableOpacity style={styles.wrap} onPress={onPress} activeOpacity={0.8}>
      {isAdd ? (
        <View style={styles.addRing}>
          <Text style={styles.addIcon}>+</Text>
        </View>
      ) : (
        <View style={[styles.ring, seen ? styles.ringSeen : undefined]}>
          <View style={styles.ringInner}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.initial}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
            )}
          </View>
        </View>
      )}
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
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
  addRing: {
    width: 68,
    height: 68,
    borderRadius: 16,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: C.accent,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accentBg,
  },
  addIcon: {
    fontSize: 26,
    fontWeight: '300',
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
