import React, { useState } from 'react';
import { UserProfile, EmotionCore, UserPreferences } from '../types';
import { ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ProfileProps {
  user: UserProfile;
  onLogout: () => void;
  onBack: () => void;
  onUpdatePreferences: (prefs: UserPreferences) => void;
}

const COLORS = {
  [EmotionCore.HAPPY]: '#FCD34D', 
  [EmotionCore.SAD]: '#60A5FA',   
  [EmotionCore.ANGRY]: '#F87171', 
  [EmotionCore.STRESSED]: '#A78BFA', 
  [EmotionCore.ANXIOUS]: '#F472B6', 
  [EmotionCore.TIRED]: '#94A3B8',   
  [EmotionCore.LONELY]: '#2DD4BF',  
  [EmotionCore.NEUTRAL]: '#E2E8F0'  
};

const Profile: React.FC<ProfileProps> = ({ user, onLogout, onBack, onUpdatePreferences }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  const completedActionsCount = user.completedActions ? user.completedActions.length : 0;
  
  // Prepare trend data (Last 14 entries)
  const trendData = user.moodHistory.slice(-14).map((entry) => ({
    date: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    intensity: Math.round(entry.intensity * 100),
    mood: entry.mood
  }));

  // Create a heatmap-like grid for the last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d;
  });

  const getMoodForDate = (date: Date) => {
    return user.moodHistory.find(h => 
        new Date(h.date).getDate() === date.getDate() && 
        new Date(h.date).getMonth() === date.getMonth()
    );
  };

  const handleFontSizeChange = (size: 'normal' | 'large') => {
      onUpdatePreferences({ ...user.preferences, fontSize: size });
  };

  const handleMotionChange = (reduced: boolean) => {
      onUpdatePreferences({ ...user.preferences, reducedMotion: reduced });
  };

  const handleThemeChange = (theme: 'dark' | 'pastel') => {
      onUpdatePreferences({ ...user.preferences, theme: theme });
  };

  const handlePersonalityChange = (personality: 'bubbly' | 'calm' | 'empathetic') => {
      onUpdatePreferences({ ...user.preferences, personality: personality });
  };

  return (
    <div className={`min-h-screen bg-neuro-base text-neuro-primary p-4 md:p-8 overflow-y-auto font-sans transition-colors duration-500 ${user.preferences?.fontSize === 'large' ? 'text-lg' : ''}`}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation */}
        <div className="flex justify-between items-center">
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 px-4 py-2 bg-neuro-surface rounded-full text-sm font-medium hover:bg-neuro-highlight transition-colors border border-neuro-highlight"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Back to Chat
            </button>
            <button onClick={onLogout} className="text-neuro-secondary hover:text-neuro-primary text-sm">Sign Out</button>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-neuro-gradientStart to-neuro-gradientEnd p-1">
                    <div className="w-full h-full rounded-full bg-neuro-base flex items-center justify-center text-3xl font-bold border border-neuro-base">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
                <p className="text-neuro-secondary">Emotional Explorer</p>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-md bg-neuro-accent/20 text-neuro-accent text-xs font-bold">Free Plan</span>
                    <span className="text-xs text-neuro-secondary">Joined {new Date(user.lastLogin).getFullYear()}</span>
                </div>
            </div>
            
            {/* Quick Stats */}
            <div className="ml-auto flex gap-4">
                <div className="bg-neuro-surface border border-neuro-highlight p-4 rounded-2xl min-w-[120px] text-center shadow-sm">
                    <p className="text-3xl font-bold text-neuro-primary">{completedActionsCount}</p>
                    <p className="text-xs text-neuro-secondary uppercase tracking-wider mt-1">Actions Done</p>
                </div>
                <div className="bg-neuro-surface border border-neuro-highlight p-4 rounded-2xl min-w-[120px] text-center shadow-sm">
                    <p className="text-3xl font-bold text-neuro-accent">{user.moodHistory.length}</p>
                    <p className="text-xs text-neuro-secondary uppercase tracking-wider mt-1">Check-ins</p>
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neuro-highlight">
            <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === 'dashboard' ? 'text-neuro-primary' : 'text-neuro-secondary hover:text-neuro-primary'}`}
            >
                Dashboard
                {activeTab === 'dashboard' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neuro-accent"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === 'settings' ? 'text-neuro-primary' : 'text-neuro-secondary hover:text-neuro-primary'}`}
            >
                Settings & Preferences
                {activeTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neuro-accent"></div>}
            </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                
                {/* Mood Heatmap - Calendar View */}
                <div className="bg-neuro-surface border border-neuro-highlight rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold">Mood Calendar</h2>
                        <span className="text-xs text-neuro-secondary">Last 30 Days</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {last30Days.map((date, i) => {
                            const log = getMoodForDate(date);
                            return (
                                <div key={i} className="aspect-square rounded-md relative group cursor-default">
                                    <div 
                                        className={`w-full h-full rounded-md transition-all ${log ? '' : 'bg-neuro-highlight/50'}`}
                                        style={{ backgroundColor: log ? COLORS[log.mood] : undefined, opacity: log ? 0.8 : 1 }}
                                    ></div>
                                    {log && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-neuro-base border border-neuro-highlight text-neuro-primary text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 shadow-lg">
                                            {log.mood}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Intensity Trends */}
                <div className="bg-neuro-surface border border-neuro-highlight rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold">Emotional Flow</h2>
                        <span className="text-xs text-neuro-secondary">Intensity</span>
                    </div>
                    <div className="h-48 w-full">
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-highlight)" vertical={false} />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide domain={[0, 100]} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-highlight)', borderRadius: '8px', color: 'var(--color-primary)' }}
                                        itemStyle={{ color: 'var(--color-primary)', fontSize: '12px' }}
                                        cursor={{ stroke: 'var(--color-secondary)' }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="intensity" 
                                        stroke="var(--color-accent)" 
                                        strokeWidth={3} 
                                        dot={false}
                                        activeDot={{ r: 6 }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-neuro-secondary text-sm">
                                No data yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Log */}
                <div className="md:col-span-2 bg-neuro-surface border border-neuro-highlight rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Action Log
                        </h2>
                        <span className="text-xs text-neuro-secondary bg-neuro-highlight px-2 py-1 rounded-full">
                            {completedActionsCount} Completed
                        </span>
                    </div>
                    
                    {user.completedActions && user.completedActions.length > 0 ? (
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {[...user.completedActions].reverse().map((action) => (
                                <div key={action.id} className="flex items-center justify-between p-3 rounded-xl bg-neuro-base/50 border border-neuro-highlight hover:border-neuro-accent/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.207 1.05l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.207z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-sm">{action.action}</span>
                                    </div>
                                    <span className="text-xs text-neuro-secondary">
                                        {new Date(action.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-neuro-secondary">
                            <p>No actions completed yet.</p>
                            <p className="text-xs mt-1">Follow suggestions in chat to build your streak!</p>
                        </div>
                    )}
                </div>

            </div>
        ) : (
            /* SETTINGS TAB */
            <div className="bg-neuro-surface border border-neuro-highlight rounded-3xl p-8 animate-fade-in-up space-y-8 shadow-sm">
                
                {/* Visual Theme Section */}
                 <div>
                    <h3 className="text-xl font-bold mb-4">Visual Theme</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleThemeChange('dark')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${user.preferences?.theme === 'dark' ? 'border-neuro-accent bg-neuro-highlight/20' : 'border-neuro-highlight bg-transparent opacity-60 hover:opacity-100'}`}
                        >
                            <div className="w-full h-12 bg-black rounded-lg border border-gray-800"></div>
                            <span className="text-sm font-medium">Midnight (Dark)</span>
                        </button>
                        <button 
                            onClick={() => handleThemeChange('pastel')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${user.preferences?.theme === 'pastel' ? 'border-neuro-accent bg-neuro-highlight/20' : 'border-neuro-highlight bg-transparent opacity-60 hover:opacity-100'}`}
                        >
                            <div className="w-full h-12 bg-[#F9F7F2] rounded-lg border border-gray-200"></div>
                            <span className="text-sm font-medium">Cozy (Pastel)</span>
                        </button>
                    </div>
                </div>

                <div className="pt-8 border-t border-neuro-highlight">
                    <h3 className="text-xl font-bold mb-4">NeuroTwin Personality</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <button 
                            onClick={() => handlePersonalityChange('bubbly')}
                            className={`p-4 rounded-xl border text-left transition-all ${user.preferences?.personality === 'bubbly' || !user.preferences?.personality ? 'border-neuro-accent bg-neuro-highlight/20' : 'border-neuro-highlight bg-transparent hover:bg-neuro-highlight/10'}`}
                        >
                            <div className="text-2xl mb-2">✨</div>
                            <p className="font-bold text-sm">Warm & Bubbly</p>
                            <p className="text-xs text-neuro-secondary mt-1">High energy, cheerful, and super friendly bestie vibes.</p>
                        </button>
                         <button 
                            onClick={() => handlePersonalityChange('calm')}
                            className={`p-4 rounded-xl border text-left transition-all ${user.preferences?.personality === 'calm' ? 'border-neuro-accent bg-neuro-highlight/20' : 'border-neuro-highlight bg-transparent hover:bg-neuro-highlight/10'}`}
                        >
                            <div className="text-2xl mb-2">🌿</div>
                            <p className="font-bold text-sm">Calm & Wise</p>
                            <p className="text-xs text-neuro-secondary mt-1">Grounded, slow-paced, soothing, and meditative.</p>
                        </button>
                         <button 
                            onClick={() => handlePersonalityChange('empathetic')}
                            className={`p-4 rounded-xl border text-left transition-all ${user.preferences?.personality === 'empathetic' ? 'border-neuro-accent bg-neuro-highlight/20' : 'border-neuro-highlight bg-transparent hover:bg-neuro-highlight/10'}`}
                        >
                            <div className="text-2xl mb-2">❤️</div>
                            <p className="font-bold text-sm">Deeply Empathetic</p>
                            <p className="text-xs text-neuro-secondary mt-1">Focuses on feelings, validation, and soft gentle support.</p>
                        </button>
                    </div>
                </div>

                <div className="pt-8 border-t border-neuro-highlight">
                    <h3 className="text-xl font-bold mb-4">Accessibility</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Large Text</p>
                                <p className="text-sm text-neuro-secondary">Increase font size for better readability.</p>
                            </div>
                            <button 
                                onClick={() => handleFontSizeChange(user.preferences?.fontSize === 'large' ? 'normal' : 'large')}
                                className={`w-12 h-6 rounded-full relative transition-colors ${user.preferences?.fontSize === 'large' ? 'bg-neuro-accent' : 'bg-neuro-highlight'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-neuro-surface transition-all ${user.preferences?.fontSize === 'large' ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Reduced Motion</p>
                                <p className="text-sm text-neuro-secondary">Minimize animations and floating effects.</p>
                            </div>
                            <button 
                                onClick={() => handleMotionChange(!user.preferences?.reducedMotion)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${user.preferences?.reducedMotion ? 'bg-neuro-accent' : 'bg-neuro-highlight'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-neuro-surface transition-all ${user.preferences?.reducedMotion ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>
                
                 <div className="pt-8 border-t border-neuro-highlight">
                    <h3 className="text-xl font-bold mb-4 text-neuro-rose">Danger Zone</h3>
                     <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-neuro-rose">Clear All Data</p>
                            <p className="text-sm text-neuro-secondary">Delete all chat history and profile data.</p>
                        </div>
                        <button 
                             onClick={() => {
                                 if(confirm("Are you sure? This will delete all your chats and mood history.")) {
                                     localStorage.clear();
                                     window.location.reload();
                                 }
                             }}
                             className="px-4 py-2 border border-neuro-rose text-neuro-rose hover:bg-neuro-rose hover:text-white rounded-lg transition-colors text-sm"
                        >
                            Clear Data
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Profile;