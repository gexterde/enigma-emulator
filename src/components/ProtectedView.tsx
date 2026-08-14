import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTheme, useTheme } from '../lib/theme';

interface ProtectedViewProps {
  children: React.ReactNode;
  onRequireLogin: () => void;
  title: string;
}

export const ProtectedView: React.FC<ProtectedViewProps> = ({ children, onRequireLogin, title }) => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const t = getTheme(theme);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className={`material-symbols-outlined animate-spin text-4xl ${t.textMuted}`}>settings</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
        <span className={`material-symbols-outlined text-6xl ${t.textAccent} mb-4`}>lock</span>
        <h2 className={`text-2xl font-bold ${t.fontHeader} ${t.textPrimary} mb-2`}>
          Restricted Frequency: {title}
        </h2>
        <p className={`${t.textSecondary} mb-6 max-w-md`}>
          This section requires active operator credentials. Please authenticate to access secure state synchronization and advanced modules.
        </p>
        <button
          onClick={onRequireLogin}
          className={`${t.buttonPrimary} px-6 py-2 rounded font-bold uppercase tracking-wider text-sm flex items-center gap-2`}
        >
          <span className="material-symbols-outlined text-sm">login</span>
          Authenticate
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
