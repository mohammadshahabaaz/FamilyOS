import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { pushTokenApi } from './api'

// Fire-and-forget from the app's perspective: called once after auth hydration.
// Every failure mode (permission denied, unsupported platform, no push
// infrastructure configured) is swallowed here — registering a push token must
// never crash or block the rest of the app from loading.
export async function registerPushToken(): Promise<void> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync()
    let status = existing
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync()
      status = req.status
    }
    if (status !== 'granted') return

    const { data: token } = await Notifications.getExpoPushTokenAsync()
    if (!token) return

    const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web'
    await pushTokenApi.register(token, platform)
  } catch {
    // Web in particular has no push certificate / service worker configured in this
    // project, so getExpoPushTokenAsync() is expected to throw here — that's fine.
  }
}
