export interface AvatarPreset {
  id: string;
  name: string;
  emoji: string;
  /** Path to VRM model — local assets are served reliably without CORS issues */
  url: string;
}

/**
 * Bundled VRM models (in src/assets/avatars/).
 * Sources:
 *  - AliciaSolid: github.com/vrm-c/UniVRM (VRM 0.x sample, MIT-like)
 *  - Seed-san:    github.com/vrm-c/vrm-specification (VRM 1.0 official sample)
 *  - VRM1 Robot: github.com/pixiv/three-vrm (constraint test model)
 *
 * To add more: download any .vrm from https://hub.vroid.com and click Upload below.
 */
export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'alicia',
    name: 'Alicia',
    emoji: '👩',
    url: 'assets/avatars/AliciaSolid.vrm',
  },
  {
    id: 'seed-san',
    name: 'Seed-san',
    emoji: '🧑',
    url: 'assets/avatars/Seed-san.vrm',
  },
  {
    id: 'vrm1-robot',
    name: 'Robot',
    emoji: '🤖',
    url: 'assets/avatars/VRM1_Constraint.vrm',
  },
];
