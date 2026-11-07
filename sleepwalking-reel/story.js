// How Sleepwalking Works — one timeline for picture, captions, sound.  1080×1920, 24 fps, 60 s.
export const DUR = 61.25;
export const VO = [
  { id: 'v1', t: 0.5, text: "You can get out of bed, walk through the house, and open the front door, while you're still asleep." },
  { id: 'v2', t: 7.25, text: 'This is sleepwalking. It starts in deep sleep, the slow-wave stage, usually in the first third of the night.' },
  { id: 'v3', t: 14.5, text: 'Normally, the whole brain sleeps together. In a sleepwalker, it splits.' },
  { id: 'v4', t: 19.0, text: 'Areas that control movement wake up,' },
  { id: 'v5', t: 21.6, text: 'while areas that handle judgment and awareness stay in deep sleep.' },
  { id: 'v6', t: 26.75, text: 'So the body walks, often with eyes open, but no one is really in charge. Most people remember little or nothing.' },
  { id: 'v7', t: 35.0, text: "It's most common in kids. About 5% of children sleepwalk in a year, compared with 1.5% of adults." },
  { id: 'v8', t: 43.0, text: 'It often runs in families, and lack of sleep, stress, fever, or some medicines can trigger it.' },
  { id: 'v9', t: 49.9, text: "If you find someone sleepwalking, you don't need to wake them. Gently guide them back to bed." },
];
// shots: [t0, t1, name]
export const SHOTS = [
  [0, 7.0, 'house'], [7.0, 14.25, 'graph'], [14.25, 26.5, 'brain'], [26.5, 28.25, 'walk'], [28.25, 30.75, 'eyes'],
  [30.75, 34.75, 'walk2'], [34.75, 42.9, 'stats'], [42.9, 50.0, 'trig'], [50.0, 53.4, 'yard'], [53.4, 61.25, 'bed'],
];
export const shotAt = t => SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];
// key moments, locked to the narration's word timings (voices/words.json)
export const T = {
  sit: 0.3, stand: 0.75, walk0: 1.0, door: 2.9, walk1: 3.4, zz: 4.2, title: [2.6, 6.95],
  cols0: 7.5, colStep: 0.115, n3: 10.35, third: 12.2, walkerIcon: 12.85,
  together: 15.1, split: 17.75, motor: 19.95, frontal: 22.5, delta: 24.4,
  eyes: 28.25, bubble: 31.6, bubblePop: 33.3,
  kids: 37.1, adults: 40.3,
  fam: 43.85, lack: 44.9, stress: 45.6, fever: 46.35, meds: 47.05,
  parent: 50.05, wakeNo: 51.75, guide: 53.4, liedown: 54.05, dawn0: 54.05, dawn1: 57.25, end: 57.4,
};
// sky keyframes: [t, zenith, horizon, sun colour, sun intensity, hemi sky, hemi ground, hemi I, sun elevation, sun azimuth, night]
export const SKY = [
  [0, '#141a3d', '#3d3f78', '#9fb4ff', 0.9, '#5b6aa8', '#2a2440', 0.55, 40, 220, 1],
  [52.65, '#141a3d', '#3d3f78', '#9fb4ff', 0.9, '#5b6aa8', '#2a2440', 0.55, 40, 220, 1],
  [55.65, '#5a5fa8', '#f2a37e', '#ffb27a', 1.6, '#c9a7c8', '#6a5560', 0.8, 12, 120, .45],
  [58.15, '#8fbde6', '#ffe0b8', '#fff1dc', 2.4, '#eaf2fb', '#c9b79c', 1.05, 28, 130, 0],
  [61.25, '#8fbde6', '#ffe0b8', '#fff1dc', 2.4, '#eaf2fb', '#c9b79c', 1.05, 28, 130, 0],
];
export const SOURCES = [
  'Terzaghi et al. 2009, Sleep · Stallman & Kohler 2016, PLoS ONE · Aust Fam Physician 2017',
];
