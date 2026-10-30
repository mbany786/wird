import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/** Haptic feedback; silently does nothing where unsupported. */
export const haptic = {
  tap: () => { Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); },
  medium: () => { Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}); },
  success: () => { Haptics.notification({ type: NotificationType.Success }).catch(() => {}); },
  warning: () => { Haptics.notification({ type: NotificationType.Warning }).catch(() => {}); }
};
