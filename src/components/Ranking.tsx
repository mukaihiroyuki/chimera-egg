'use client';

import { useState, useEffect } from 'react';

// データ構造の型定義 (EquipmentList.tsxと共通)
type Equipment = {
  id: string;
  name: string;
  status_now: string;
  level: number;
  xp: number;
  health: number;
};

// ランキングの順位に応じたスタイルを返すヘルパー関数
const getRankingStyles = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        icon: '👑',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-400',
      };
    case 2:
      return {
        icon: '🥈',
        bgColor: 'bg-gray-200',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-400',
      };
    case 3:
      return {
        icon: '🥉',
        bgColor: 'bg-orange-200',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-400',
      };
    default:
      return {
        icon: `${rank}`,
        bgColor: 'bg-white',
        textColor: 'text-gray-600',
        borderColor: 'border-gray-200',
      };
  }
};

export default function Ranking() {
  const [ranking, setRanking] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndProcessRanking = async () => {
      setLoading(true);
      try {
        // EquipmentList と同じエンドポイントからデータを取得
        const response = await fetch('/api/sheets');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'ランキングデータの取得に失敗しました。');
        }
        const data = await response.json();
        const { values } = data;

        if (!values || values.length < 2) {
          setRanking([]);
          return;
        }

        // ヘッダーを解析 (EquipmentList と同じロジック)
        const headers = values[0].map((h: string) => h ? h.toLowerCase().replace(/\s+/g, '') : '');
        const idIndex = headers.indexOf('machine_id');
        const nameIndex = headers.indexOf('machine_name');
        const statusIndex = headers.indexOf('status_now');
        const levelIndex = headers.indexOf('level');
        const xpIndex = headers.indexOf('xp');
        const healthIndex = headers.indexOf('health');

        if (idIndex === -1 || nameIndex === -1 || levelIndex === -1 || xpIndex === -1) {
          throw new Error('ランキングに必要なヘッダーが見つかりません。');
        }

        const formattedData: Equipment[] = values.slice(1).map((row: string[], rowIndex: number) => ({
          id: row[idIndex] || `temp-id-${rowIndex}`,
          name: row[nameIndex] || 'N/A',
          status_now: row[statusIndex] || 'N/A',
          level: parseInt(row[levelIndex], 10) || 1,
          xp: parseInt(row[xpIndex], 10) || 0,
          health: parseInt(row[healthIndex], 10) || 100,
        }));

        // ランキングロジック: レベル > XP の順で降順ソート
        const sortedData = formattedData.sort((a, b) => {
          if (b.level !== a.level) {
            return b.level - a.level;
          }
          return b.xp - a.xp;
        });

        // 上位10件をセット
        setRanking(sortedData.slice(0, 10));

      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessRanking();
  }, []);

  if (loading) return <div className="text-center p-8">ランキングを読み込み中...</div>;
  if (error) return <div className="text-center p-8 text-red-500">エラー: {error}</div>;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">育成王ランキング TOP 10</h1>
      <div className="space-y-4">
        {ranking.map((item, index) => {
          const rank = index + 1;
          const styles = getRankingStyles(rank);
          const isTop3 = rank <= 3;

          return (
            <div
              key={item.id}
              className={`shadow-lg rounded-xl p-4 flex items-center border-l-8 transition-transform transform hover:scale-105 ${styles.bgColor} ${styles.borderColor}`}
            >
              <div className={`text-3xl font-bold w-16 text-center ${styles.textColor}`}>
                {styles.icon}
              </div>
              <div className="flex-grow ml-4">
                <p className={`font-bold text-xl ${isTop3 ? 'text-gray-900' : 'text-gray-800'}`}>{item.name}</p>
                <p className="text-sm text-gray-500">ID: {item.id}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-black ${styles.textColor}`}>
                  Lv. {item.level}
                </p>
                <p className="text-sm text-gray-600">XP: {item.xp}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}