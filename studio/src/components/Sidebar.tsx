import React from 'react';
import {
  LayoutDashboard,
  Clock,
  Boxes,
  Store,
  Layers,
  Database,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'fefo', label: 'Batches & FEFO Clocks', icon: Clock, badge: 'Live' },
    { id: 'inventory', label: 'Stock & Shrinkage', icon: Boxes },
    { id: 'pos_shifts', label: 'POS Shifts & Cash', icon: Store },
    { id: 'catalog', label: 'Master Fruit Catalog', icon: Layers },
    { id: 'architecture', label: '16 Schemas & EDA', icon: Database },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between h-screen select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-berry-red text-white flex items-center justify-center text-xl shadow-md">
            🍓
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-berry-red">BERRY FRESH</h1>
            <p className="text-[11px] font-bold text-berry-green uppercase tracking-wider">
              Studio Operations
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition ${
                  isActive
                    ? 'bg-berry-red text-white shadow-sm'
                    : 'text-berry-charcoal hover:bg-berry-cream hover:text-berry-red'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Operator Account Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-berry-pastel border border-berry-blush flex items-center justify-center text-xs font-bold text-berry-red">
            HW
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-xs text-berry-charcoal truncate">Hendra Wijaya</h5>
            <div className="flex items-center gap-1 text-[10px] text-berry-green font-semibold">
              <ShieldCheck className="w-3 h-3" />
              <span>Enterprise Admin</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
