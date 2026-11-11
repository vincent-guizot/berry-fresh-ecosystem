import React from 'react';
import { Store, User, CheckCircle2, ShieldAlert } from 'lucide-react';

export const POSShiftsView: React.FC = () => {
  const shifts = [
    {
      id: 'shift-20261108-01',
      register_code: 'POS-REG-01',
      store_name: 'Store Jakarta Central',
      cashier_name: 'Siti Rahma',
      opened_at: '2026-11-08 08:00',
      opening_float: 200000,
      sales_revenue: 1845000,
      expected_cash: 2045000,
      actual_cash: 2045000,
      discrepancy: 0,
      status: 'OPEN',
      tx_count: 14,
    },
    {
      id: 'shift-20261107-02',
      register_code: 'POS-REG-01',
      store_name: 'Store Jakarta Central',
      cashier_name: 'Budi Hartono',
      opened_at: '2026-11-07 14:00',
      opening_float: 200000,
      sales_revenue: 4120000,
      expected_cash: 4320000,
      actual_cash: 4320000,
      discrepancy: 0,
      status: 'RECONCILED',
      tx_count: 36,
    },
    {
      id: 'shift-20261107-01',
      register_code: 'POS-REG-02',
      store_name: 'Store Jakarta Central',
      cashier_name: 'Lina Marlina',
      opened_at: '2026-11-07 08:00',
      opening_float: 200000,
      sales_revenue: 2950000,
      expected_cash: 3150000,
      actual_cash: 3145000,
      discrepancy: -5000,
      status: 'RECONCILED',
      tx_count: 22,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-baseline">
        <div>
          <h2 className="text-xl font-black text-berry-charcoal">POS Shifts & Cash Reconciliation</h2>
          <p className="text-xs text-gray-500">
            Cash register shifts, opening drawer floats, and end-of-day discrepancy audit logs
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-4">Shift & Store</th>
              <th className="p-4">Cashier</th>
              <th className="p-4">Opening Float</th>
              <th className="p-4">Gross Revenue</th>
              <th className="p-4">Expected Cash</th>
              <th className="p-4">Discrepancy</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {shifts.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/60 transition">
                <td className="p-4">
                  <div className="font-mono font-bold text-berry-charcoal">{s.id}</div>
                  <div className="text-[11px] text-gray-400 font-semibold">
                    {s.store_name} • {s.register_code}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800">
                    <User className="w-3.5 h-3.5 text-berry-red" />
                    <span>{s.cashier_name}</span>
                  </div>
                  <div className="text-[10px] text-gray-400">{s.opened_at}</div>
                </td>
                <td className="p-4 font-mono">Rp {s.opening_float.toLocaleString('id-ID')}</td>
                <td className="p-4 font-mono font-bold text-berry-red">
                  Rp {s.sales_revenue.toLocaleString('id-ID')} ({s.tx_count} tx)
                </td>
                <td className="p-4 font-mono font-bold text-gray-800">
                  Rp {s.expected_cash.toLocaleString('id-ID')}
                </td>
                <td className="p-4">
                  {s.discrepancy === 0 ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Rp 0
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-600 font-bold font-mono">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {s.discrepancy < 0 ? '-' : '+'}Rp {Math.abs(s.discrepancy).toLocaleString('id-ID')}
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                      s.status === 'OPEN'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
