'use client'; // Need to make this a client component to use state

import { useState } from 'react';
import EquipmentList from '../components/EquipmentList';
import Ranking from '../components/Ranking'; // Import the new component

export default function Home() {
  const [view, setView] = useState<'list' | 'ranking'>('list');

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-24 bg-gray-50">
      <div className="w-full max-w-4xl">
        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={() => setView('list')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              view === 'list'
                ? 'bg-blue-500 text-white shadow'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            機材一覧
          </button>
          <button
            onClick={() => setView('ranking')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              view === 'ranking'
                ? 'bg-yellow-500 text-white shadow'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🏆 ランキング
          </button>
        </div>

        {view === 'list' ? <EquipmentList /> : <Ranking />}
      </div>
    </main>
  );
}
