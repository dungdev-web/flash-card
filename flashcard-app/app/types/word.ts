export interface Word {
  id?: string;
  english: string;
  meaning: string;
  topic: string;
  example: string;
  learned: boolean;
  userId: string;
  isPreset: boolean;
  createdAt: number;
}
export interface WordInput {
  english: string;
  meaning: string;
  topic: string;
  example: string;
  learned?: boolean;
  isPreset: boolean; // ⭐ từ vựng hệ thống
}
