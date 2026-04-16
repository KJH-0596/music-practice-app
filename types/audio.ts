export type TimeSignature = {
  beats: number;      // 분자 (ex. 4)
  division: number;   // 분모 (ex. 4)
};

export const TIME_SIGNATURES: TimeSignature[] = [
  { beats: 2, division: 4 },
  { beats: 3, division: 4 },
  { beats: 4, division: 4 },
  { beats: 6, division: 8 },
];

export const BPM_MIN = 40;
export const BPM_MAX = 240;
export const BPM_DEFAULT = 120;
