"use client";

import { useState, useEffect } from "react";
import { X, Monitor } from "lucide-react";

export default function MobileWarning() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the warning in this session
    // Using sessionStorage so it reappears on page refresh or new tab
    const dismissed = sessionStorage.getItem("mobileWarningDismissed");
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("mobileWarningDismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 lg:hidden animate-in slide-in-from-right duration-300">
      <div className="bg-zinc-900/95 border border-zinc-700 rounded-lg p-3 pr-10 shadow-xl backdrop-blur-sm max-w-[280px]">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-800"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-orange-500/10 rounded-md mt-0.5">
            <Monitor className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-zinc-200 font-medium">
              Best on Desktop
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              For the best experience, please visit us on a desktop device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
