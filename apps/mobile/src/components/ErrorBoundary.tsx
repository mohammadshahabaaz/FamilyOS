import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { C, F } from '../lib/theme'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

// React error boundaries must be class components — there is no hook equivalent.
// Without this, any thrown render error white-screens the whole app, locking the
// family out of their memories with no recovery path (confirmed in docs/SMELLS.md).
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] caught render error', error, info.componentStack)
  }

  handleReload = () => {
    this.setState({ error: null })
    if (typeof window !== 'undefined') window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <View style={styles.root}>
        <Text style={styles.icon}>🌳</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.sub}>
          This screen hit an unexpected error. Your family's memories are safe — reload to try
          again.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={this.handleReload} activeOpacity={0.85}>
          <Text style={styles.btnText}>Reload</Text>
        </TouchableOpacity>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    paddingHorizontal: 32,
    gap: 10,
    // @ts-ignore
    height: '100%',
  },
  icon: { fontSize: 44, marginBottom: 6 },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: C.textPrimary,
    // @ts-ignore
    fontFamily: F.serif,
  },
  sub: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },
  btn: {
    marginTop: 12,
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  btnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
})
