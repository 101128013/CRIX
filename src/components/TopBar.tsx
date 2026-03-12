import React, { useState, useEffect } from 'react';
import { Settings2, MessageSquare, Database } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useProgress } from '../context/ProgressContext';
import { auth, onAuthStateChanged } from '../services/firebase';
import { User, signOut } from 'firebase/auth';

export default function TopBar() {
  const { settings, setIsSettingsOpen } = useSettings();
  const { totalImages } = useProgress();
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  return (
    <div className="flex flex-col bg-industrial-ink/95 backdrop-blur-xl border-b border-industrial-line font-mono text-[10px] uppercase tracking-widest text-industrial-grey z-50">
      {/* Top Row: User & Config */}
      <div className="h-8 flex items-center justify-between px-4 border-b border-industrial-line/30">
        <div className="flex items-center gap-4 h-full">
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-industrial-grey/20 overflow-hidden border border-industrial-line/30">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[6px]">{user.email?.[0].toUpperCase()}</div>
                )}
              </div>
              <span className="text-industrial-bg/70 lowercase truncate max-w-[150px]">{user.email}</span>
              <button 
                onClick={handleSignOut}
                className="hover:text-red-400 transition-colors uppercase text-[8px] tracking-tighter"
              >
                [Sign Out]
              </button>
            </div>
          )}
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(true); }}
          className="flex items-center gap-2 h-full hover:text-industrial-bg transition-colors"
        >
          <span>Config</span>
          <Settings2 className="w-3 h-3" />
        </button>
      </div>

      {/* Bottom Row: Stats */}
      <div className="h-8 flex items-center gap-6 px-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3 h-3" />
          <span>LLM Chat: {settings.chatModel}</span>
        </div>
        <div className="flex items-center gap-2">
          <Database className="w-3 h-3" />
          <span>Prompts: {totalImages} / Page</span>
        </div>
      </div>
    </div>
  );
}
