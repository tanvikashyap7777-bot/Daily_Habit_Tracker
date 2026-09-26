import { useEffect, useRef, useCallback } from 'react';

export type MobileTab = 'today' | 'calendar' | 'analytics' | 'habits' | 'all';

interface UseBackButtonProps {
  isModalOpen: boolean;
  onCloseModal: () => void;
  detailHabit: any | null;
  onCloseDetail: () => void;
  mobileTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
}

export function useBackButton({
  isModalOpen,
  onCloseModal,
  detailHabit,
  onCloseDetail,
  mobileTab,
  onSelectTab,
}: UseBackButtonProps) {
  const stateRef = useRef({
    isModalOpen,
    detailHabit,
    mobileTab,
  });

  stateRef.current = {
    isModalOpen,
    detailHabit,
    mobileTab,
  };

  const ignoreNextPopState = useRef(false);

  // Initialize root history state on mount
  useEffect(() => {
    try {
      if (!window.history.state || !window.history.state.habitTracker) {
        window.history.replaceState({ habitTracker: true, view: 'root', tab: 'today' }, '');
      }
    } catch {
      // Graceful fallback for restricted environments
    }
  }, []);

  // Helper functions to manage history state when opening/closing
  const pushModalHistory = useCallback((type: 'modal' | 'detail') => {
    try {
      window.history.pushState({ habitTracker: true, view: type }, '');
    } catch {
      // Fallback
    }
  }, []);

  const closeModalWithHistory = useCallback(() => {
    if (stateRef.current.isModalOpen) {
      onCloseModal();
      if (window.history.state?.view === 'modal') {
        ignoreNextPopState.current = true;
        window.history.back();
      }
    }
  }, [onCloseModal]);

  const closeDetailWithHistory = useCallback(() => {
    if (stateRef.current.detailHabit) {
      onCloseDetail();
      if (window.history.state?.view === 'detail') {
        ignoreNextPopState.current = true;
        window.history.back();
      }
    }
  }, [onCloseDetail]);

  const switchTabWithHistory = useCallback(
    (newTab: MobileTab) => {
      if (newTab === stateRef.current.mobileTab) return;
      try {
        if (newTab !== 'today') {
          window.history.pushState({ habitTracker: true, view: 'tab', tab: newTab }, '');
        }
      } catch {
        // Fallback
      }
      onSelectTab(newTab);
    },
    [onSelectTab]
  );

  // 1. Listen for browser / WebView popstate event (Hardware Back or Browser Back)
  useEffect(() => {
    const handlePopState = () => {
      if (ignoreNextPopState.current) {
        ignoreNextPopState.current = false;
        return;
      }

      const { isModalOpen: modalOpen, detailHabit: detailOpen, mobileTab: currentTab } = stateRef.current;

      // Priority 1: Close Add/Edit Modal
      if (modalOpen) {
        onCloseModal();
        return;
      }

      // Priority 2: Close Detail Modal
      if (detailOpen) {
        onCloseDetail();
        return;
      }

      // Priority 3: Return to Today tab if on another tab
      if (currentTab !== 'today') {
        onSelectTab('today');
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onCloseModal, onCloseDetail, onSelectTab]);

  // 2. Listen for native Android Capacitor back button events
  useEffect(() => {
    const handleNativeBack = (e: Event) => {
      const { isModalOpen: modalOpen, detailHabit: detailOpen, mobileTab: currentTab } = stateRef.current;

      if (modalOpen) {
        e.preventDefault();
        e.stopPropagation();
        closeModalWithHistory();
        return;
      }

      if (detailOpen) {
        e.preventDefault();
        e.stopPropagation();
        closeDetailWithHistory();
        return;
      }

      if (currentTab !== 'today') {
        e.preventDefault();
        e.stopPropagation();
        onSelectTab('today');
        return;
      }
    };

    document.addEventListener('backButton', handleNativeBack);
    document.addEventListener('ionBackButton', handleNativeBack);

    // 3. Listen via Capacitor App plugin if available at runtime
    let removeCapListener: (() => void) | null = null;
    try {
      const capGlobal = (window as unknown as { Capacitor?: { Plugins?: { App?: any } } })?.Capacitor;
      const CapApp = capGlobal?.Plugins?.App;

      if (CapApp && typeof CapApp.addListener === 'function') {
        const handlePromise = CapApp.addListener('backButton', () => {
          const { isModalOpen: modalOpen, detailHabit: detailOpen, mobileTab: currentTab } = stateRef.current;
          if (modalOpen) {
            closeModalWithHistory();
          } else if (detailOpen) {
            closeDetailWithHistory();
          } else if (currentTab !== 'today') {
            onSelectTab('today');
          } else if (typeof CapApp.exitApp === 'function') {
            // At root: exit or minimize app on Android
            CapApp.exitApp();
          }
        });

        if (handlePromise && typeof handlePromise.then === 'function') {
          handlePromise.then((handle: { remove?: () => void }) => {
            if (handle && typeof handle.remove === 'function') {
              const rem = handle.remove;
              removeCapListener = () => {
                rem.call(handle);
              };
            }
          });
        }
      }
    } catch {
      // Fallback handles it
    }

    return () => {
      document.removeEventListener('backButton', handleNativeBack);
      document.removeEventListener('ionBackButton', handleNativeBack);
      if (removeCapListener) {
        removeCapListener();
      }
    };
  }, [closeModalWithHistory, closeDetailWithHistory, onSelectTab]);

  return {
    pushModalHistory,
    closeModalWithHistory,
    closeDetailWithHistory,
    switchTabWithHistory,
  };
}
