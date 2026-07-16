import { useEffect, useRef, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { api, authApi, familyApi, personApi, eventApi } from './src/lib/api'
import { tokenStore, logout } from './src/lib/auth'
import type { AuthUser } from './src/lib/auth'
import type { Tree, Person, FamilyEvent, Relative } from './src/lib/types'
import { C, initTheme, injectGlobalStyles } from './src/lib/theme'

import TopBar                from './src/components/TopBar'
import BottomTabs            from './src/components/BottomTabs'
import FeedScreen            from './src/screens/FeedScreen'
import MembersScreen         from './src/screens/MembersScreen'
import EventsScreen          from './src/screens/EventsScreen'
import PersonScreen          from './src/screens/PersonScreen'
import ProfileScreen         from './src/screens/ProfileScreen'
import SettingsScreen        from './src/screens/SettingsScreen'
import NotificationsScreen   from './src/screens/NotificationsScreen'
import LoginScreen           from './src/screens/LoginScreen'
import SignupScreen          from './src/screens/SignupScreen'
import CreateEventScreen     from './src/screens/CreateEventScreen'
import OnboardingScreen      from './src/screens/OnboardingScreen'
import AddPersonScreen       from './src/screens/AddPersonScreen'

export type Screen =
  | { name: 'feed' }
  | { name: 'members' }
  | { name: 'events' }
  | { name: 'person'; personId: string; from?: 'feed' | 'members' | 'events' }
  | { name: 'createEvent' }
  | { name: 'editEvent'; eventId: string }
  | { name: 'addPerson' }
  | { name: 'profile' }
  | { name: 'settings' }
  | { name: 'notifications' }

const TAB_ORDER = ['feed', 'members', 'events'] as const

export type AuthScreen = 'login' | 'signup'

export default function App() {
  const [authUser,     setAuthUser]    = useState<AuthUser | null>(null)
  const [authScreen,   setAuthScreen]  = useState<AuthScreen>('login')
  const [screen,       setScreen]      = useState<Screen>({ name: 'feed' })
  const [prevScreen,   setPrevScreen]  = useState<Screen>({ name: 'feed' })
  const [tree,         setTree]        = useState<Tree | null>(null)
  const [persons,      setPersons]     = useState<Person[]>([])
  const [events,       setEvents]      = useState<FamilyEvent[]>([])
  const [loading,      setLoading]     = useState(true)
  const [error,        setError]       = useState<string | null>(null)
  const [noFamily,     setNoFamily]    = useState(false)
  const [refreshing,   setRefreshing]  = useState(false)
  const [myRelatives,  setMyRelatives] = useState<Relative[]>([])
  const [bellCount,    setBellCount]   = useState(2) // 2 unread demo notifications

  // Touch tracking for swipe-between-tabs gesture
  const swipeStartX = useRef(0)
  const swipeStartY = useRef(0)

  useEffect(() => {
    initTheme()
    injectGlobalStyles()
    if (!tokenStore.isLoggedIn()) {
      setLoading(false)
    } else {
      loadData()
    }
  }, [])

  async function loadData(isRefresh = false) {
    if (!tokenStore.isLoggedIn()) return
    if (isRefresh) { setRefreshing(true) } else { setLoading(true) }
    setError(null)
    setNoFamily(false)
    try {
      // Hydrate authUser on every cold load (e.g. page reload where tokens are in localStorage
      // but authUser state is null because it was never persisted across sessions).
      const [me, families] = await Promise.all([
        authUser ? Promise.resolve(authUser) : authApi.me(),
        familyApi.list(),
      ])
      if (!authUser) setAuthUser(me)

      if (families.length === 0) {
        setNoFamily(true)
        return
      }
      const treeId = families[0].id
      const [personsData, eventsPage] = await Promise.all([
        personApi.list(treeId),
        eventApi.list(treeId, { limit: 50 }),
      ])
      setTree(families[0] as Tree)
      setPersons(personsData)
      setEvents(eventsPage.items)
    } catch (err) {
      if ((err as any)?.status === 401) {
        handleLogout()
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to load family data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function handleLogin(user: AuthUser) {
    setAuthUser(user)
    loadData()
  }

  function handleLogout() {
    logout()
    setAuthUser(null)
    setTree(null)
    setPersons([])
    setEvents([])
    setMyRelatives([])
    setNoFamily(false)
    setError(null)
    setScreen({ name: 'feed' })
    setLoading(false)
  }

  // Fetch MY relatives once when the linked person is known — passed to PersonScreen + MembersScreen
  const myPersonId = authUser ? persons.find(p => p.linkedUserId === authUser.id)?.id : undefined
  useEffect(() => {
    if (!myPersonId || !tree) return
    personApi.relatives(tree.id, myPersonId)
      .then(setMyRelatives)
      .catch(() => setMyRelatives([]))
  }, [myPersonId, tree?.id])

  function handleEventCreated(event: FamilyEvent) {
    setEvents(prev => {
      const next = [event, ...prev]
      next.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      return next
    })
    setScreen({ name: 'feed' })
  }

  function handleEventDeleted(eventId: string) {
    setEvents(prev => prev.filter(e => e.id !== eventId))
  }

  function handleEventEdit(event: FamilyEvent) {
    navigateTo({ name: 'editEvent', eventId: event.id })
  }

  const navigateTo = (s: Screen) => {
    setPrevScreen(screen)
    setScreen(s)
  }

  // ── Auth screens ─────────────────────────────────────────────────────────
  if (!tokenStore.isLoggedIn() && !authUser) {
    return (
      <View style={styles.authRoot}>
        <StatusBar style="dark" />
        {authScreen === 'login'
          ? <LoginScreen
              onLogin={handleLogin}
              onSignup={() => setAuthScreen('signup')}
            />
          : <SignupScreen
              onSignup={handleLogin}
              onLogin={() => setAuthScreen('login')}
            />
        }
      </View>
    )
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={styles.loadingText}>Loading your family…</Text>
      </View>
    )
  }

  // ── No family yet → Onboarding ───────────────────────────────────────────
  if (noFamily) {
    return (
      <View style={styles.authRoot}>
        <StatusBar style="dark" />
        <OnboardingScreen onDone={loadData} onLogout={handleLogout} />
      </View>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !tree) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.errorText}>{error ?? 'No family tree found'}</Text>
        <Text style={styles.errorSub}>Make sure the API is running on localhost:3000</Text>
      </View>
    )
  }

  // ── Create Event overlay (full-screen, no nav) ───────────────────────────
  if (screen.name === 'createEvent') {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <CreateEventScreen
          treeId={tree.id}
          persons={persons}
          onSave={handleEventCreated}
          onCancel={() => setScreen(prevScreen.name !== 'createEvent' ? prevScreen : { name: 'feed' })}
        />
      </View>
    )
  }

  // ── Edit Event overlay ────────────────────────────────────────────────────
  if (screen.name === 'editEvent') {
    const eventToEdit = events.find(e => e.id === (screen as any).eventId)
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <CreateEventScreen
          treeId={tree.id}
          persons={persons}
          initialEvent={eventToEdit}
          onSave={(updated) => {
            setEvents(prev => prev.map(e => e.id === updated.id ? updated : e))
            setScreen(prevScreen.name !== 'editEvent' ? prevScreen : { name: 'feed' })
          }}
          onCancel={() => setScreen(prevScreen.name !== 'editEvent' ? prevScreen : { name: 'feed' })}
        />
      </View>
    )
  }

  // ── Add Person overlay (full-screen, no nav) ──────────────────────────────
  if (screen.name === 'addPerson') {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <AddPersonScreen
          treeId={tree.id}
          persons={persons}
          onSave={(person) => {
            setPersons(prev => [...prev, person])
            setScreen({ name: 'members' })
          }}
          onCancel={() => setScreen({ name: 'members' })}
        />
      </View>
    )
  }

  // ── Back handler per screen ──────────────────────────────────────────────
  function handleBack() {
    if (screen.name === 'person') {
      navigateTo({ name: (screen as any).from ?? 'members' })
    } else if (screen.name === 'settings') {
      navigateTo({ name: 'profile' })
    } else if (screen.name === 'profile') {
      navigateTo(prevScreen.name !== 'profile' ? prevScreen : { name: 'feed' })
    } else if (screen.name === 'notifications') {
      navigateTo(prevScreen.name !== 'notifications' ? prevScreen : { name: 'feed' })
    } else {
      navigateTo({ name: 'feed' })
    }
  }

  function handleBell() {
    setBellCount(0)
    navigateTo({ name: 'notifications' })
  }

  // ── Swipe between tabs ───────────────────────────────────────────────────
  function handleSwipeEnd(endX: number, endY: number) {
    const dx = endX - swipeStartX.current
    const dy = endY - swipeStartY.current
    // Require strong horizontal dominance to avoid triggering during horizontal ScrollView drags
    if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 2.5) return
    const idx = TAB_ORDER.indexOf(screen.name as typeof TAB_ORDER[number])
    if (idx === -1) return
    if (dx > 0 && idx > 0) navigateTo({ name: TAB_ORDER[idx - 1] })
    if (dx < 0 && idx < TAB_ORDER.length - 1) navigateTo({ name: TAB_ORDER[idx + 1] })
  }

  // ── Derived screen title for TopBar ─────────────────────────────────────
  const topBarTitle = screen.name === 'person'
    ? (persons.find(p => p.id === (screen as any).personId)?.firstName ?? '')
    : undefined

  // ── Main app ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top navigation bar */}
      <TopBar
        treeName={tree.name}
        screen={screen}
        authUser={authUser}
        persons={persons}
        navigateTo={navigateTo}
        onBack={handleBack}
        onBell={handleBell}
        bellCount={bellCount}
        title={topBarTitle}
      />

      {/* Screen content — swipe between tabs */}
      <View
        style={styles.content}
        // @ts-ignore — RNW touch events for swipe navigation
        onTouchStart={(e: any) => {
          swipeStartX.current = e.touches[0].clientX
          swipeStartY.current = e.touches[0].clientY
        }}
        onTouchEnd={(e: any) => handleSwipeEnd(
          e.changedTouches[0].clientX,
          e.changedTouches[0].clientY,
        )}
      >
        {screen.name === 'feed' && (
          <FeedScreen
            tree={tree}
            persons={persons}
            events={events}
            myRelatives={myRelatives}
            myPersonId={myPersonId}
            navigateTo={(s) => {
              if (s.name === 'person') navigateTo({ ...s, from: 'feed' })
              else navigateTo(s)
            }}
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            onEditEvent={handleEventEdit}
            onDeleteEvent={handleEventDeleted}
          />
        )}
        {screen.name === 'members' && (
          <MembersScreen
            persons={persons}
            treeId={tree.id}
            events={events}
            navigateTo={(s) => {
              if (s.name === 'person') navigateTo({ ...s, from: 'members' })
              else navigateTo(s)
            }}
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            myPersonId={myPersonId}
            myRelatives={myRelatives}
          />
        )}
        {screen.name === 'events' && (
          <EventsScreen
            events={events}
            treeId={tree.id}
            navigateTo={(s) => {
              if (s.name === 'person') navigateTo({ ...s, from: 'events' })
              else navigateTo(s)
            }}
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
          />
        )}
        {screen.name === 'person' && (
          <PersonScreen
            personId={(screen as any).personId}
            from={(screen as any).from}
            treeId={tree.id}
            persons={persons}
            events={events}
            navigateTo={navigateTo}
            myPersonId={myPersonId}
            myRelatives={myRelatives}
          />
        )}
        {screen.name === 'profile' && authUser && (
          <ProfileScreen
            authUser={authUser}
            persons={persons}
            events={events}
            treeId={tree.id}
            navigateTo={navigateTo}
            onLogout={handleLogout}
            onPersonUpdate={(updated) =>
              setPersons(prev => prev.map(p => p.id === updated.id ? updated : p))
            }
          />
        )}
        {screen.name === 'settings' && (
          <SettingsScreen navigateTo={navigateTo} />
        )}
        {screen.name === 'notifications' && (
          <NotificationsScreen navigateTo={navigateTo} />
        )}
      </View>

      {/* Bottom tab bar + FAB */}
      <BottomTabs
        screen={screen}
        navigateTo={navigateTo}
        onCreateEvent={() => navigateTo({ name: 'createEvent' })}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  authRoot: {
    flex: 1,
    backgroundColor: C.bg,
    // @ts-ignore
    height: '100%',
  },
  root: {
    flex: 1,
    backgroundColor: C.bg,
    // @ts-ignore
    maxWidth: 540,
    alignSelf: 'center',
    width: '100%',
    height: '100%',
    // @ts-ignore
    boxShadow: '0 0 40px rgba(58,36,18,0.10)',
  },
  content: {
    flex: 1,
    // overflow handled by inner ScrollViews
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    gap: 10,
  },
  loadingText: { fontSize: 14, color: C.textSecondary },
  errorText:   { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  errorSub:    { fontSize: 13, color: C.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
})
