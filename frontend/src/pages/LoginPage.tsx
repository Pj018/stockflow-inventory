import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Boxes,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  Package,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('demo@stockflow.com');
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 flex">
      {/* LEFT COLUMN: Clean Professional Product Showcase (Inventory Specific) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-50/90 border-r border-slate-200/90 p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background grid pattern */}
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

        {/* Center: Inventory Dashboard Preview Card */}
        <div className="relative z-10 my-auto py-6 max-w-lg space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-snug">
              Smart inventory control designed for growing commerce.
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Track stock levels, prevent stockouts with automated threshold alerts, and manage product catalogs with strict organization data scoping.
            </p>
          </div>

          {/* Realistic Inventory Preview Mock Widget */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-800">Acme Supply Co.</span>
                <span className="text-[11px] text-slate-400 font-mono">Store Catalog</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Live Synced</span>
            </div>

            {/* Mini KPIs */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Catalog</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">6 SKUs</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">In Stock</p>
                <p className="text-base font-bold text-blue-700 mt-0.5">189 Units</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
                <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Alerts</p>
                <p className="text-base font-bold text-amber-800 mt-0.5">3 Low</p>
              </div>
            </div>

            {/* Mini Stock Rows */}
            <div className="space-y-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50/60 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Mechanical Gaming Keyboard</p>
                  <p className="text-[11px] text-slate-400 font-mono">TECH-KBD-02</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="font-bold text-slate-800">4 units</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[10px] border border-amber-200">
                    Low Stock
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50/60 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Wireless Ergonomic Mouse</p>
                  <p className="text-[11px] text-slate-400 font-mono">TECH-MSE-01</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="font-bold text-slate-800">45 units</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px] border border-emerald-200">
                    Healthy
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Checklist */}
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 pt-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Multi-Tenant Data Isolation</span>
            </div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Custom Alert Thresholds</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Scoped SKU Cataloging</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Stock Adjustment Logs</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 pt-4 border-t border-slate-200 text-xs text-slate-400 flex items-center justify-between">
          <span>StockFlow Platform v0.1</span>
          <span>Enterprise Tenant Security</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Clean, Professional Sign-In Form */}
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
              Sign in to your account
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your credentials to access your store inventory dashboard
            </p>
          </div>

          {/* Clean Dashboard-style Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Account Credentials</span>
              <span className="text-[11px] font-normal text-slate-400">Owner Access</span>
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
                    Email address
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-slate-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50 mt-1"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In to Dashboard'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Demo Preloaded Store Box */}
              <div className="pt-3 border-t border-slate-100">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Preloaded Demo Store</p>
                      <p className="text-[11px] text-slate-500 font-mono">demo@stockflow.com</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fillDemoAccount}
                    className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-xs transition"
                  >
                    Auto-fill
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <p className="text-center text-xs text-slate-500">
            Need an organization workspace?{' '}
            <Link
              to="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              Create new organization
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
