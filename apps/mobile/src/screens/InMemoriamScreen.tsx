import { useEffect, useState } from 'react'
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import type { Person, FamilyEvent, Relative } from '../lib/types'
import { EVENT_GRADIENT, lifespan } from '../lib/types'
import { personApi } from '../lib/api'
import type { Screen } from '../../App'
import { C, F } from '../lib/theme'
import EventDetailModal from '../components/EventDetailModal'

interface Props {
  personId: string
  treeId: string
  persons: Person[]
  events: FamilyEvent[]
  navigateTo: (s: Screen) => void
  myRelatives?: Relative[]
  myPersonId?: string
}

// A deliberately quieter screen than PersonScreen — presence and memory, not
// engagement. No likes/reactions/tribute-gimmicks here; the Founder Rule pillar
// this serves is "relive a memory," not "come back and interact."
export default function InMemoriamScreen({
  personId,
  treeId,
  persons,
  events,
  navigateTo,
  myRelatives = [],
  myPersonId,
}: Props) {
  const [relatives, setRelatives] = useState<Relative[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<FamilyEvent | null>(null)

  const person = persons.find((p) => p.id === personId)
  const memories = events.filter((e) => e.taggedPersons.some((p) => p.id === personId))

  useEffect(() => {
    setLoading(true)
    personApi
      .relatives(treeId, personId)
      .then(setRelatives)
      .catch(() => setRelatives([]))
      .finally(() => setLoading(false))
  }, [personId, treeId])

  const myRelLabel = myRelatives.find((r) => r.person.id === personId)?.relationship ?? null
  const years = person ? lifespan(person.dateOfBirth, person.dateOfDeath) : null

  if (!person) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Person not found</Text>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>IN LOVING MEMORY</Text>

          <View style={styles.portraitRing}>
            <View style={styles.portraitInner}>
              {person.profilePicUrl ? (
                <Image
                  source={{ uri: person.profilePicUrl }}
                  style={[
                    styles.portrait,
                    // @ts-ignore — grayscale tribute treatment, matches Members grid
                    { filter: 'grayscale(1)' },
                  ]}
                />
              ) : (
                <View style={[styles.portrait, styles.portraitFallback]}>
                  <Text style={styles.portraitInitial}>
                    {person.firstName?.[0] ?? '?'}
                    {person.lastName?.[0] ?? ''}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.name}>
            {person.firstName} {person.lastName}
          </Text>
          {years && <Text style={styles.years}>{years}</Text>}
          {myRelLabel && <Text style={styles.relLabel}>Your {myRelLabel}</Text>}

          <TouchableOpacity
            style={styles.memoryBtn}
            activeOpacity={0.85}
            onPress={() => navigateTo({ name: 'createEvent' })}
          >
            <Text style={styles.memoryBtnText}>+ Share a Memory</Text>
          </TouchableOpacity>
        </View>

        {/* Relatives — who they belonged to */}
        {!loading && relatives.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Family</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relStrip}
            >
              {relatives.slice(0, 10).map((r) => (
                <TouchableOpacity
                  key={r.person.id}
                  style={styles.relChip}
                  onPress={() => navigateTo({ name: 'person', personId: r.person.id })}
                  activeOpacity={0.8}
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
                    {r.relationship}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Shared memories */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {memories.length > 0 ? 'Shared Memories' : 'No memories yet'}
          </Text>
          {memories.length === 0 ? (
            <Text style={styles.emptyText}>
              Tag {person.firstName} in a memory to keep it here.
            </Text>
          ) : (
            <View style={styles.grid}>
              {memories.map((event) => {
                const colors = EVENT_GRADIENT[event.type] ?? EVENT_GRADIENT.CUSTOM
                const hasMedia = event.media.length > 0
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.tile}
                    activeOpacity={0.85}
                    onPress={() => setSelectedEvent(event)}
                  >
                    {hasMedia ? (
                      <Image
                        source={{ uri: event.media[0].thumbnail }}
                        style={styles.tileImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.tileImg,
                          styles.tileBanner,
                          // @ts-ignore
                          { background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          treeId={treeId}
          visible={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          navigateTo={navigateTo}
          myRelatives={myRelatives}
          myPersonId={myPersonId}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 16, color: C.textSecondary },

  hero: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    color: C.inMemoriam,
    marginBottom: 18,
  },
  portraitRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: C.inMemoriam,
  },
  portraitInner: {
    flex: 1,
    borderRadius: 51,
    overflow: 'hidden',
    backgroundColor: C.surfaceEl,
  },
  portrait: { width: '100%', height: '100%' },
  portraitFallback: { alignItems: 'center', justifyContent: 'center' },
  portraitInitial: { fontSize: 32, fontWeight: '700', color: C.inMemoriam },

  name: {
    fontSize: 22,
    fontWeight: '800',
    color: C.textPrimary,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: F.serif,
  },
  years: {
    fontSize: 14,
    color: C.inMemoriam,
    marginTop: 4,
    fontWeight: '600',
    // @ts-ignore
    fontFamily: F.serif,
    fontStyle: 'italic',
  },
  relLabel: { fontSize: 13, color: C.textSecondary, marginTop: 6 },

  memoryBtn: {
    marginTop: 18,
    backgroundColor: C.inMemoriam,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  memoryBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  section: { paddingTop: 20, paddingHorizontal: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    // @ts-ignore
    textTransform: 'uppercase',
    color: C.textSecondary,
    marginBottom: 12,
  },
  emptyText: { fontSize: 13, color: C.textSecondary, fontStyle: 'italic' },

  relStrip: { gap: 14, paddingBottom: 4 },
  relChip: { alignItems: 'center', width: 68 },
  relChipAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: C.surfaceEl,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 6,
  },
  relChipImg: { width: '100%', height: '100%' },
  relChipInitial: { fontSize: 18, fontWeight: '700', color: C.accent },
  relChipName: { fontSize: 12, fontWeight: '700', color: C.textPrimary },
  relChipRel: { fontSize: 10, color: C.textSecondary },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tile: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: C.surfaceEl,
  },
  tileImg: { width: '100%', height: '100%' },
  tileBanner: {},

  bottomPad: { height: 80 },
})
