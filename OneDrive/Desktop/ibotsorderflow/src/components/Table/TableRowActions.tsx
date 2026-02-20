// import React from "react";
// import { Eye, Pencil, Trash2 } from "lucide-react";

// interface Props<T> {
//   row: T & { id: string };
//   onView: (row: any) => void;
//   onEdit: (row: any) => void;
//   onDelete: (row: any) => void;
// }

// export default function TableRowActions<T>({
//   row,
//   onView,
//   onEdit,
//   onDelete,
// }: Props<T>) {
//   return (
//     <div className="flex gap-3 items-center p-2">
//       {/* View Button */}
//       <button
//         onClick={() => onView(row)}
//         className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shadow cursor-pointer hover:bg-blue-600 hover:scale-110 transition-transform duration-150"
//         title="View"
//       >
//         <Eye size={16} />
//       </button>

//       {/* Edit Button */}
//       <button
//         onClick={() => onEdit(row)}
//         className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow cursor-pointer hover:bg-amber-600 hover:scale-110 transition-transform duration-150"
//         title="Edit"
//       >
//         <Pencil size={16} />
//       </button>

//       {/* Delete Button */}
//       <button
//         onClick={() => onDelete(row)}
//         className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow cursor-pointer hover:bg-red-600 hover:scale-110 transition-transform duration-150"
//         title="Delete"
//       >
//         <Trash2 size={16} />
//       </button>
//     </div>
//   );
// }


import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface Props<T> {
  row: T & { id?: string };
  onView: (row: any) => void;
  onEdit: (row: any) => void;
  onDelete: (id: string) => void; // Changed from any to id: string
}

export default function TableRowActions<T>({
  row,
  onView,
  onEdit,
  onDelete,
}: Props<T>) {
  return (
    <div className="flex gap-3 items-center p-2">
      {/* View Button */}
      <button
        onClick={() => onView(row)}
        className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shadow cursor-pointer hover:bg-blue-600 hover:scale-110 transition-transform duration-150"
        title="View"
      >
        <Eye size={16} />
      </button>

      {/* Edit Button */}
      <button
        onClick={() => onEdit(row)}
        className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow cursor-pointer hover:bg-amber-600 hover:scale-110 transition-transform duration-150"
        title="Edit"
      >
        <Pencil size={16} />
      </button>

      {/* Delete Button */}
      <button
        onClick={() => onDelete(row.id!)} // Pass only the ID
        className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow cursor-pointer hover:bg-red-600 hover:scale-110 transition-transform duration-150"
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
