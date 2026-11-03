import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Boxes,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Sliders,
  Package,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SignupPage: React.FC = () => {
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({
        organizationName,
        email,
        password,
        confirmPassword,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create organization account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80 flex">
      {/* LEFT COLUMN: Clean Professional Platform Capabilities (No mock live data) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-50/90 border-r border-slate-200/90 p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#0f172a 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900">StockFlow</span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                MVP
              </span>
            </div>
            <p className="text-xs text-slate-500">SaaS Inventory Management System</p>
          </div>
        </div>

        {/* Center: Store Setup & Platform Architecture */}
        <div className="relative z-10 my-auto py-8 max-w-lg space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-snug">
              Deploy your dedicated store inventory workspace.
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every organization receives an isolated database partition with custom low-stock alert thresholds, SKU collision prevention, and stock audit trails.
            </p>
          </div>

          {/* Clean Enterprise Feature Architecture */}
          <div className="space-y-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Dedicated Organization Workspace</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Automatic provisioning creates an isolated organizational boundary ensuring complete data segregation from other stores.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">SKU Uniqueness & Scoping</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Freedom to use your internal catalog SKUs without naming collisions, enforced with database-level composite unique constraints.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Configurable Alert Rules</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Set a store-wide default threshold buffer or customize individual products to maintain healthy inventory turnover.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 pt-4 border-t border-slate-200 text-xs text-slate-400 flex items-center justify-between">
          <span>StockFlow Platform v0.1</span>
          <span>Enterprise Tenant Security</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Clean, Professional Sign-Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header (hidden on large desktop) */}
          <div className="lg:hidden text-center mb-4">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Boxes className="w-6 h-6" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">StockFlow</span>
            </div>
            <p className="text-xs text-slate-500">SaaS Inventory Management</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Create your organization
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Set up your store workspace and start managing inventory
            </p>
          </div>

          {/* Clean Dashboard-style Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Organization Details</span>
              <span className="text-[11px] font-normal text-slate-400">Scoped Database</span>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Organization / Store Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Hardware"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-slate-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Owner Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="owner@yourstore.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-slate-400 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-9 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-slate-400 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-slate-400 transition"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Password must be at least 6 characters long.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50 mt-1"
                >
                  {isSubmitting ? 'Creating organization...' : 'Create Account & Launch'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Footer Link */}
          <p className="text-center text-xs text-slate-500">
            Already have an organization?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
