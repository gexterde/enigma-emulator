import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTheme, useTheme } from '../lib/theme';

interface LoginModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, isOpen }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [callSign, setCallSign] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const { theme } = useTheme();
  const t = getTheme(theme);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(email, password, callSign);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className={`${t.modalBg} border ${t.borderBase} rounded-lg p-6 w-full max-w-sm shadow-2xl relative`}>
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 ${t.textMuted} hover:${t.textPrimary} transition-colors`}
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className={`${t.textPrimary} text-xl font-bold mb-6 ${t.fontHeader} flex items-center gap-2`}>
          <span className={`material-symbols-outlined ${t.textAccent}`}>
            lock
          </span>
          {isRegister ? 'Operator Registration' : 'Operator Login'}
        </h2>

        {error && (
          <div className={`mb-4 p-3 rounded ${t.dangerBadge} text-xs font-bold`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${t.textSecondary}`}>
              Operator Designation (Email or Call Sign)
            </label>
            <input 
              type="text" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`w-full ${t.inputBg} border ${t.borderBase} rounded p-2 text-sm ${t.textPrimary} focus:outline-none focus:border-opacity-100 transition-colors`}
            />
          </div>
          
          {isRegister && (
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${t.textSecondary}`}>
                Sender Call Sign (Optional)
              </label>
              <input 
                type="text" 
                maxLength={5}
                value={callSign}
                onChange={e => setCallSign(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="DFS"
                className={`w-full ${t.inputBg} border ${t.borderBase} rounded p-2 text-sm ${t.textPrimary} focus:outline-none focus:border-opacity-100 transition-colors`}
              />
            </div>
          )}
<div>
            <label className={`block text-xs font-bold mb-1.5 ${t.textSecondary}`}>
              Passphrase
            </label>
            <input 
              type="password" 
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`w-full ${t.inputBg} border ${t.borderBase} rounded p-2 text-sm ${t.textPrimary} focus:outline-none focus:border-opacity-100 transition-colors`}
            />
          </div>

          <button
            type="submit"
            className={`w-full mt-4 py-2.5 rounded font-bold transition-all ${t.buttonPrimary}`}
          >
            {isRegister ? 'Establish Credentials' : 'Authenticate'}
          </button>
        </form>

        <div className={`mt-6 border-t border-dashed ${t.borderBase} pt-4 flex flex-col gap-3`}>
          {/* Mock Google Login - if we had real client ID we'd render the Google button here */}
          <button
            type="button"
            className={`w-full py-2 rounded font-bold text-sm flex items-center justify-center gap-2 ${t.buttonMuted}`}
            onClick={() => alert("Google Identity Services SDK requires Client ID configuration via platform settings.")}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/>
            </svg>
            Sign in with Google
          </button>

          <button 
            type="button"
            onClick={() => {
              if (!email) {
                setError('Please enter your email address to request a password reset.');
                return;
              }
              alert(`Password reset functionality requires SMTP configuration. In a production environment, an email would be sent to ${email} with a reset token.`);
            }}
            className={`text-xs text-center ${t.textMuted} hover:${t.textPrimary} hover:underline transition-all block w-full`}
          >
            Forgot passphrase?
          </button>

          <button 
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className={`text-xs text-center ${t.textMuted} hover:${t.textPrimary} hover:underline transition-all block w-full mt-2`}
          >
            {isRegister ? 'Already have credentials? Authenticate' : 'Request new credentials? Register'}
          </button>
        </div>
      </div>
    </div>
  );
};
