import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { logToSystem } from '../utils/logger';

interface ImageRecord {
  id: string;
  prompt: string;
  model: string;
  imageUrl: string;
  timestamp: string;
  type: 'generate' | 'edit' | 'multi-edit';
  settings: string;
}

interface HistoryContextType {
  history: ImageRecord[];
  loading: boolean;
  addRecord: (record: ImageRecord) => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const path = `users/${auth.currentUser.uid}/history`;
    const q = query(
      collection(db, path),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: ImageRecord[] = [];
      snapshot.forEach((doc) => {
        records.push(doc.data() as ImageRecord);
      });
      setHistory(records);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const addRecord = async (record: ImageRecord) => {
    if (!auth.currentUser) return;

    const path = `users/${auth.currentUser.uid}/history/${record.id}`;
    try {
      const docRef = doc(db, path);
      await setDoc(docRef, {
        ...record,
        userId: auth.currentUser.uid,
        timestamp: record.timestamp || new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  return (
    <HistoryContext.Provider value={{ history, loading, addRecord }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}
