export type SubdivisionType = "quarter" | "eighth" | "sixteenth" | "triplet";

export const SUBDIVISIONS: { type: SubdivisionType; label: string; desc: string }[] = [
  { type: "quarter",   label: "4분",  desc: "4분음표"   },
  { type: "eighth",    label: "8분",  desc: "8분음표"   },
  { type: "sixteenth", label: "16분", desc: "16분음표"  },
  { type: "triplet",   label: "3연",  desc: "셋잇단음표" },
];

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
