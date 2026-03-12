/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import HorizontalGallery from "./components/HorizontalGallery";
import TopBar from "./components/TopBar";
import Footer from "./components/Footer";
import { ProgressProvider } from "./context/ProgressContext";
import { HistoryProvider } from "./context/HistoryContext";
import { SelectionProvider } from "./context/SelectionContext";
import { useSettings } from "./context/SettingsContext";
import { auth, signInWithGoogle, onAuthStateChanged } from "./services/firebase";
import { User } from "firebase/auth";
import { LogIn } from "lucide-react";

import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const { settings } = useSettings();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-industrial-ink flex items-center justify-center">
        <div className="text-industrial-bg font-mono text-xs animate-pulse">INITIALIZING SECURE SESSION...</div>
      </div>
    );
  }

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        alert('Popup was blocked. Please allow popups for this site to sign in.');
      } else {
        alert(`Error signing in: ${error.message}`);
      }
    }
  };

  if (!user) {
    return (
      <div className="h-screen w-screen bg-industrial-ink flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-industrial-bg font-display text-4xl tracking-tighter uppercase">CRIX & JAKOB</h1>
          <p className="text-industrial-grey font-mono text-[10px] tracking-[0.2em] uppercase">Secure Access Required</p>
        </div>
        <button 
          onClick={handleSignIn}
          className="group flex items-center gap-3 bg-industrial-bg text-industrial-ink px-6 py-3 rounded-none hover:bg-white transition-all active:scale-95"
        >
          <LogIn className="w-4 h-4" />
          <span className="font-mono text-xs font-bold tracking-widest uppercase">Authenticate with Google</span>
        </button>
      </div>
    );
  }

  return (
    <HistoryProvider>
      <ProgressProvider totalImages={40}>
        <SelectionProvider>
          <main className="antialiased h-screen w-screen flex flex-col overflow-hidden">
            {settings.showStatusBar && (
              <TopBar />
            )}
            <div className="flex-1 relative overflow-hidden">
              <HorizontalGallery />
            </div>
            {settings.showStatusBar && (
              <Footer />
            )}
          </main>
        </SelectionProvider>
      </ProgressProvider>
    </HistoryProvider>
  );
}


