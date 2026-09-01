const STORAGE_KEY = 'collune_notification_preferences';

type NotificationPreferences = {
  muted: boolean;
  desktopEnabled: boolean;
};

let audioContext: AudioContext | null = null;
let lastPlayAt = 0;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) {
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

function readPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') {
    return { muted: false, desktopEnabled: false };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { muted: false, desktopEnabled: false };
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return {
      muted: Boolean(parsed.muted),
      desktopEnabled: Boolean(parsed.desktopEnabled),
    };
  } catch {
    return { muted: false, desktopEnabled: false };
  }
}

function savePreferences(next: NotificationPreferences) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getNotificationPreferences() {
  return readPreferences();
}

export function setMutedNotifications(muted: boolean) {
  const current = readPreferences();
  const next = { ...current, muted };
  savePreferences(next);
  return next;
}

export function setDesktopNotificationsEnabled(desktopEnabled: boolean) {
  const current = readPreferences();
  const next = { ...current, desktopEnabled };
  savePreferences(next);
  return next;
}

async function playTone(startFrequency: number, endFrequency: number, duration = 0.22, volume = 0.08) {
  const preferences = readPreferences();
  if (preferences.muted) return;

  const now = Date.now();
  if (now - lastPlayAt < 500) return;
  lastPlayAt = now;

  try {
    const context = getAudioContext();
    if (!context) return;

    if (context.state === 'suspended') {
      await context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(startFrequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, context.currentTime + duration * 0.85);

    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration + 0.02);
  } catch (error) {
    console.error('Unable to play notification sound', error);
  }
}

export function playIncomingMessageSound() {
  return playTone(740, 520, 0.22, 0.08);
}

export function playNotificationSound() {
  return playTone(620, 760, 0.18, 0.06);
}

export async function requestDesktopNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    setDesktopNotificationsEnabled(true);
  }
  return permission;
}

export function showDesktopNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  const preferences = readPreferences();
  if (!preferences.desktopEnabled || Notification.permission !== 'granted') return null;

  try {
    return new Notification(title, {
      badge: '/favicon.svg',
      icon: '/favicon.svg',
      ...options,
    });
  } catch (error) {
    console.error('Unable to show desktop notification', error);
    return null;
  }
}
