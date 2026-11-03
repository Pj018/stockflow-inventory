import React, { useState, useEffect } from 'react';
import { Sliders, Building2, Save, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user, organization, updateOrganization } = useAuth();

  const [threshold, setThreshold] = useState<number>(5);
  const [orgName, setOrgName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ threshold?: string; orgName?: string }>({});

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const res = await api.getSettings();
        if (res.success && res.data) {
          setThreshold(res.data.defaultLowStockThreshold);
          setOrgName(res.data.name);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setFieldErrors({});

    const newErrors: typeof fieldErrors = {};

    if (threshold < 0 || isNaN(threshold)) {
      newErrors.threshold = 'Default low stock threshold cannot be negative.';
    }

    const trimmedOrg = orgName.trim();
    if (!trimmedOrg) {
      newErrors.orgName = 'Organization name cannot be empty.';
    } else if (trimmedOrg.length < 2) {
      newErrors.orgName = 'Organization name must be at least 2 characters.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setErrorMsg(newErrors.threshold || newErrors.orgName || 'Please resolve the highlighted errors.');
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.updateSettings({
        defaultLowStockThreshold: threshold,
        name: trimmedOrg,
      });

      if (res.success) {
        updateOrganization({
          defaultLowStockThreshold: threshold,
          name: trimmedOrg,
        });
        setSuccessMsg('Settings updated successfully!');
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Organization Settings
        </h1>
        <p className="text-sm text-slate-500">
          Configure default inventory alert rules and store profile
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} noValidate className="space-y-6">
        {/* Global Inventory Alert Settings (FR-7) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Global Inventory Alert Rules</h2>
              <p className="text-xs text-slate-500">
                Applied to all products that do not specify a custom threshold
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Low Stock Threshold (Units) <span className="text-rose-500">*</span>
              </label>
              <div className="max-w-xs">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={threshold}
                  onChange={(e) => {
                    setThreshold(parseInt(e.target.value, 10) || 0);
                    if (fieldErrors.threshold) setFieldErrors((p) => ({ ...p, threshold: undefined }));
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition ${
                    fieldErrors.threshold
                      ? 'border border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500'
                      : 'border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {fieldErrors.threshold && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.threshold}</p>
                )}
              </div>
              <div className="mt-2 flex items-start gap-2 text-xs text-slate-500">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  Any product with quantity &le; this number will automatically trigger a Low Stock
                  warning on your Dashboard and catalog, unless overridden on the individual product.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Store Profile & Multi-Tenancy</h2>
              <p className="text-xs text-slate-500">
                Data isolation details and organization credentials
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Organization / Store Display Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => {
                  setOrgName(e.target.value);
                  if (fieldErrors.orgName) setFieldErrors((p) => ({ ...p, orgName: undefined }));
                  if (errorMsg) setErrorMsg(null);
                }}
                className={`w-full max-w-md px-3.5 py-2.5 text-sm rounded-xl outline-none transition ${
                  fieldErrors.orgName
                    ? 'border border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500'
                    : 'border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {fieldErrors.orgName && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.orgName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Tenant Organization ID
                </span>
                <span className="text-xs font-mono font-semibold text-slate-700 break-all">
                  {organization?.id || '—'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Owner Account Email
                </span>
                <span className="text-xs font-medium text-slate-700">{user?.email || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
