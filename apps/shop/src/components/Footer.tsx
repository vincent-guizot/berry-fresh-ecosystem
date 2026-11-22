import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-berry-charcoal text-white py-10 mt-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🍓</span>
            <span className="font-extrabold text-lg text-berry-blush">BERRY FRESH</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            Berry Good Business. Freshness Connected. Direct-from-farm strawberries, blueberries, raspberries, and blackberries delivered at optimum cold-chain temperatures.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-berry-pastel mb-3">Cold Chain Promise</h4>
          <ul className="text-xs text-gray-400 space-y-2">
            <li>Strict 2°C – 4°C Transit</li>
            <li>Same-Day Harvest Dispatch</li>
            <li>Modified Atmosphere Packing</li>
            <li>Zero Compromise Freshness</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-berry-pastel mb-3">Sales Channels</h4>
          <ul className="text-xs text-gray-400 space-y-2">
            <li>Berry Fresh Shop (Online)</li>
            <li>Berry Fresh POS (Retail Stores)</li>
            <li>B2B Commercial Supply</li>
            <li>Contract Farming Outgrowers</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-berry-pastel mb-3">Indonesia HQ</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Central Cold Distribution Hub<br />
            Jakarta & Bandung Highland Packhouses<br />
            Email: care@berryfresh.id
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
        © 2026 Berry Fresh Holdings. All rights reserved.
      </div>
    </footer>
  );
};
