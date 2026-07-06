import { useState, useEffect, useCallback } from 'react';

const BASE_ATTEMPTS = 5;
const BASE_LOCK_TIME_MS = 30 * 1000; // 30 seconds for first lockout
const MAX_LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes max

export function useLoginRateLimit(email: string) {
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0); // in seconds

  const storageKey = `login_attempts_${email.toLowerCase()}`;

  const checkLockStatus = useCallback(() => {
    if (!email) {
      setIsLocked(false);
      setLockTimeRemaining(0);
      return;
    }

    try {
      const data = localStorage.getItem(storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.lockUntil && parsed.lockUntil > Date.now()) {
          setIsLocked(true);
          setLockTimeRemaining(Math.ceil((parsed.lockUntil - Date.now()) / 1000));
        } else {
          setIsLocked(false);
          setLockTimeRemaining(0);
          if (parsed.lockUntil) {
             // Lock expired, reset
             localStorage.removeItem(storageKey);
          }
        }
      } else {
        setIsLocked(false);
        setLockTimeRemaining(0);
      }
    } catch {
      setIsLocked(false);
      setLockTimeRemaining(0);
    }
  }, [email, storageKey]);

  useEffect(() => {
    checkLockStatus();
    
    // Setup interval to tick down the lock time if locked
    let interval: NodeJS.Timeout;
    if (isLocked) {
      interval = setInterval(() => {
        checkLockStatus();
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isLocked, checkLockStatus]);

  const recordFailedAttempt = useCallback(() => {
    if (!email) return;
    
    try {
      const data = localStorage.getItem(storageKey);
      let count = 1;
      let lockUntil = null;
      
      if (data) {
        const parsed = JSON.parse(data);
        count = (parsed.count || 0) + 1;
      }
      
      if (count >= BASE_ATTEMPTS) {
        const excessAttempts = count - BASE_ATTEMPTS;
        // Progressive delay: 30s, 60s, 120s, 240s...
        const currentLockMs = BASE_LOCK_TIME_MS * Math.pow(2, Math.min(excessAttempts, 5));
        const finalLockMs = Math.min(currentLockMs, MAX_LOCK_TIME_MS);
        
        lockUntil = Date.now() + finalLockMs;
        setIsLocked(true);
        setLockTimeRemaining(Math.ceil(finalLockMs / 1000));
      }
      
      localStorage.setItem(storageKey, JSON.stringify({ count, lockUntil }));
    } catch (e) {
      console.error('Failed to record attempt', e);
    }
  }, [email, storageKey]);

  const clearAttempts = useCallback(() => {
    if (!email) return;
    localStorage.removeItem(storageKey);
    setIsLocked(false);
    setLockTimeRemaining(0);
  }, [email, storageKey]);

  const formatRemainingTime = () => {
    const minutes = Math.floor(lockTimeRemaining / 60);
    const seconds = lockTimeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    isLocked,
    lockTimeRemaining,
    formatRemainingTime,
    recordFailedAttempt,
    clearAttempts,
  };
}
