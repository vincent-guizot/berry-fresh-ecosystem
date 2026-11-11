import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { OverviewView } from './views/OverviewView';
import { BatchesFEFOView } from './views/BatchesFEFOView';
import { InventoryView } from './views/InventoryView';
import { POSShiftsView } from './views/POSShiftsView';
import { CatalogView } from './views/CatalogView';
import { ArchitectureView } from './views/ArchitectureView';
import { Bell, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-berry-charcoal">
      {/* Left Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex justify-between items-center select-none shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400">Berry Fresh Enterprise</span>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-extrabold text-berry-charcoal capitalize">
              {activeTab.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-berry-cream rounded-full border border-berry-beige text-xs font-semibold text-berry-charcoal">
              <span className="w-2 h-2 rounded-full bg-berry-green"></span>
              <span>Central Cold Chain: 2.1°C</span>
            </div>

            <button className="p-2 text-gray-400 hover:text-berry-red rounded-xl hover:bg-gray-100 transition relative">
              <Bell className="w-4 h-4" />
              <span className="w-1.5 h-1.5 bg-berry-red rounded-full absolute top-2 right-2"></span>
            </button>
          </div>
        </header>

        {/* Dynamic View Scroll Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && <OverviewView />}
            {activeTab === 'fefo' && <BatchesFEFOView />}
            {activeTab === 'inventory' && <InventoryView />}
            {activeTab === 'pos_shifts' && <POSShiftsView />}
            {activeTab === 'catalog' && <CatalogView />}
            {activeTab === 'architecture' && <ArchitectureView />}
          </div>
        </main>
      </div>
    </div>
  );
}
