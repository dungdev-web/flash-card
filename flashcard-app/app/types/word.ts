export interface Word {
  id?: string;
  english: string;
  meaning: string;
  topic: string;
  example: string;
  learned: boolean;
  userId: string;
  isPreset: boolean;
  phonetic?: string; // IPA
  audioUrl?: string;
  createdAt: number;
  partOfSpeech: string;
}
export interface WordInput {
  english: string;
  meaning: string;
  topic: string;
  example: string;
  learned?: boolean;
  phonetic?: string;
  audioUrl?: string;
  partOfSpeech?: string;
  isPreset: boolean; // ⭐ từ vựng hệ thống
}
