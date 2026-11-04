import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Boxes,
  LayoutDashboard,
  Package,
  Sliders,
  LogOut,
  Building2,
  User as UserIcon,
  ShoppingCart,
  Receipt,
  Truck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'POS Counter', path: '/pos', icon: ShoppingCart, badge: 'POS' },
    { name: 'Sales & Invoices', path: '/orders', icon: Receipt },
    { name: 'Suppliers', path: '/suppliers', icon: Truck },
    { name: 'Settings', path: '/settings', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-slate-900">StockFlow</span>
                <span className="ml-1 text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  PRO
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-600 text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right Header: Tenant & User Profile */}
          <div className="flex items-center gap-4">
            {/* Multi-Tenant Organization Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200/80 rounded-xl text-xs">
              <Building2 className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-slate-400">Store: </span>
                <span className="font-bold text-slate-800">{organization?.name || 'My Store'}</span>
              </div>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {user?.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <span className="font-medium text-slate-700">{user?.email}</span>
              </div>

              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden border-t border-slate-100 px-2 py-2 flex items-center justify-around bg-slate-50/50 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${
                  isActive
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="truncate">{item.name.split(' ')[0]}</span>
              </NavLink>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        StockFlow Enterprise SaaS • Point of Sale & Inventory Platform • Multi-Tenant Architecture
      </footer>
    </div>
  );
};
