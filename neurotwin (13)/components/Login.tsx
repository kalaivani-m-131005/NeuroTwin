import React, { useState } from 'react';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 2) {
      setError('Name is too short.');
      return;
    }
    if (password.length < 4) {
      setError('Password is too short.');
      return;
    }
    onLogin(name);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-neuro-base p-4 relative overflow-hidden">
        
        {/* Subtle Background Gradient */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-neuro-gradientStart/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-neuro-gradientMid/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-[350px] space-y-8 animate-fade-in-up z-10">
            
            <div className="text-center space-y-2">
                <h1 className="text-5xl font-bold tracking-tighter bg-gradient-to-tr from-neuro-gradientStart via-neuro-gradientMid to-neuro-gradientEnd bg-clip-text text-transparent pb-2">
                    NeuroTwin
                </h1>
                <p className="text-neuro-secondary text-sm font-medium">Connect with your emotional self.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Username"
                        className="w-full bg-neuro-surface border border-neuro-highlight rounded-md px-4 py-3 text-white placeholder-neuro-secondary text-sm focus:border-neuro-secondary outline-none transition-all"
                    />

                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full bg-neuro-surface border border-neuro-highlight rounded-md px-4 py-3 text-white placeholder-neuro-secondary text-sm focus:border-neuro-secondary outline-none transition-all pr-10"
                        />
                         <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neuro-secondary hover:text-white transition-colors"
                        >
                            {showPassword ? (
                                <span className="text-xs font-bold">Hide</span>
                            ) : (
                                <span className="text-xs font-bold">Show</span>
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <p className="text-neuro-rose text-xs text-center">{error}</p>
                )}

                <button
                    type="submit"
                    className="w-full bg-neuro-accent hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-[0.98]"
                >
                    Log In
                </button>
            </form>
            
            <div className="flex items-center gap-4 w-full opacity-60">
                 <div className="h-px bg-neuro-highlight flex-1"></div>
                 <span className="text-xs text-neuro-secondary font-bold uppercase">Or</span>
                 <div className="h-px bg-neuro-highlight flex-1"></div>
            </div>

            <p className="text-center text-xs text-neuro-secondary">
                Don't have an account? <span className="text-neuro-accent cursor-pointer hover:underline">Sign up</span>
            </p>
        </div>
    </div>
  );
};

export default Login;