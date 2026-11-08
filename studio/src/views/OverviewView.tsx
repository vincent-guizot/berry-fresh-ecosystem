import React from 'react';
import {
  TrendingUp,
  Boxes,
  ThermometerSnowflake,
  AlertOctagon,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export const OverviewView: React.FC = () => {
  const stats = [
    {
      label: "Today's Gross Sales",
      value: 'Rp 28,450,000',
      change: '+14.2%',
      isPositive: true,
      subtext: 'across POS & E-Commerce',
      icon: TrendingUp,
    },
    {
      label: 'Active FEFO Batches',
      value: '18 Lots',
      change: '100% Traceable',
      isPositive: true,
      subtext: 'earliest expiry in 64h',
      icon: Boxes,
    },
    {
      label: 'Cold Hub Storage Temp',
      value: '2.1°C',
      change: 'Optimal Range',
      isPositive: true,
      subtext: 'Target 1.5°C – 3.0°C',
      icon: ThermometerSnowflake,
    },
    {
      label: 'Natural Spoilage & Shrinkage',
      value: '1.24%',
      change: '-0.8% MoM',
      isPositive: true,
      subtext: 'Under 3.0% loss threshold',
      icon: AlertOctagon,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex justify-between items-baseline">
        <div>
          <h2 className="text-xl font-black text-berry-charcoal">Executive Operations Overview</h2>
          <p className="text-xs text-gray-500">Live operational telemetry across farms, warehouse cold chain, and retail stores</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Berry Fresh Core Online
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold text-gray-500">{stat.label}</span>
                <div className="w-8 h-8 rounded-xl bg-berry-cream text-berry-red flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-berry-charcoal font-mono mb-1">
                {stat.value}
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={`font-bold flex items-center ${
                    stat.isPositive ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {stat.change}
                </span>
                <span className="text-gray-400">• {stat.subtext}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales Channel Mix & Outbox Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channel Distribution */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-sm text-berry-charcoal mb-4">Sales Channels Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>RETAIL POS (Physical Stores)</span>
                <span className="font-mono text-berry-red">Rp 19,250,000 (68%)</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-berry-red h-full rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>ECOMMERCE (Berry Fresh Shop)</span>
                <span className="font-mono text-emerald-600">Rp 6,800,000 (24%)</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>MANUAL B2B (Distributor Consignments)</span>
                <span className="font-mono text-amber-600">Rp 2,400,000 (8%)</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-600 h-full rounded-full" style={{ width: '8%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactional Outbox Relay Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-berry-red mb-2">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-sm">Transactional Outbox</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Guarantees zero event loss between PostgreSQL ACID commits and RabbitMQ distribution.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-emerald-50 text-emerald-900 rounded-lg">
                <span>Outbox Dispatch Rate</span>
                <span className="font-mono font-bold">100% Delivered</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 text-gray-700 rounded-lg">
                <span>Active AMQP Queues</span>
                <span className="font-mono font-bold">8 Queues</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 text-gray-700 rounded-lg">
                <span>Dead Letter Queue (DLQ)</span>
                <span className="font-mono font-bold">0 Failed</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
            RabbitMQ Exchange: <code className="text-berry-charcoal font-mono">berryfresh.events</code>
          </div>
        </div>
      </div>
    </div>
  );
};
