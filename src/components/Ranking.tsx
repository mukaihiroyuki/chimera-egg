'use client';

import { useState, useEffect } from 'react';

// --- DATA STRUCTURES (should be shared, but for now keep it simple) ---
type HealthStatus = 'Healthy' | 'Normal' | 'Sick' | 'Neglected';

type EquipmentWithStatus = {
  id: string;
  name: string;
  level: number;
  xp: number;
  healthStatus: HealthStatus;
  lastMaintenance: {
    action: string;
    date: string;
  } | null;
};

// --- COMPONENT ---
export default function Ranking() {
  const [ranking, setRanking] = useState<EquipmentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await fetch('/api/equipment');
        if (!response.ok) throw new Error('ランキングデータの取得に失敗しました。');
        const data: EquipmentWithStatus[] = await response.json();
        
        // Sort by level in descending order
        data.sort((a, b) => b.level - a.level);
        
        setRanking(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  if (loading) return <div className="text-center p-8">ランキングを読み込み中...</div>;
  if (error) return <div className="text-center p-8 text-red-500">エラー: {error}</div>;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">🏆 レベルランキング 🏆</h1>
      <div className="space-y-3">
        {ranking.map((item, index) => (
          <div 
            key={item.id} 
            className="bg-white shadow-md rounded-lg p-4 flex items-center"
          >
            <div className="text-2xl font-bold w-12 text-center">{index + 1}</div>
            <div className="flex-grow ml-4">
              <p className="text-xl font-semibold">{item.name}</p>
            </div>
            <div className="text-xl font-bold text-yellow-500">
              Lv. {item.level}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
