import { useEffect } from 'react';
import { useChoiceStore } from '@/store/useChoiceStore';
import { getChoiceBalance } from '@/services/rewardService';

/**
 * Listens for CHOICE reward updates and syncs balance to store.
 * Replaces broken PGlite reputation_journal polling with event-driven updates.
 */
export const useVaultListener = () => {
  useEffect(() => {
    const address = useChoiceStore.getState().address;
    if (!address) return;

    const refresh = async () => {
      const balance = await getChoiceBalance(address);
      const currentBalance = useChoiceStore.getState().choiceBalance;
      if (balance !== currentBalance) {
        useChoiceStore.getState().setConnectionState({ choiceBalance: balance });
      }
    };

    refresh();
    window.addEventListener('choice-rewards-updated', refresh);
    return () => window.removeEventListener('choice-rewards-updated', refresh);
  }, []);
};
