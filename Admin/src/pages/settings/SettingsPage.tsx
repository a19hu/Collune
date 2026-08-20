import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Sliders,
  DollarSign,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PermissionGuard } from '../../components/permissions/PermissionGuard';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const SettingsPage: React.FC = () => {
  const { logAdminAction } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'general' | 'fees' | 'security' | 'notifications'>('general');

  // Form states
  const [platformName, setPlatformName] = useState('Collune Influencer Marketing');
  const [supportEmail, setSupportEmail] = useState('support@collune.com');
  const [currency, setCurrency] = useState('INR (₹)');
  const [platformCommission, setPlatformCommission] = useState(15);
  const [minPayout, setMinPayout] = useState(5000);
  const [autoApproveVerified, setAutoApproveVerified] = useState(true);
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(60);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [emailAlertsOnKYC, setEmailAlertsOnKYC] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      await logAdminAction(
        'UPDATE',
        'Settings',
        `Updated platform global configuration (Commission: ${platformCommission}%, Min Payout: ₹${minPayout})`
      );
      success('Settings Saved', 'Platform configuration successfully updated.');
    } catch (err: any) {
      error('Failed to save settings', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMaintenance = () => {
    setMaintenanceMode(!maintenanceMode);
    setIsMaintenanceModalOpen(false);
    logAdminAction(
      'UPDATE',
      'Settings',
      `${!maintenanceMode ? 'Enabled' : 'Disabled'} Maintenance Mode`
    );
    success(
      'Maintenance Mode',
      `Maintenance mode is now ${!maintenanceMode ? 'ACTIVE' : 'OFF'}.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Platform Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure marketplace commission rates, authentication rules, and automated workflow triggers.
          </p>
        </div>

        <PermissionGuard permission="settings.edit">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </PermissionGuard>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'general'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>General Platform</span>
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'fees'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Commission & Payouts</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'security'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security & Access</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Automated Alerts</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Platform Display Brand Name
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  System Support Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Default Accounting Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  <option value="INR (₹)">Indian Rupee - INR (₹)</option>
                  <option value="USD ($)">United States Dollar - USD ($)</option>
                  <option value="EUR (€)">Euro - EUR (€)</option>
                  <option value="AED (د.إ)">UAE Dirham - AED (د.إ)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Auto-Approve Verified Creators
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Automatically allow verified KYC creators to bid on campaigns without manual moderation.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoApproveVerified}
                    onChange={(e) => setAutoApproveVerified(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Collune Marketplace Take Rate (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={platformCommission}
                    onChange={(e) => setPlatformCommission(Number(e.target.value))}
                    className="w-32 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-mono font-bold"
                  />
                  <span className="text-xs text-slate-500">
                    Platform commission retained on every completed brand-creator milestone payout.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Minimum Creator Payout Threshold (INR ₹)
                </label>
                <input
                  type="number"
                  min={500}
                  step={500}
                  value={minPayout}
                  onChange={(e) => setMinPayout(Number(e.target.value))}
                  className="w-44 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-mono font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Creators must accumulate at least this balance before requesting a bank wire payout.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Enforce Two-Factor Authentication (2FA)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Require TOTP authentication for all staff members with Admin or Manager roles.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enforce2FA}
                  onChange={(e) => setEnforce2FA(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Session Inactivity Timeout (Minutes)
                </label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  value={sessionTimeoutMinutes}
                  onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                  className="w-32 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Emergency Maintenance Mode</span>
                    </div>
                    <div className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                      Temporarily lock public frontend portals (Creators & Brands) while maintaining Admin Dashboard access.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMaintenanceModalOpen(true)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                      maintenanceMode
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                    }`}
                  >
                    {maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Creator KYC Submission Alerts
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Send real-time webhook notices to the compliance team when new ID proofs are submitted.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlertsOnKYC}
                  onChange={(e) => setEmailAlertsOnKYC(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Daily Executive Performance Digest
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Dispatch daily morning summaries of GMV, new brand budgets, and influencer payouts.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={dailyDigest}
                  onChange={(e) => setDailyDigest(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Maintenance Mode Confirmation */}
      <ConfirmDialog
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        onConfirm={handleToggleMaintenance}
        title={`${!maintenanceMode ? 'Enable' : 'Disable'} Platform Maintenance Mode?`}
        description={
          !maintenanceMode
            ? 'This will prevent creators and brands from accessing marketplace campaigns until disabled.'
            : 'Marketplace portals will be restored to normal operation immediately.'
        }
        confirmText={!maintenanceMode ? 'Activate Maintenance' : 'Disable Maintenance'}
        variant={!maintenanceMode ? 'danger' : 'primary'}
      />
    </div>
  );
};
