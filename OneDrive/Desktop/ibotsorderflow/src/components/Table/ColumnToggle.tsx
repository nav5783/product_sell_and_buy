import React from "react";

interface ColumnToggleProps {
  columns: { id: string; label: string; visible: boolean }[];
  onToggle: (id: string) => void;
  onClose?: () => void;
  title?: string;
}

export default function ColumnToggle({
  columns,
  onToggle,
  onClose,
  title = "Customize Column Visibility",
}: ColumnToggleProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg flex flex-col max-h-[80vh]">
        
        {/* Modal Header */}
        <div className="bg-purple-500 px-4 py-3 text-white text-lg font-semibold rounded-t-xl">
          {title}
        </div>

        {/* Table Header (fixed under modal title) */}
        <div className="px-4 py-2 border-b bg-white sticky top-0 z-10">
          <div className="grid grid-cols-2 text-sm font-semibold">
            <span>Column</span>
            <span>Show</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {columns.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-2 items-center border-b py-2 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">{c.label}</span>
              <input
                type="checkbox"
                checked={c.visible}
                onChange={() => onToggle(c.id)}
                className="w-5 h-5 cursor-pointer accent-purple-500 justify-self-start"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}