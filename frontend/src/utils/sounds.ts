import { Audio as ExpoAudio, AVPlaybackStatus } from 'expo-av';
import { Platform } from 'react-native';

type SoundModule = number | string;

const SOUNDS = {
  order: require('../../assets/sounds/order.wav') as SoundModule,
  cash: require('../../assets/sounds/cash.wav') as SoundModule,
  transfer: require('../../assets/sounds/card.wav') as SoundModule,
} as const;

type SoundKey = keyof typeof SOUNDS;

export type SoundPhase = 'gesture' | 'success';

const activeSounds = new Map<SoundKey, ExpoAudio.Sound>();
const webAudioTemplates = new Map<SoundKey, HTMLAudioElement>();
let webAudioUnlocked = false;

function resolveSoundUri(source: SoundModule): string {
  if (typeof source === 'string') {
    return source;
  }

  if (Platform.OS === 'web') {
    return '';
  }

  const { Image } = require('react-native') as typeof import('react-native');
  if (typeof Image.resolveAssetSource !== 'function') {
    return '';
  }

  const resolved = Image.resolveAssetSource(source);
  return resolved?.uri ?? '';
}

function preloadWebSound(key: SoundKey) {
  if (webAudioTemplates.has(key)) return;

  try {
    const uri = resolveSoundUri(SOUNDS[key]);
    if (!uri) return;

    const audio = new globalThis.Audio(uri);
    audio.preload = 'auto';
    audio.load();
    webAudioTemplates.set(key, audio);
  } catch {
    // ignore — âm thanh không bắt buộc
  }
}

function preloadWebSounds() {
  (Object.keys(SOUNDS) as SoundKey[]).forEach(preloadWebSound);
}

function unlockWebAudio() {
  if (webAudioUnlocked || Platform.OS !== 'web') return;
  webAudioUnlocked = true;

  try {
    preloadWebSounds();

    const template = webAudioTemplates.get('order');
    if (!template) return;

    const unlockClip = template.cloneNode(true) as HTMLAudioElement;
    unlockClip.volume = 0.01;
    void unlockClip.play().finally(() => {
      unlockClip.pause();
      unlockClip.currentTime = 0;
    });
  } catch {
    // ignore
  }
}

/** Gắn listener một lần để Safari cho phép phát âm sau tương tác đầu tiên */
export function installAudioUnlock() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const onFirstInteraction = () => {
    unlockWebAudio();
    document.removeEventListener('pointerdown', onFirstInteraction);
    document.removeEventListener('touchstart', onFirstInteraction);
  };

  document.addEventListener('pointerdown', onFirstInteraction, { passive: true });
  document.addEventListener('touchstart', onFirstInteraction, { passive: true });
}

function playWebSoundSync(key: SoundKey) {
  try {
    preloadWebSound(key);

    const template = webAudioTemplates.get(key);
    if (!template) return;

    const audio = template.cloneNode(true) as HTMLAudioElement;
    audio.currentTime = 0;
    void audio.play();
  } catch {
    try {
      const template = webAudioTemplates.get(key);
      if (!template) return;
      template.currentTime = 0;
      void template.play();
    } catch {
      // ignore
    }
  }
}

async function unloadNativeSound(key: SoundKey) {
  const sound = activeSounds.get(key);
  if (!sound) return;
  try {
    await sound.unloadAsync();
  } catch {
    // ignore
  }
  activeSounds.delete(key);
}

async function playNativeSound(key: SoundKey) {
  try {
    await ExpoAudio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    });

    await unloadNativeSound(key);

    const { sound } = await ExpoAudio.Sound.createAsync(SOUNDS[key] as number);
    activeSounds.set(key, sound);

    sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (status.isLoaded && status.didJustFinish) {
        void unloadNativeSound(key);
      }
    });

    await sound.playAsync();
  } catch {
    await unloadNativeSound(key);
  }
}

function playSound(key: SoundKey, phase: SoundPhase = 'success') {
  if (Platform.OS === 'web') {
    if (phase === 'gesture') {
      playWebSoundSync(key);
    }
    return;
  }

  if (phase === 'success') {
    void playNativeSound(key);
  }
}

/** Phát tiếng báo khi đặt món thành công */
export function playOrderSuccessSound(phase: SoundPhase = 'success') {
  playSound('order', phase);
}

/** Phát tiếng báo khi thanh toán tiền mặt thành công */
export function playCashPaymentSound(phase: SoundPhase = 'success') {
  playSound('cash', phase);
}

/** Phát tiếng báo khi thanh toán chuyển khoản thành công */
export function playTransferPaymentSound(phase: SoundPhase = 'success') {
  playSound('transfer', phase);
}
