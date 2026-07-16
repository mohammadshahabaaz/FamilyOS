import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native'
import { C } from '../lib/theme'

export interface ActionItem {
  label: string
  icon: string
  onPress: () => void
  destructive?: boolean
}

interface Props {
  visible: boolean
  title?: string
  actions: ActionItem[]
  onClose: () => void
}

export default function ActionSheet({ visible, title, actions, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        {title && (
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{title}</Text>
          </View>
        )}
        {actions.map((a, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.action, i < actions.length - 1 && styles.actionBorder]}
            onPress={() => { onClose(); setTimeout(a.onPress, 100) }}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>{a.icon}</Text>
            <Text style={[styles.actionLabel, a.destructive && styles.actionLabelDanger]}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: C.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 24,
    overflow: 'hidden',
    // @ts-ignore
    boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
  },
  titleWrap: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
    alignItems: 'center',
  },
  title: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  action: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 24, paddingVertical: 16,
    // @ts-ignore
    cursor: 'pointer',
  },
  actionBorder: { borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  actionIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  actionLabel: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
  actionLabelDanger: { color: C.danger },
  cancelBtn: {
    marginHorizontal: 16, marginTop: 8,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: C.surfaceEl,
    alignItems: 'center',
    // @ts-ignore
    cursor: 'pointer',
  },
  cancelText: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
})
