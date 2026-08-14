import React, { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTheme, useTheme } from '../lib/theme';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const t = getTheme(theme);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<{id: string, email: string, isAdmin: boolean, createdAt: string}[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/admin/users', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Delete user ${email}? This cannot be undone.`)) {
      return;
    }
    
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/auth/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      setStatus({ type: 'success', message: 'User deleted successfully' });
      fetchUsers();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Delete failed' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Download backup
  const handleExport = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/auth/admin/export', {
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enigma-backup-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus({ type: 'success', message: 'Backup downloaded successfully' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Export failed' });
    } finally {
      setLoading(false);
    }
  };

  // Upload backup
  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.append('backup', file);
      
      const res = await fetch('/api/auth/admin/import', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      
      setStatus({ type: 'success', message: 'Backup restored successfully. Reloading...' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Import failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className={`${t.modalBg} border ${t.borderBase} rounded-lg p-6 w-full max-w-md shadow-2xl relative`}>
        <button onClick={onClose} className={`absolute top-4 right-4 ${t.textMuted} hover:${t.textPrimary}`}>
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className={`${t.textPrimary} text-xl font-bold mb-6 ${t.fontHeader} flex items-center gap-2`}>
          <span className={`material-symbols-outlined ${t.textAccent}`}>settings_backup_restore</span>
          Database Admin
        </h2>

        {/* Export section */}
        <div className={`p-4 rounded-lg border ${t.borderBase} mb-4`}>
          <h3 className={`${t.textPrimary} font-bold mb-1`}>Export Database</h3>
          <p className={`text-xs ${t.textSecondary} mb-3`}>
            Download all user data and settings as a ZIP backup.
          </p>
          <button
            onClick={handleExport}
            disabled={loading}
            className={`w-full py-2 rounded font-bold transition-all ${t.buttonPrimary} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">download</span>
              Download Backup
            </span>
          </button>
        </div>

        {/* Import section */}
        <div className={`p-4 rounded-lg border ${t.borderBase} mb-4`}>
          <h3 className={`${t.textPrimary} font-bold mb-1`}>Import Database</h3>
          <p className={`text-xs ${t.textSecondary} mb-3`}>
            Restore from a ZIP backup. This will overwrite current data.
          </p>
          <label className={`w-full py-2 rounded font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${t.buttonMuted}`}>
            <span className="material-symbols-outlined text-sm">upload</span>
            Upload Backup
            <input
              type="file"
              accept=".zip"
              onChange={handleImport}
              disabled={loading}
              className="hidden"
            />
          </label>
        </div>

        {/* Status message */}
        {status && (
          <div className={`p-3 rounded text-xs font-bold mb-4 ${
            status.type === 'success' 
              ? t.successBadge 
              : t.dangerBadge
          }`}>
            {status.message}
          </div>
        )}

        {/* User Management section */}
        <div className={`p-4 rounded-lg border ${t.borderBase}`}>
          <h3 className={`${t.textPrimary} font-bold mb-3`}>User Management</h3>
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-sm ${t.textSecondary}`}>
              <thead>
                <tr className={`border-b ${t.borderBase} ${t.textMuted}`}>
                  <th className="py-2 pr-2 font-medium">Email</th>
                  <th className="py-2 px-2 font-medium">Role</th>
                  <th className="py-2 px-2 font-medium">Created</th>
                  <th className="py-2 pl-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={`border-b ${t.borderBase} last:border-0`}>
                    <td className="py-3 pr-2 truncate max-w-[140px]" title={u.email}>{u.email}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        u.isAdmin ? t.accentLightBg : `${t.panelInner} ${t.textMuted}`
                      }`}>
                        {u.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap text-xs">
                      {new Date(u.createdAt).toISOString().split('T')[0]}
                    </td>
                    <td className="py-3 pl-2 text-right">
                      {user?.id !== u.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          disabled={loading}
                          className={`${t.dangerText} hover:opacity-80 transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50`}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-xs italic">Loading users...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
