export type Mood = "happy" | "calm" | "sad" | "tired" | "angry" | null;

export interface DiaryEntry {
  date: string;
  mood: Mood;
  fourWords: string[];
  isDirectWrite: boolean;
  heartText: string;
  releaseText: string;
  released: boolean;
}

export type BucketType = "hydrate" | "mood" | "order" | "habit";

export type OrderProgress = 0 | 1 | 2;

export interface BucketItem {
  id: string;
  text: string;
  type: BucketType;
  units: boolean[];
  labels?: string[];
  orderProgress?: OrderProgress[];
  completed: boolean;
  archived?: boolean;
  archivedAt?: number;
  createdAt: number;
}

export const createOrderLabels = (count: number) => Array<string>(count).fill("");

export const createOrderProgress = (count: number): OrderProgress[] => Array<OrderProgress>(count).fill(0);

export const orderLabelPlaceholder = (index: number) => `우선순위 ${index + 1}`;

export const orderUnitsFromProgress = (progress: OrderProgress[]) => progress.map((step) => step === 2);

export interface Particle {
  id: number;
  left: number;
  top: number;
  x: number;
  y: number;
  r: number;
}

export const wordSets = [
  { words: ["토", "닥", "토", "닥"], hint: "ㅌㄷㅌㄷ" },
  { words: ["행", "복", "만", "땅"], hint: "ㅎㅂㅁㄷ" },
  { words: ["힐", "링", "타", "임"], hint: "ㅎㄹㅌㅇ" },
  { words: ["사", "랑", "해", "요"], hint: "ㅅㄹㅎㅇ" },
  { words: ["소", "소", "한", "날"], hint: "ㅅㅅㅎㄴ" },
  { words: ["마", "음", "일", "기"], hint: "ㅁㅇㅇㄱ" },
  { words: ["쓰", "담", "쓰", "담"], hint: "ㅅㄷㅅㄷ" },
  { words: ["몽", "글", "몽", "글"], hint: "ㅁㄱㅁㄱ" },
];

export const moods = [
  { id: "happy" as Mood, emoji: "😊", label: "행복", color: "bg-[#ffe3ec] dark:bg-[#3d1a24] text-[#ff6b9d] border-[#ffb3c6] shadow-[#ffe3ec]/30", glow: "rgba(255,107,157,0.4)" },
  { id: "calm" as Mood, emoji: "😌", label: "평온", color: "bg-[#e8f1f5] dark:bg-[#1a2d3d] text-[#4ea8de] border-[#90e0ef] shadow-[#e8f1f5]/30", glow: "rgba(78,168,222,0.4)" },
  { id: "sad" as Mood, emoji: "😔", label: "우울", color: "bg-[#eef2f7] dark:bg-[#1f242e] text-[#64748b] border-[#cbd5e1] shadow-[#eef2f7]/30", glow: "rgba(100,116,139,0.4)" },
  { id: "tired" as Mood, emoji: "😑", label: "지침", color: "bg-[#f3f4f6] dark:bg-[#1e1e24] text-[#9ca3af] border-[#e5e7eb] shadow-[#f3f4f6]/30", glow: "rgba(156,163,175,0.4)" },
  { id: "angry" as Mood, emoji: "😤", label: "화남", color: "bg-[#ffebee] dark:bg-[#3d181a] text-[#ef5350] border-[#ffcdd2] shadow-[#ffebee]/30", glow: "rgba(239,83,80,0.4)" },
];

export const archiveCardColors: Record<string, { bg: string; ink: string }> = {
  happy: { bg: "#F4A9C7", ink: "#C42A6B" },
  calm: { bg: "#9AD0EC", ink: "#2E6E8E" },
  sad: { bg: "#A9C585", ink: "#4F6B34" },
  tired: { bg: "#F4CB45", ink: "#A9750A" },
  angry: { bg: "#F0875D", ink: "#B53A22" },
};

export const bucketTypeMeta: Record<BucketType, { label: string; bg: string; ink: string }> = {
  hydrate: { label: "물마시기", bg: "#BBE6FC", ink: "#2E6DC6" },
  mood: { label: "동그라미", bg: "#FBEAF0", ink: "#FC4B7E" },
  order: { label: "해야할일", bg: "#FCDA52", ink: "#DAA428" },
  habit: { label: "체크리스트", bg: "#9CC194", ink: "#5C8049" },
};

export const bucketPresets: { type: BucketType; phrase: string; target: number }[] = [
  { type: "hydrate", phrase: "물마시기", target: 8 },
  { type: "mood", phrase: "감정 환기", target: 5 },
  { type: "order", phrase: "해야할일", target: 3 },
  { type: "habit", phrase: "체크리스트", target: 7 },
];
