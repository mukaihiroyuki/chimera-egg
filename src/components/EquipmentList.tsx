'use client';

import { useState, useEffect, useCallback } from 'react';

// XPの定数
const XP_TO_LEVEL_UP = 100;

// データ構造の型定義
type Equipment = {
  id: string;
  name: string;
  status_now: string;
  level: number;
  xp: number;
  [key: string]: any; // 不明な列も許容
};

// ステータスに応じてアイコンを返す
const getStatusIcon = (status: string) => {
  if (!status) return '😩';
  if (status.includes('故障')) return '🤢';
  if (status.includes('点検')) return '😐';
  if (status.includes('稼働中')) return '😊';
  return '😩';
};

export default function EquipmentList() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sheets');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'データの取得に失敗しました。');
      }
      const data = await response.json();
      const { values } = data;

      if (!values || values.length < 2) {
        setEquipment([]);
        return;
      }

      const headers = values[0].map((h: string) => h ? h.toLowerCase().replace(/\s+/g, '') : '');
      
      // ヘッダー名でインデックスを検索
      const idIndex = headers.indexOf('machine_id');
      const nameIndex = headers.indexOf('machine_name');
      const statusIndex = headers.indexOf('status_now');
      const levelIndex = headers.indexOf('level');
      const xpIndex = headers.indexOf('xp');

      if (idIndex === -1 || nameIndex === -1 || statusIndex === -1) {
        throw new Error('必要なヘッダー (machine_id, machine_name, status_now) が見つかりません。');
      }

      const formattedData: Equipment[] = values.slice(1).map((row: any[], rowIndex: number) => ({
        id: row[idIndex] || `temp-id-${rowIndex}`,
        name: row[nameIndex] || 'N/A',
        status_now: row[statusIndex] || 'N/A',
        level: levelIndex !== -1 ? parseInt(row[levelIndex], 10) || 1 : 1,
        xp: xpIndex !== -1 ? parseInt(row[xpIndex], 10) || 0 : 0,
      }));

      setEquipment(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  if (loading) return <div className="text-center p-8">読み込み中...</div>;
  if (error) return <div className="text-center p-8 text-red-500">エラー: {error}</div>;

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-200 text-gray-800';
    if (status.includes('故障')) return 'bg-red-100 text-red-800';
    if (status.includes('点検')) return 'bg-yellow-100 text-yellow-800';
    if (status.includes('稼働中')) return 'bg-green-100 text-green-800';
    return 'bg-gray-200 text-gray-800';
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">機材ステータス</h1>
      <div className="space-y-4">
        {equipment.map((item) => (
          <div key={item.id} className="bg-white shadow-md rounded-lg p-5">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <span className="text-5xl mr-5">{getStatusIcon(item.status_now)}</span>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">ID: {item.id}</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-base font-semibold ${getStatusColor(item.status_now)}`}>
                {item.status_now || '不明'}
              </span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <p className="text-lg font-bold text-yellow-500">Lv. {item.level}</p>
                <p className="text-sm text-gray-600">XP: {item.xp} / {XP_TO_LEVEL_UP}</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-yellow-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(item.xp / XP_TO_LEVEL_UP) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}