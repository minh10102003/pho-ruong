import { Audio as ExpoAudio, AVPlaybackStatus } from 'expo-av';
import { Platform } from 'react-native';
import { COUNTER_TABLE_NUMBER } from '../constants/tables';

type SoundModule = number | string;

const SOUNDS = {
  cash: require('../../assets/sounds/cash.wav') as SoundModule,
  transfer: require('../../assets/sounds/card.wav') as SoundModule,
} as const;

const UNLOCK_SOUND = require('../../assets/sounds/start.wav') as SoundModule;

const ORDER_ANNOUNCE = {
  banSo: require('../../assets/sounds/dat_mon_ban_so.mp3') as SoundModule,
  datMon: require('../../assets/sounds/dat_mon_dat_mon.mp3') as SoundModule,
  tables: {
    1: require('../../assets/sounds/table-1.mp3') as SoundModule,
    2: require('../../assets/sounds/table-2.mp3') as SoundModule,
    3: require('../../assets/sounds/table-3.mp3') as SoundModule,
    4: require('../../assets/sounds/table-4.mp3') as SoundModule,
    5: require('../../assets/sounds/table-5.mp3') as SoundModule,
    6: require('../../assets/sounds/table-6.mp3') as SoundModule,
    7: require('../../assets/sounds/table-7.mp3') as SoundModule,
    8: require('../../assets/sounds/table-8.mp3') as SoundModule,
    9: require('../../assets/sounds/table-9.mp3') as SoundModule,
    10: require('../../assets/sounds/table-10.mp3') as SoundModule,
    11: require('../../assets/sounds/table-11.mp3') as SoundModule,
  } as Record<number, SoundModule>,
};

type PaymentSoundKey = keyof typeof SOUNDS;
export type SoundPhase = 'gesture' | 'success';

const ANNOUNCEMENT_PLAYBACK_RATE = 1.5;

const webAudioTemplates = new Map<string, HTMLAudioElement>();
let webAudioUnlocked = false;
let nativeSequenceSound: ExpoAudio.Sound | null = null;
let orderAnnouncementQueue: Promise<void> = Promise.resolve();

function clipKey(source: SoundModule): string {
  return String(source);
}

function resolveSoundUri(source: SoundModule): string {
  if (typeof source === 'string') {
    return source;
  }

  if (Platform.OS === 'web') {
    try {
      const { Asset } = require('expo-asset') as typeof import('expo-asset');
      return Asset.fromModule(source as number).uri;
    } catch {
      return '';
    }
  }

  const { Image } = require('react-native') as typeof import('react-native');
  if (typeof Image.resolveAssetSource !== 'function') {
    return '';
  }

  const resolved = Image.resolveAssetSource(source);
  return resolved?.uri ?? '';
}

function getOrderAnnouncementClips(table: number): SoundModule[] {
  const clips: SoundModule[] = [ORDER_ANNOUNCE.banSo];

  if (table >= 1 && table <= 11) {
    clips.push(ORDER_ANNOUNCE.tables[table]);
  }

  clips.push(ORDER_ANNOUNCE.datMon);
  return clips;
}

function preloadWebClip(source: SoundModule) {
  const key = clipKey(source);
  if (webAudioTemplates.has(key)) return;

  try {
    const uri = resolveSoundUri(source);
    if (!uri) return;

    const audio = new globalThis.Audio(uri);
    audio.preload = 'auto';
    audio.load();
    webAudioTemplates.set(key, audio);
  } catch {
    // ignore
  }
}

function preloadOrderAnnouncementSounds() {
  preloadWebClip(ORDER_ANNOUNCE.banSo);
  preloadWebClip(ORDER_ANNOUNCE.datMon);
  Object.values(ORDER_ANNOUNCE.tables).forEach(preloadWebClip);
}

function preloadPaymentSounds() {
  (Object.keys(SOUNDS) as PaymentSoundKey[]).forEach((key) => preloadWebClip(SOUNDS[key]));
}

function unlockWebAudio() {
  if (webAudioUnlocked || Platform.OS !== 'web') return;
  webAudioUnlocked = true;

  try {
    preloadWebClip(UNLOCK_SOUND);
    preloadOrderAnnouncementSounds();
    preloadPaymentSounds();

    // Mở khóa Safari — start.wav, không dùng "Bàn số"
    const template = webAudioTemplates.get(clipKey(UNLOCK_SOUND));
    if (!template) return;

    const unlockClip = template.cloneNode(true) as HTMLAudioElement;
    unlockClip.volume = 0.01;
    unlockClip.playbackRate = 1;
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

function playWebClip(source: SoundModule, playbackRate = 1): Promise<void> {
  return new Promise((resolve) => {
    try {
      preloadWebClip(source);

      const template = webAudioTemplates.get(clipKey(source));
      if (!template) {
        resolve();
        return;
      }

      const audio = template.cloneNode(true) as HTMLAudioElement;
      audio.currentTime = 0;
      audio.playbackRate = playbackRate;

      const finish = () => {
        audio.removeEventListener('ended', finish);
        audio.removeEventListener('error', finish);
        resolve();
      };

      audio.addEventListener('ended', finish);
      audio.addEventListener('error', finish);
      void audio.play().catch(finish);
    } catch {
      resolve();
    }
  });
}

async function playWebSequence(clips: SoundModule[]) {
  for (const clip of clips) {
    await playWebClip(clip, ANNOUNCEMENT_PLAYBACK_RATE);
  }
}

async function unloadNativeSequenceSound() {
  if (!nativeSequenceSound) return;
  try {
    await nativeSequenceSound.unloadAsync();
  } catch {
    // ignore
  }
  nativeSequenceSound = null;
}

async function playNativeClip(source: SoundModule, playbackRate = 1): Promise<void> {
  await unloadNativeSequenceSound();

  await ExpoAudio.setAudioModeAsync({
    playsInSilentModeIOS: true,
  });

  return new Promise((resolve) => {
    void ExpoAudio.Sound.createAsync(source as number)
      .then(async ({ sound }) => {
        nativeSequenceSound = sound;
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            void unloadNativeSequenceSound().finally(resolve);
          }
        });
        if (playbackRate !== 1) {
          await sound.setRateAsync(playbackRate, true);
        }
        await sound.playAsync();
      })
      .catch(() => resolve());
  });
}

async function playNativeSequence(clips: SoundModule[]) {
  for (const clip of clips) {
    await playNativeClip(clip, ANNOUNCEMENT_PLAYBACK_RATE);
  }
}

function enqueueOrderAnnouncement(task: () => Promise<void>) {
  orderAnnouncementQueue = orderAnnouncementQueue.then(task).catch(() => undefined);
}

function runOrderAnnouncement(table: number, phase: SoundPhase) {
  if (phase === 'gesture') {
    preloadOrderAnnouncementSounds();
    return;
  }

  const clips = getOrderAnnouncementClips(table);
  enqueueOrderAnnouncement(async () => {
    if (Platform.OS === 'web') {
      await playWebSequence(clips);
      return;
    }
    await playNativeSequence(clips);
  });
}

/** Phát: "Bàn số" → [số bàn] → "đặt món" */
export function playOrderAnnouncement(table: number, phase: SoundPhase = 'success') {
  if (table === COUNTER_TABLE_NUMBER) {
    if (phase === 'gesture') {
      preloadOrderAnnouncementSounds();
      return;
    }

    enqueueOrderAnnouncement(async () => {
      const clips = [ORDER_ANNOUNCE.banSo, ORDER_ANNOUNCE.datMon];
      if (Platform.OS === 'web') {
        await playWebSequence(clips);
        return;
      }
      await playNativeSequence(clips);
    });
    return;
  }

  runOrderAnnouncement(table, phase);
}

/** @deprecated Dùng playOrderAnnouncement(table) */
export function playOrderSuccessSound(phase: SoundPhase = 'success') {
  playOrderAnnouncement(1, phase);
}

function playPaymentSound(key: PaymentSoundKey, phase: SoundPhase = 'success') {
  const source = SOUNDS[key];

  if (Platform.OS === 'web') {
    void playWebClip(source);
    return;
  }

  if (phase === 'success') {
    void playNativeClip(source);
  }
}

/** Phát tiếng báo khi thanh toán tiền mặt thành công */
export function playCashPaymentSound(phase: SoundPhase = 'success') {
  playPaymentSound('cash', phase);
}

/** Phát tiếng báo khi thanh toán chuyển khoản thành công */
export function playTransferPaymentSound(phase: SoundPhase = 'success') {
  playPaymentSound('transfer', phase);
}
