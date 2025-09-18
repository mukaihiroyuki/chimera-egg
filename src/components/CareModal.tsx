'use client';

import { useState } from 'react';

type CareModalProps = {
  equipmentName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (action: string) => Promise<void>;
};

const CARE_ACTIONS = ['オイル交換', '清掃', '点検', '部品交換'];

export default function CareModal({ equipmentName, isOpen, onClose, onSubmit }: CareModalProps) {
  const [selectedAction, setSelectedAction] = useState(CARE_ACTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(selectedAction);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">お世話をする</h2>
        <p className="mb-6 text-lg"><span className="font-bold">{equipmentName}</span> のお世話を選択してください。</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="care-action" className="block mb-2 text-sm font-medium text-gray-900">アクション:</label>
            <select
              id="care-action"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            >
              {CARE_ACTIONS.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? '送信中...' : '完了'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
