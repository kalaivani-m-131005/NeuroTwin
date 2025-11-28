export enum EmotionCore {
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  STRESSED = 'stressed',
  ANXIOUS = 'anxious',
  TIRED = 'tired',
  LONELY = 'lonely',
  NEUTRAL = 'neutral'
}

export interface AnalysisData {
  primary: EmotionCore;
  secondary: string;
  intensity: number;
  reason: string;
}

export interface CompletedAction {
  id: string;
  action: string;
  timestamp: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  analysis?: AnalysisData; // Only for model messages
  actionSuggestion?: string; // Extracted micro-action
  actionCompleted?: boolean; // If user clicked "Done"
  feedback?: 'like' | 'dislike'; // User feedback
}

export interface Session {
  id: string;
  title: string;
  date: Date;
  messages: Message[];
}

export interface UserPreferences {
  fontSize: 'normal' | 'large';
  reducedMotion: boolean;
  theme: 'dark' | 'pastel';
  personality: 'bubbly' | 'calm' | 'empathetic';
}

export interface UserProfile {
  name: string;
  lastLogin: Date;
  moodHistory: { date: Date; mood: EmotionCore; intensity: number; reason?: string }[];
  completedActions: CompletedAction[];
  sessions: Session[];
  preferences: UserPreferences;
}

export type ViewState = 'login' | 'chat' | 'profile';