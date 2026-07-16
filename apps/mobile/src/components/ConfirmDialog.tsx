import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native'
import { C } from '../lib/theme'

interface Props {
  visible: boolean
  title: string
  body: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  visible, title, body,
  confirmLabel = 'Delete',
  cancelLabel  = 'Cancel',
  destructive  = true,
  onConfirm, onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, destructive && styles.confirmBtnDanger]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={[styles.confirmText, destructive && styles.confirmTextDanger]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 24,
    // @ts-ignore
    boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
    alignItems: 'center',
  },
  title: { fontSize: 17, fontWeight: '800', color: C.textPrimary, marginBottom: 10, textAlign: 'center' },
  body: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  buttons: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: C.surfaceEl, borderWidth: 1, borderColor: C.border,
    alignItems: 'center',
    // @ts-ignore
    cursor: 'pointer',
  },
  cancelText: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  confirmBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: C.accent, alignItems: 'center',
    // @ts-ignore
    cursor: 'pointer',
  },
  confirmBtnDanger: { backgroundColor: C.danger },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  confirmTextDanger: { color: '#FFFFFF' },
})
