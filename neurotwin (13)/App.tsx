import React, { useState, useEffect, useRef } from 'react';
import Login from './components/Login';
import Profile from './components/Profile';
import EmergencyButton from './components/EmergencyButton';
import BreathingExercise from './components/BreathingExercise';
import { UserProfile, Message, EmotionCore, ViewState, CompletedAction, Session, UserPreferences } from './types';
import { sendMessageToGemini, parseResponse } from './services/geminiService';

const EMOJI_LIST = [
  '😊', '😔', '😡', '😰', '😴', '😐', 
  '🤗', '🤔', '😭', '😤', '😌', '🤯',
  '🥺', '❤️', '✨', '🌊', '🔥', '🌈',
  '🌸', '☕', '🎵', '🧘', '🦄', '🕊️'
];

const DAILY_THOUGHTS = [
  "Emotions are visitors, not permanent residents.",
  "You don't have to control your thoughts. You just have to stop letting them control you.",
  "Deep breathing triggers the body's relaxation response.",
  "It's okay to not be okay right now.",
  "Progress is not linear. Small steps count.",
  "Your feelings are valid, even the messy ones.",
  "Rest is productive.",
  "Grounding helps bring your mind back to the present.",
  "You are stronger than you think.",
  "Acknowledging a feeling is the first step to healing it.",
  "Treat yourself with the same kindness you offer others.",
  "This feeling will pass, like clouds in the sky.",
  "You have survived 100% of your bad days so far."
];

// Emotion to Color Map for Ambient Light
const MOOD_COLORS = {
  [EmotionCore.HAPPY]: 'rgba(252, 211, 77, 0.15)', // Warm Yellow
  [EmotionCore.SAD]: 'rgba(96, 165, 250, 0.15)',   // Cool Blue
  [EmotionCore.ANGRY]: 'rgba(248, 113, 113, 0.15)', // Red
  [EmotionCore.STRESSED]: 'rgba(167, 139, 250, 0.15)', // Purple
  [EmotionCore.ANXIOUS]: 'rgba(244, 114, 182, 0.15)', // Pink
  [EmotionCore.TIRED]: 'rgba(148, 163, 184, 0.15)',   // Grey Blue
  [EmotionCore.LONELY]: 'rgba(45, 212, 191, 0.15)',  // Teal
  [EmotionCore.NEUTRAL]: 'rgba(226, 232, 240, 0.05)'  // Light Grey
};

// Emotion to Animation Map for Reactive Avatar
const MOOD_ANIMATIONS = {
  [EmotionCore.HAPPY]: 'animate-bounce-joy',
  [EmotionCore.SAD]: 'animate-float',
  [EmotionCore.ANGRY]: 'animate-shake-stress',
  [EmotionCore.STRESSED]: 'animate-shake-stress',
  [EmotionCore.ANXIOUS]: 'animate-pulse-slow',
  [EmotionCore.TIRED]: 'animate-breathe-calm',
  [EmotionCore.LONELY]: 'animate-float',
  [EmotionCore.NEUTRAL]: ''
};

const CRISIS_KEYWORDS = ['suicide', 'die', 'kill myself', 'tharkolai', 'sago', 'want to end it', 'emergency', 'dead'];

// Typing Indicator Component
const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3 bg-neuro-highlight rounded-[20px] rounded-bl-none w-fit animate-fade-in-up mt-2 ml-1 border border-neuro-highlight">
    <div className="w-2 h-2 bg-neuro-secondary rounded-full animate-[typing_1.4s_infinite_ease-in-out_0s]"></div>
    <div className="w-2 h-2 bg-neuro-secondary rounded-full animate-[typing_1.4s_infinite_ease-in-out_0.2s]"></div>
    <div className="w-2 h-2 bg-neuro-secondary rounded-full animate-[typing_1.4s_infinite_ease-in-out_0.4s]"></div>
  </div>
);

// Recursive component to render styled text
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const parts = text.split(/(\*\*[\s\S]*?\*\*|__[\s\S]*?__|_[\s\S]*?_|\*[\s\S]*?\*)/g);
  
  if (parts.length === 1) return <>{text}</>;

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
          return <strong key={i} className="font-bold text-inherit"><FormattedText text={part.slice(2, -2)} /></strong>;
        }
        if (part.startsWith('__') && part.endsWith('__') && part.length >= 4) {
          return <u key={i} className="underline decoration-inherit underline-offset-4"><FormattedText text={part.slice(2, -2)} /></u>;
        }
        if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
          return <em key={i} className="italic text-inherit"><FormattedText text={part.slice(1, -1)} /></em>;
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
            return <em key={i} className="italic text-inherit"><FormattedText text={part.slice(1, -1)} /></em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('login');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Initialize lazily to ensure it never renders empty
  const [dailyThought, setDailyThought] = useState(() => DAILY_THOUGHTS[Math.floor(Math.random() * DAILY_THOUGHTS.length)]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine current ambient color & animation based on last AI message analysis
  const currentMood = messages.filter(m => m.role === 'model' && m.analysis).pop()?.analysis?.primary || EmotionCore.NEUTRAL;
  const ambientColor = MOOD_COLORS[currentMood];
  const avatarAnimation = MOOD_ANIMATIONS[currentMood];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages, isLoading]); // Scroll when loading starts too

  // Theme Application Logic
  useEffect(() => {
      if (user?.preferences?.theme) {
          document.body.setAttribute('data-theme', user.preferences.theme);
      } else {
          document.body.removeAttribute('data-theme'); // Default dark
      }
  }, [user?.preferences?.theme]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`neurotwin_user_${user.name}`, JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    if (user && messages.length > 0) {
      localStorage.setItem(`neurotwin_current_messages_${user.name}`, JSON.stringify(messages));
    }
  }, [user, messages]);

  const toggleMute = () => {
      if (!isMuted) {
          // Turning mute ON - stop speaking immediately
          window.speechSynthesis.cancel();
      }
      setIsMuted(!isMuted);
  };

  const detectLanguage = (text: string): string => {
      const tamilRegex = /[\u0B80-\u0BFF]/;
      const hindiRegex = /[\u0900-\u097F]/;
      
      if (tamilRegex.test(text)) return 'ta-IN';
      if (hindiRegex.test(text)) return 'hi-IN';
      return 'en-US';
  };

  const speakText = (text: string) => {
    if (isMuted) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any previous speech
      
      const utterance = new SpeechSynthesisUtterance(text);
      const lang = detectLanguage(text);
      utterance.lang = lang;
      
      const voices = window.speechSynthesis.getVoices();
      
      // Try to find a voice that matches the detected language
      let selectedVoice = voices.find(v => v.lang.includes(lang));
      
      // If English, try to find a soft sounding voice
      if (lang === 'en-US' || lang === 'en-GB') {
          selectedVoice = voices.find(v => 
              (v.name.includes('Google UK English Female') || v.name.includes('Samantha') || v.name.includes('Female'))
          );
      }

      if (selectedVoice) utterance.voice = selectedVoice;
      
      utterance.rate = 0.9; // Slightly slower for comfort
      utterance.pitch = 1.1; // Slightly higher/friendly
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const refreshThought = () => {
      let newThought;
      do {
          newThought = DAILY_THOUGHTS[Math.floor(Math.random() * DAILY_THOUGHTS.length)];
      } while (newThought === dailyThought && DAILY_THOUGHTS.length > 1);
      setDailyThought(newThought);
  };

  const triggerWelcome = (username: string) => {
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        const initialMsg: Message = {
            id: 'init-1',
            role: 'model',
            text: `Hi ${username}! I'm NeuroTwin. I'm so happy to see you! How are you feeling today?`,
            timestamp: new Date(),
            analysis: { primary: EmotionCore.HAPPY, secondary: 'welcoming', intensity: 0.5, reason: 'new session' }
        };
        setMessages([initialMsg]);
        speakText(initialMsg.text);
    }, 1500); // Slight delay for effect
  };

  const handleLogin = (username: string) => {
    const userKey = `neurotwin_user_${username}`;
    const msgKey = `neurotwin_current_messages_${username}`;
    
    const storedUser = localStorage.getItem(userKey);
    const storedMessages = localStorage.getItem(msgKey);

    const defaultPreferences: UserPreferences = { fontSize: 'normal', reducedMotion: false, theme: 'dark', personality: 'bubbly' };

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const hydratedUser: UserProfile = {
          ...parsedUser,
          preferences: { ...defaultPreferences, ...parsedUser.preferences }, 
          lastLogin: new Date(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          moodHistory: parsedUser.moodHistory.map((m: any) => ({
            ...m,
            date: new Date(m.date)
          })),
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
          completedActions: (parsedUser.completedActions || []).map((a: any) => ({
            ...a,
            timestamp: new Date(a.timestamp)
          })),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sessions: (parsedUser.sessions || []).map((s: any) => ({
             ...s,
             date: new Date(s.date),
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
          }))
        };
        setUser(hydratedUser);

        if (storedMessages) {
          const parsedMsgs = JSON.parse(storedMessages);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const hydratedMsgs: Message[] = parsedMsgs.map((m: any) => ({
             ...m,
             timestamp: new Date(m.timestamp)
          }));
          setMessages(hydratedMsgs);
        } else {
          setMessages([]);
          triggerWelcome(username);
        }

      } catch (error) {
        console.error("Error restoring data", error);
        const newUser: UserProfile = { name: username, lastLogin: new Date(), moodHistory: [], completedActions: [], sessions: [], preferences: defaultPreferences };
        setUser(newUser);
        setMessages([]);
        triggerWelcome(username);
      }
    } else {
      const newUser: UserProfile = { name: username, lastLogin: new Date(), moodHistory: [], completedActions: [], sessions: [], preferences: defaultPreferences };
      setUser(newUser);
      triggerWelcome(username);
    }
    
    setView('chat');
  };

  const handleUpdatePreferences = (prefs: UserPreferences) => {
      if (user) {
          setUser({ ...user, preferences: prefs });
      }
  };

  const handleNewChat = () => {
    if (!user) return;
    
    // Archive current session if it has user messages
    if (messages.length > 1) {
        const userFirstMsg = messages.find(m => m.role === 'user');
        const sessionTitle = userFirstMsg ? userFirstMsg.text.substring(0, 30) + (userFirstMsg.text.length > 30 ? '...' : '') : 'Unsaved Session';
        
        const newSession: Session = {
            id: Date.now().toString(),
            title: sessionTitle,
            date: new Date(),
            messages: messages
        };

        const updatedUser = {
            ...user,
            sessions: [newSession, ...user.sessions]
        };
        setUser(updatedUser);
    }

    setMessages([]);
    localStorage.removeItem(`neurotwin_current_messages_${user.name}`);
    triggerWelcome(user.name);
    setShowSidebar(false); 
  };

  const loadSession = (session: Session) => {
      if (messages.length > 1 && user) {
        const userFirstMsg = messages.find(m => m.role === 'user');
        if (userFirstMsg) {
             const sessionTitle = userFirstMsg.text.substring(0, 30) + "...";
             const currentSessionToSave: Session = {
                 id: Date.now().toString(),
                 title: sessionTitle,
                 date: new Date(),
                 messages: messages
             };
             const updatedUser = { ...user, sessions: [currentSessionToSave, ...user.sessions] };
             setUser(updatedUser);
        }
      }
      setMessages(session.messages);
      setShowSidebar(false);
  };

  const handleMessageFeedback = (msgId: string, type: 'like' | 'dislike') => {
    setMessages(prev => prev.map(msg => 
        msg.id === msgId ? { ...msg, feedback: type } : msg
    ));
  };

  const handleActionComplete = (msgId: string, actionText: string) => {
    if (!user) return;
    
    setMessages(prev => prev.map(msg => 
        msg.id === msgId ? { ...msg, actionCompleted: true } : msg
    ));

    const newAction: CompletedAction = {
        id: Date.now().toString(),
        action: actionText,
        timestamp: new Date()
    };

    const updatedUser = {
        ...user,
        completedActions: [...user.completedActions, newAction]
    };
    setUser(updatedUser);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleEditMessage = (msgId: string, text: string) => {
    const index = messages.findIndex(m => m.id === msgId);
    if (index === -1) return;
    setInputText(text);
    const newHistory = messages.slice(0, index);
    setMessages(newHistory);
    inputRef.current?.focus();
  };

  const handleRegenerate = async () => {
    const lastUserMsgIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserMsgIndex === -1) return;
    const realIndex = messages.length - 1 - lastUserMsgIndex;
    const lastUserMsg = messages[realIndex];
    const newMessages = messages.slice(0, realIndex + 1);
    setMessages(newMessages);
    await processMessage(lastUserMsg.text, newMessages);
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; 
    // Note: To fully support mixed input voice recognition, we'd need browser support for auto-detect or a selector. 
    // Currently defaulting to 'en-US' which catches English well. 
    // Some browsers might auto-adapt.

    recognition.onstart = () => setIsListening(true);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // CLIENT-SIDE SAFETY CHECK
  const checkForCrisis = (text: string): boolean => {
      const lowerText = text.toLowerCase();
      return CRISIS_KEYWORDS.some(keyword => lowerText.includes(keyword));
  };

  const processMessage = async (text: string, currentHistory: Message[]) => {
    // 1. Safety Check
    if (checkForCrisis(text)) {
        setShowEmergency(true);
        // Do NOT send to API. Remove user's last unsafe message or just add a safety disclaimer?
        // Let's add a local safety message from NeuroTwin
        const safetyMsg: Message = {
            id: Date.now().toString(),
            role: 'model',
            text: "I'm detecting that you're in a lot of pain right now. Please, I want you to be safe. I've opened the Crisis Support mode for you—it has resources that can help immediately.",
            timestamp: new Date(),
            analysis: { primary: EmotionCore.ANXIOUS, secondary: 'crisis', intensity: 1, reason: 'safety trigger' }
        };
        setMessages(prev => [...prev, safetyMsg]);
        speakText(safetyMsg.text);
        return;
    }

    setIsLoading(true);
    try {
      const history = currentHistory.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Pass user context to support Personality Tuning and core rules
      const rawResponse = await sendMessageToGemini(history, text, user || undefined);
      const { analysis, cleanText, action } = parseResponse(rawResponse);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: cleanText,
        timestamp: new Date(),
        analysis: analysis || undefined,
        actionSuggestion: action || undefined,
        actionCompleted: false
      };

      setMessages(prev => [...prev, aiMsg]);
      
      if (analysis) {
        if (user) {
          const updatedUser = {
            ...user,
            moodHistory: [...user.moodHistory, { 
                date: new Date(), 
                mood: analysis.primary, 
                intensity: analysis.intensity,
                reason: analysis.reason
            }]
          };
          setUser(updatedUser);
        }
      }
      speakText(cleanText);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    setShowEmojiPicker(false);
    const newMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputText('');
    
    await processMessage(newMsg.text, updatedMessages);
  };

  if (view === 'login') return <Login onLogin={handleLogin} />;
  
  if (view === 'profile' && user) return (
      <Profile 
        user={user} 
        onLogout={() => setView('login')} 
        onBack={() => setView('chat')} 
        onUpdatePreferences={handleUpdatePreferences}
      />
  );

  return (
    <div className={`flex h-screen w-full bg-neuro-base text-neuro-primary overflow-hidden relative transition-colors duration-500 ${user?.preferences.fontSize === 'large' ? 'text-lg' : ''}`}>
      
      {/* Dynamic Ambient Light Background */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 transition-colors duration-[3000ms] ease-in-out opacity-100"
        style={{ 
            background: `radial-gradient(circle at 50% 50%, ${ambientColor} 0%, rgba(0,0,0,0) 70%)` 
        }}
      ></div>

      {/* Controlled Emergency Modal */}
      <EmergencyButton isOpen={showEmergency} onClose={() => setShowEmergency(false)} />
      
      {showBreathing && <BreathingExercise onClose={() => setShowBreathing(false)} />}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-neuro-surface/90 border-r border-neuro-highlight backdrop-blur-xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-4">
            {/* New Chat Main Button */}
            <button 
                onClick={handleNewChat}
                className="flex items-center gap-3 w-full px-4 py-3 bg-neuro-highlight hover:bg-neuro-base text-neuro-primary rounded-lg border border-neuro-highlight transition-all mb-6 group shadow-sm"
            >
                <div className="bg-neuro-primary text-neuro-base rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                    </svg>
                </div>
                <span className="font-semibold text-sm">New Chat</span>
            </button>
            
            {/* Zen Tools */}
            <div className="mb-6">
                <h3 className="text-xs font-bold text-neuro-secondary uppercase tracking-wider px-2 mb-2">Zen Tools</h3>
                 <button 
                    onClick={() => { setShowBreathing(true); setShowSidebar(false); }}
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-neuro-highlight transition-colors text-sm text-neuro-secondary hover:text-neuro-primary"
                >
                    <div className="p-1 bg-neuro-accent/20 rounded-md text-neuro-accent">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 15z" clipRule="evenodd" />
                        </svg>
                    </div>
                    Breathing Space
                </button>
            </div>

            {/* Recent Sessions */}
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2">
                <h3 className="text-xs font-bold text-neuro-secondary uppercase tracking-wider px-2 mb-2">Recent</h3>
                {user?.sessions && user.sessions.length > 0 ? (
                    user.sessions.map((session) => (
                        <button
                            key={session.id}
                            onClick={() => loadSession(session)}
                            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-neuro-secondary hover:text-neuro-primary hover:bg-neuro-highlight/50 transition-all truncate"
                        >
                            {session.title}
                        </button>
                    ))
                ) : (
                    <p className="px-3 text-xs text-neuro-secondary/50 italic">No history yet</p>
                )}
            </div>

            {/* Daily Thought Card */}
            <div className="mt-4 mb-4 p-4 rounded-xl bg-neuro-highlight/30 border border-neuro-highlight relative overflow-hidden group">
                {/* Paper Texture Overlay for Pastel Mode */}
                <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cream-dust.png')] pointer-events-none mix-blend-multiply"></div>
                
                <div className="flex justify-between items-start mb-2 relative z-10">
                    <h4 className="text-[10px] font-bold text-neuro-accent uppercase tracking-wider">Daily Thought</h4>
                    <button 
                        onClick={refreshThought}
                        className="text-neuro-secondary hover:text-neuro-primary transition-colors"
                        title="New Thought"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </button>
                </div>
                <p className="text-xs text-neuro-primary leading-relaxed italic opacity-90 relative z-10 font-medium">"{dailyThought}"</p>
            </div>

            {/* Crisis Support Footer */}
            <div className="pt-4 border-t border-neuro-highlight space-y-2 mt-auto">
                <button 
                    onClick={() => { setShowEmergency(true); setShowSidebar(false); }}
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-neuro-rose/10 transition-colors group"
                >
                    <div className="w-8 h-8 rounded-full bg-neuro-rose/20 flex items-center justify-center text-neuro-rose group-hover:bg-neuro-rose group-hover:text-white transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-neuro-rose">Crisis Support</p>
                        <p className="text-[10px] text-neuro-secondary">Safety Anchor</p>
                    </div>
                </button>
            </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {showSidebar && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setShowSidebar(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative z-10">
        
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-neuro-highlight bg-neuro-base/80 backdrop-blur-md sticky top-0 z-20 transition-colors duration-500">
            <div className="flex items-center gap-3">
                 <button onClick={() => setShowSidebar(true)} className="md:hidden text-neuro-secondary hover:text-neuro-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
                <div className="flex items-center gap-2">
                    {/* Reactive Animated Avatar for Mobile/Desktop Header */}
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-tr from-neuro-gradientStart to-neuro-gradientEnd p-0.5 ${!user?.preferences.reducedMotion ? avatarAnimation : ''} transition-all duration-500`}>
                         <div className="w-full h-full rounded-full bg-neuro-base flex items-center justify-center text-[10px] font-bold text-neuro-primary">NT</div>
                    </div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-neuro-gradientStart to-neuro-gradientEnd bg-clip-text text-transparent md:hidden">NeuroTwin</h1>
                </div>
            </div>

            {/* Right Side: Audio Toggle & Profile */}
            <div className="flex items-center gap-3">
                {/* Audio Toggle */}
                <button 
                    onClick={toggleMute}
                    className={`p-2 rounded-full transition-colors ${isMuted ? 'text-neuro-secondary bg-neuro-surface' : 'text-neuro-base bg-neuro-primary'}`}
                    title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
                >
                    {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        </svg>
                    )}
                </button>

                {/* Profile Avatar Button */}
                <button 
                    onClick={() => setView('profile')}
                    className="w-9 h-9 rounded-full bg-gradient-to-tr from-neuro-gradientStart to-neuro-gradientEnd p-0.5"
                    title="Profile & Settings"
                >
                    <div className="w-full h-full rounded-full bg-neuro-base flex items-center justify-center text-xs font-bold text-neuro-primary">
                        {user?.name.charAt(0).toUpperCase()}
                    </div>
                </button>
            </div>
        </header>

        {/* Chat Messages */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6" aria-live="polite">
            {messages.map((msg, idx) => {
                const isLastAi = msg.role === 'model' && idx === messages.length - 1;
                return (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up group max-w-3xl mx-auto w-full`}>
                        
                        {/* Avatar for AI in Chat Bubble */}
                        {msg.role === 'model' && (
                            <div className="flex items-center gap-2 mb-1 px-1">
                                <div className={`w-5 h-5 rounded-full bg-neuro-gradientStart flex items-center justify-center text-[10px] text-white font-bold transition-transform ${isLastAi && !user?.preferences.reducedMotion ? avatarAnimation : ''}`}>NT</div>
                                <span className="text-xs text-neuro-secondary font-bold">NeuroTwin</span>
                            </div>
                        )}

                        {/* Message Bubble */}
                        <div className={`px-5 py-4 text-[15px] leading-relaxed shadow-sm relative ${
                            msg.role === 'user' 
                                ? 'bg-neuro-highlight text-neuro-primary rounded-[20px] rounded-br-none max-w-[85%] border border-transparent' 
                                : 'text-neuro-primary hover:text-neuro-primary/90 transition-colors max-w-full w-full'
                        }`}>
                            <div className="whitespace-pre-wrap"><FormattedText text={msg.text} /></div>
                            
                            {/* Unique Interactive Action Card */}
                            {msg.role === 'model' && msg.actionSuggestion && (
                                <div className="mt-6">
                                    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                        msg.actionCompleted 
                                            ? 'bg-green-500/10 border-green-500/30' 
                                            : 'bg-neuro-surface border-neuro-highlight hover:border-neuro-accent'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                msg.actionCompleted ? 'bg-green-500 text-black' : 'bg-neuro-highlight text-neuro-accent'
                                            }`}>
                                                {msg.actionCompleted ? (
                                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.207 1.05l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.207z" clipRule="evenodd" />
                                                     </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold uppercase tracking-wider ${msg.actionCompleted ? 'text-green-400' : 'text-neuro-secondary'}`}>
                                                    Suggested Action
                                                </p>
                                                <p className={`font-medium text-sm ${msg.actionCompleted ? 'text-neuro-primary line-through opacity-70' : 'text-neuro-primary'}`}>
                                                    {msg.actionSuggestion}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {!msg.actionCompleted && (
                                            <button 
                                                onClick={() => handleActionComplete(msg.id, msg.actionSuggestion!)}
                                                className="px-3 py-1.5 rounded-lg bg-neuro-accent hover:opacity-90 text-white text-xs font-bold transition-colors"
                                            >
                                                Do it
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Toolbar */}
                        <div className={`flex items-center mt-2 gap-2 ${msg.role === 'user' ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
                                
                                {/* Copy Button */}
                                <div className="flex items-center bg-neuro-surface/50 backdrop-blur-sm rounded-full border border-neuro-highlight p-1 shadow-sm">
                                    <button 
                                        onClick={() => handleCopy(msg.text)}
                                        className="w-7 h-7 flex items-center justify-center text-neuro-secondary hover:text-neuro-primary transition-colors rounded-full hover:bg-neuro-highlight"
                                        title="Copy"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                        </svg>
                                    </button>

                                    {/* User Edit */}
                                    {msg.role === 'user' && (
                                    <button 
                                        onClick={() => handleEditMessage(msg.id, msg.text)}
                                        className="w-7 h-7 flex items-center justify-center text-neuro-secondary hover:text-neuro-primary transition-colors rounded-full hover:bg-neuro-highlight"
                                        title="Edit"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                        </svg>
                                    </button>
                                    )}

                                    {/* Model Feedback */}
                                    {msg.role === 'model' && (
                                        <>
                                            <button 
                                                onClick={() => handleMessageFeedback(msg.id, 'like')}
                                                className={`w-7 h-7 flex items-center justify-center transition-colors rounded-full hover:bg-neuro-highlight ${msg.feedback === 'like' ? 'text-neuro-accent' : 'text-neuro-secondary hover:text-neuro-primary'}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill={msg.feedback === 'like' ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a2.25 2.25 0 012.25 2.25V7.38a2.25 2.25 0 114.5 0V9.3a2.25 2.25 0 012.25 2.25v3.504c0 1.385-.558 2.716-1.542 3.69l-1.656 1.655a2.25 2.25 0 01-1.591.659h-9.9c-.87 0-1.576-.705-1.576-1.576V9a1.5 1.5 0 011.5-1.5v2.25z" />
                                                </svg>
                                            </button>

                                            <button 
                                                onClick={() => handleMessageFeedback(msg.id, 'dislike')}
                                                className={`w-7 h-7 flex items-center justify-center transition-colors rounded-full hover:bg-neuro-highlight ${msg.feedback === 'dislike' ? 'text-neuro-rose' : 'text-neuro-secondary hover:text-neuro-primary'}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill={msg.feedback === 'dislike' ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 scale-y-[-1]">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a2.25 2.25 0 012.25 2.25V7.38a2.25 2.25 0 114.5 0V9.3a2.25 2.25 0 012.25 2.25v3.504c0 1.385-.558 2.716-1.542 3.69l-1.656 1.655a2.25 2.25 0 01-1.591.659h-9.9c-.87 0-1.576-.705-1.576-1.576V9a1.5 1.5 0 011.5-1.5v2.25z" />
                                                </svg>
                                            </button>

                                            {isLastAi && !isLoading && (
                                                <button 
                                                    onClick={handleRegenerate}
                                                    className="w-7 h-7 flex items-center justify-center text-neuro-secondary hover:text-neuro-primary transition-colors rounded-full hover:bg-neuro-highlight"
                                                    title="Regenerate"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                    </svg>
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                        </div>
                    </div>
                );
            })}
            
            {/* Loading Indicator with Typing Effect */}
            {isLoading && (
                <div className="flex justify-start max-w-3xl mx-auto w-full px-5">
                   <div className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full bg-neuro-gradientStart flex items-center justify-center text-[10px] text-white font-bold animate-pulse">NT</div>
                       <TypingIndicator />
                   </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </main>

        {/* Footer Input Area */}
        <footer className="p-4 bg-neuro-base border-t border-neuro-highlight z-30 transition-colors duration-500">
            <div className="max-w-3xl mx-auto relative">
                
                {/* Input Pill */}
                <div className="flex items-center gap-2 bg-neuro-highlight rounded-full px-4 py-3 border border-transparent focus-within:border-neuro-secondary transition-all shadow-lg">
                    
                    {/* Emoji */}
                    <button 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="text-neuro-secondary hover:text-neuro-primary transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                        </svg>
                    </button>

                    <input
                        ref={inputRef}
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Message NeuroTwin..."
                        className="flex-1 bg-transparent border-none outline-none text-neuro-primary placeholder-neuro-secondary text-[15px]"
                    />

                    {/* Voice */}
                    <button 
                        onClick={toggleListening}
                        className={`${isListening ? 'text-neuro-rose animate-pulse' : 'text-neuro-secondary hover:text-neuro-primary'} transition-colors`}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill={isListening ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                    </button>

                     {/* Send */}
                     {inputText.trim() && (
                        <button
                            onClick={handleSendMessage}
                            className="bg-neuro-accent hover:opacity-90 text-white p-1.5 rounded-full transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                            </svg>
                        </button>
                    )}
                </div>

                 {/* Emoji Picker Popover */}
                 {showEmojiPicker && (
                    <div className="absolute bottom-full mb-4 left-0 bg-neuro-surface border border-neuro-highlight rounded-xl p-3 shadow-2xl grid grid-cols-8 gap-1 w-full animate-pop z-50">
                        {EMOJI_LIST.map(emoji => (
                            <button 
                                key={emoji} 
                                onClick={() => {
                                    setInputText(prev => prev + emoji);
                                    setShowEmojiPicker(false);
                                    inputRef.current?.focus();
                                }}
                                className="text-xl hover:bg-neuro-highlight p-2 rounded-lg transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>
             <div className="text-center mt-2">
                <p className="text-[10px] text-neuro-secondary opacity-50">NeuroTwin can make mistakes. Consider checking important information.</p>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default App;