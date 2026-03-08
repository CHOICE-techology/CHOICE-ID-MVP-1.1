import React, { useState, useEffect, useCallback } from 'react';

interface RewardNotification {
  id: string;
  amount: number;
  label?: string;
}

// Singleton event bus for reward notifications
type Listener = (notification: RewardNotification) => void;
const listeners = new Set<Listener>();

export const triggerRewardAnimation = (amount: number, label?: string) => {
  const notification: RewardNotification = {
    id: `reward-${Date.now()}-${Math.random()}`,
    amount,
    label,
  };
  listeners.forEach((fn) => fn(notification));
};

export const RewardAnimationOverlay: React.FC = () => {
  const [notifications, setNotifications] = useState<RewardNotification[]>([]);

  useEffect(() => {
    const handler: Listener = (notif) => {
      setNotifications((prev) => [...prev, notif]);
      // Auto-remove after animation
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      }, 2500);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-24 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto animate-reward-popup"
        >
          <div className="bg-[hsl(var(--dark))] border border-primary/30 rounded-2xl px-5 py-3 shadow-2xl shadow-primary/20 flex items-center gap-3 backdrop-blur-xl">
            <span className="text-primary text-xl font-black">◈</span>
            <div>
              <span className="text-primary font-black text-lg tracking-tight">+{notif.amount} CHOICE</span>
              {notif.label && (
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{notif.label}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
