import React from 'react';
import { Database, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const schemas = [
    { num: '01', name: 'identity', desc: 'Users, credentials, sessions, RBAC permissions, role junctions' },
    { num: '02', name: 'governance', desc: 'Organizations, regions, cold storage facilities, retail stores' },
    { num: '03', name: 'production', desc: 'Farms, plots, harvest yield logs, agrochemical records' },
    { num: '04', name: 'catalog', desc: 'Categories, cultivars/varieties, products, dynamic UOMs, prices' },
    { num: '05', name: 'procurement', desc: 'Suppliers, purchase orders, receiving inspection records' },
    { num: '06', name: 'traceability', desc: 'Batch codes, Brix readings, quality grades (Grade A/B/C), expiry' },
    { num: '07', name: 'inventory', desc: 'Stock balances, reservations, append-only ledger movements, shrinkage' },
    { num: '08', name: 'logistics', desc: 'Transfer orders, shipments, waybills, route tracking, POD' },
    { num: '09', name: 'commerce', desc: 'E-commerce customers, carts, orders, order items, payments' },
    { num: '10', name: 'retail', desc: 'POS terminals, cash registers, cashier shifts, sales, receipts' },
    { num: '11', name: 'finance', desc: 'Chart of accounts, general journal lines, COGS, gateway settlements' },
    { num: '12', name: 'communication', desc: 'Support tickets, notifications, SMS/WhatsApp transactional logs' },
    { num: '13', name: 'content', desc: 'Shop CMS banners, marketing promotions, grower stories' },
    { num: '14', name: 'analytics', desc: 'Star Schema dimensions (date, product, facility) and facts (sales, waste)' },
    { num: '15', name: 'integration', desc: 'External webhooks, API keys, delivery partner sync' },
    { num: '16', name: 'audit', desc: 'Audit trails, Transactional Outbox (RabbitMQ relay), Inbox deduplication' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-baseline">
        <div>
          <h2 className="text-xl font-black text-berry-charcoal">PostgreSQL Architecture & 16 Domain Schemas</h2>
          <p className="text-xs text-gray-500">
            Single Neon PostgreSQL database partitioned into 16 bounded domain contexts
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-berry-red bg-berry-pastel px-3 py-1 rounded-xl">
          pgx v5 • sqlc • golang-migrate
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {schemas.map((s) => (
          <div
            key={s.num}
            className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-berry-red transition flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-black font-mono text-berry-red">Schema #{s.num}</span>
                <Database className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <h4 className="font-extrabold text-sm text-berry-charcoal font-mono mb-1">{s.name}</h4>
              <p className="text-[11px] text-gray-500 leading-snug">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
