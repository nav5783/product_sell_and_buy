import React, { useMemo, useState, useEffect } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCollection } from "../../hooks/useCollections";
import TableRowActions from "./TableRowActions";
import ColumnToggle from "./ColumnToggle";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import {
  Search,
  X,
  LayoutGrid,
  Plus,
  RefreshCw,
  Download,
  Upload,
  Filter,
  ChevronDown,
  Check,
} from "lucide-react";
import { Timestamp } from "firebase/firestore";

interface DataTableProps<T extends { id?: string }> {
  title: string;
  collectionPath?: string;
  data?: T[];
  loading?: boolean;
  columns: ColumnDef<T>[];
  onAdd?: () => void;
  onEdit?: (record: T) => void;
  onDelete?: (item: T) => void;
  hideImportExport?: boolean;
  hideAdd?: boolean;
  extraToolbar?: React.ReactNode;
  viewColumns?: ColumnDef<T>[];
}

interface ExportFilter {
  type: 'string' | 'number' | 'date' | 'boolean';
  min?: string;
  max?: string;
  search?: string;
  enabled: boolean;
  uniqueValues?: string[];
}

export default function DataTable<T extends { id?: string }>(props: DataTableProps<T>) {
  const {
    title,
    collectionPath,
    data: dataProp,
    loading: loadingProp,
    columns,
    viewColumns,
    onAdd,
    onEdit,
    onDelete,
    hideImportExport = false,
    hideAdd = false,
    extraToolbar,
  } = props;

  const { data: collData, loading: collLoading, create, remove } = useCollection<T>(collectionPath);

  const rows: T[] = Array.isArray(dataProp) ? dataProp : Array.isArray(collData) ? collData : [];
  const loading = typeof loadingProp === "boolean" ? loadingProp : collLoading;

  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({});
  const [viewData, setViewData] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<T | null>(null);
  const [exportModal, setExportModal] = useState(false);
  const [exportFilters, setExportFilters] = useState<Record<string, ExportFilter>>({});
  const [exportColumns, setExportColumns] = useState<Record<string, boolean>>({});
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [filteredValues, setFilteredValues] = useState<Record<string, string[]>>({});

  const formatValue = (value: any) => {
    if (value instanceof Timestamp) {
      return value.toDate().toLocaleString();
    }
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    if (value && typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value ?? "");
  };

  // Function to get unique values for a column
  const getUniqueValues = (columnId: string): string[] => {
    const values = new Set<string>();
    rows.forEach(row => {
      const value = (row as any)[columnId];
      if (value !== undefined && value !== null) {
        const formattedValue = formatValue(value);
        if (formattedValue.trim() !== '') {
          values.add(formattedValue);
        }
      }
    });
    return Array.from(values).sort();
  };

  // Filter unique values based on search input
  const filterUniqueValues = (columnId: string, searchText: string): string[] => {
    const uniqueValues = exportFilters[columnId]?.uniqueValues || [];
    if (!searchText) return uniqueValues;
    
    const searchLower = searchText.toLowerCase();
    return uniqueValues.filter(value => 
      value.toLowerCase().startsWith(searchLower)
    );
  };

  // Initialize export filters and columns
  useEffect(() => {
    if (exportModal && rows.length > 0) {
      const initialFilters: Record<string, ExportFilter> = {};
      const initialColumns: Record<string, boolean> = {};
      const initialFilteredValues: Record<string, string[]> = {};

      columns.forEach((col) => {
        const colId = (col.id ?? (col as any).accessorKey) as string | undefined;
        if (colId && colId !== "sr" && colId !== "actions") {
          // Determine column type based on sample data
          const sampleValue = rows[0] ? (rows[0] as any)[colId] : null;
          let type: 'string' | 'number' | 'date' | 'boolean' = 'string';
          
          if (sampleValue !== undefined && sampleValue !== null) {
            if (typeof sampleValue === 'number') {
              type = 'number';
            } else if (sampleValue instanceof Date || sampleValue instanceof Timestamp) {
              type = 'date';
            } else if (typeof sampleValue === 'boolean') {
              type = 'boolean';
            } else if (!isNaN(new Date(sampleValue).getTime())) {
              type = 'date';
            } else if (!isNaN(Number(sampleValue))) {
              type = 'number';
            }
          }
          
          // Get unique values for string type columns
          const uniqueValues = type === 'string' ? getUniqueValues(colId) : [];
          
          initialFilters[colId] = {
            type,
            enabled: false,
            search: '',
            min: '',
            max: '',
            uniqueValues: uniqueValues
          };
          initialColumns[colId] = true;
          initialFilteredValues[colId] = uniqueValues;
        }
      });

      setExportFilters(initialFilters);
      setExportColumns(initialColumns);
      setFilteredValues(initialFilteredValues);
    }
  }, [exportModal, columns, rows]);

  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(() => {
    const allColIds = columns
      .map((c) => (c.id ?? (c as any).accessorKey) as string | undefined)
      .filter(Boolean) as string[];

    const nameCol = allColIds.find((id) => id.toLowerCase().includes("name"));
    const defaultVisibleSet = new Set<string>();
    if (nameCol) defaultVisibleSet.add(nameCol);
    for (const id of allColIds) {
      if (defaultVisibleSet.size >= 5) break;
      defaultVisibleSet.add(id);
    }

    return columns.reduce<Record<string, boolean>>((acc, c) => {
      const cid = (c.id ?? (c as any).accessorKey) as string | undefined;
      if (cid) acc[cid] = defaultVisibleSet.has(cid);
      return acc;
    }, {});
  });

  const filteredData = useMemo(() => {
    return rows.filter((row) =>
      Object.entries(columnSearch).every(([key, query]) => {
        if (!query) return true;
        const v = (row as any)[key];
        return formatValue(v).toLowerCase().includes(query.toLowerCase());
      })
    );
  }, [rows, columnSearch]);

  const baseTableColumns = useMemo(
    () =>
      columns.filter((c) => {
        const cid = (c.id ?? (c as any).accessorKey) as string | undefined;
        return cid ? !!visibleCols[cid] : true;
      }),
    [columns, visibleCols]
  );

  const tableColumns: ColumnDef<T>[] = useMemo(() => {
    const srColumn: ColumnDef<T> = {
      id: "sr",
      header: "Sr.",
      cell: ({ row }) => row.index + 1,
    };

    const actionsColumn: ColumnDef<T> = {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <TableRowActions
          row={row.original}
          onView={() => setViewData(row.original)}
          onEdit={() => onEdit?.(row.original)}
          onDelete={() => setConfirmDelete(row.original)}
        />
      ),
    };

    return [srColumn, ...baseTableColumns, actionsColumn];
  }, [baseTableColumns, onEdit]);

  const table = useReactTable<T>({
    data: filteredData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const toggleCol = (id: string) => setVisibleCols((s) => ({ ...s, [id]: !s[id] }));

  const handleImport = async (file: File | null) => {
    if (!file) return;
    if (!collectionPath) {
      console.warn("Import skipped: no collectionPath provided");
      return;
    }
    const dataBuf = await file.arrayBuffer();
    const wb = XLSX.read(dataBuf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
    for (const row of json) {
      await create({
        ...(row as any),
        insertedOn: new Date().toISOString(),
      } as any);
    }
  };

  const applyExportFilters = (data: T[]): T[] => {
    return data.filter((row) => {
      return Object.entries(exportFilters).every(([columnId, filter]) => {
        if (!filter.enabled) return true;
        
        const value = (row as any)[columnId];
        if (value === undefined || value === null) return false;
        
        switch (filter.type) {
          case 'number': {
            const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
            if (isNaN(numValue)) return false;
            
            const min = filter.min ? parseFloat(filter.min) : -Infinity;
            const max = filter.max ? parseFloat(filter.max) : Infinity;
            return numValue >= min && numValue <= max;
          }
          
          case 'date': {
            let dateValue: Date;
            if (value instanceof Timestamp) {
              dateValue = value.toDate();
            } else if (value instanceof Date) {
              dateValue = value;
            } else {
              dateValue = new Date(value);
            }
            
            if (isNaN(dateValue.getTime())) return false;
            
            const min = filter.min ? new Date(filter.min) : new Date(-8640000000000000);
            const max = filter.max ? new Date(filter.max) : new Date(8640000000000000);
            
            return dateValue >= min && dateValue <= max;
          }
          
          case 'string': {
            const strValue = String(value).toLowerCase();
            const search = filter.search?.toLowerCase() || '';
            return strValue.includes(search);
          }
          
          case 'boolean': {
            const boolValue = Boolean(value);
            const search = filter.search?.toLowerCase() || '';
            if (search === 'true' || search === 'false') {
              return boolValue === (search === 'true');
            }
            return true;
          }
          
          default:
            return true;
        }
      });
    });
  };

  const handleExport = () => {
    // Apply filters to get filtered data
    const filteredExportData = applyExportFilters(rows);
    
    // Filter columns based on selection
    const selectedColumns = Object.entries(exportColumns)
      .filter(([_, selected]) => selected)
      .map(([colId]) => colId);
    
    // Prepare data with only selected columns
    const exportData = filteredExportData.map(item => {
      const filteredItem: any = {};
      selectedColumns.forEach(colId => {
        const value = (item as any)[colId];
        if (value instanceof Timestamp) {
          filteredItem[colId] = value.toDate().toISOString();
        } else if (value instanceof Date) {
          filteredItem[colId] = value.toISOString();
        } else {
          filteredItem[colId] = value;
        }
      });
      return filteredItem;
    });
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `${title.toLowerCase().replace(/\s+/g, "-")}-filtered.xlsx`);
    setExportModal(false);
  };

  const handleDelete = async (itemToDelete: T | null) => {
    if (!itemToDelete || !itemToDelete.id) {
        console.error("handleDelete called with invalid item.", itemToDelete);
        setConfirmDelete(null);
        return;
    }
    
    if (onDelete) {
      await onDelete(itemToDelete);
    } else {
      if (!collectionPath) {
        console.warn("Delete skipped: no collectionPath provided");
        setConfirmDelete(null);
        return;
      }
      await remove(itemToDelete.id);
    }
    setConfirmDelete(null);
  };

  const updateExportFilter = (columnId: string, updates: Partial<ExportFilter>) => {
    setExportFilters(prev => {
      const newFilters = {
        ...prev,
        [columnId]: {
          ...prev[columnId],
          ...updates
        }
      };
      
      // Update filtered values for string columns when search changes
      if (updates.search !== undefined && newFilters[columnId]?.type === 'string') {
        setFilteredValues(prevValues => ({
          ...prevValues,
          [columnId]: filterUniqueValues(columnId, updates.search || '')
        }));
      }
      
      return newFilters;
    });
  };

  const toggleExportColumn = (columnId: string) => {
    setExportColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  const selectAllExportColumns = (selected: boolean) => {
    const newSelection: Record<string, boolean> = {};
    Object.keys(exportColumns).forEach(colId => {
      newSelection[colId] = selected;
    });
    setExportColumns(newSelection);
  };

  const toggleDropdown = (columnId: string) => {
    setShowDropdown(prev => prev === columnId ? null : columnId);
  };

  const selectUniqueValue = (columnId: string, value: string) => {
    setExportFilters(prev => ({
      ...prev,
      [columnId]: {
        ...prev[columnId],
        search: value
      }
    }));
    setFilteredValues(prev => ({
      ...prev,
      [columnId]: filterUniqueValues(columnId, value)
    }));
    setShowDropdown(null);
  };

  const handleSearchChange = (columnId: string, value: string) => {
    updateExportFilter(columnId, { search: value });
    
    // Keep dropdown open when typing
    if (!showDropdown) {
      setShowDropdown(columnId);
    }
  };

  const totalSelectedColumns = Object.values(exportColumns).filter(Boolean).length;
  const allColumnsCount = Object.keys(exportColumns).length;

  return (
    <div className="w-full">
      <div className="bg-purple-500 px-4 py-1 text-white font-semibold text-lg flex items-center justify-between">
        <div>{title}</div>
        <div className="flex items-center gap-3">
          {!hideImportExport && (
            <>
              <label className="p-2 bg-white/20 rounded hover:bg-white/30 cursor-pointer" title="Import">
                <Upload size={20} />
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleImport(e.target.files?.[0] ?? null)} />
              </label>
              <button onClick={() => setExportModal(true)} className="p-2 bg-white/20 rounded hover:bg-white/30 cursor-pointer" title="Export">
                <Download size={20} />
              </button>
            </>
          )}
          {extraToolbar && <div>{extraToolbar}</div>}
          <button onClick={() => setShowColumnsModal(true)} className="p-2 bg-white/20 rounded hover:bg-white/30 cursor-pointer" title="Toggle Columns">
            <LayoutGrid size={20} />
          </button>
          {!hideAdd && (
            <button onClick={onAdd} className="p-2 bg-white/20 rounded hover:bg-white/30 cursor-pointer" title="Add">
              <Plus size={20} />
            </button>
          )}
          <button onClick={() => window.location.reload()} className="p-2 bg-white/20 rounded hover:bg-white/30 cursor-pointer" title="Refresh">
            <RefreshCw size={20} />
          </button>
          <button onClick={() => setSearchVisible((s) => !s)} className="p-2 bg-white/20 rounded hover:bg-white/30 cursor-pointer" title="Search">
            <Search size={20} />
          </button>
        </div>
      </div>

      <div className="border-x border-b overflow-auto">
        <table className="min-w-full table-fixed">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-gray-100">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-3 text-left font-semibold border-r">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
            {searchVisible && (
              <tr className="bg-gray-50">
                {table.getHeaderGroups()[0].headers.map((header) => {
                  const key = header.column.id;
                  return (
                    <th key={key} className="p-2 border-r">
                      {key !== "sr" && key !== "actions" && (
                        <input
                          value={columnSearch[key] || ""}
                          onChange={(e) =>
                            setColumnSearch((s) => ({
                              ...s,
                              [key]: e.target.value,
                            }))
                          }
                          className="w-full p-1 border rounded"
                          placeholder={`Search ${String(header.column.columnDef.header ?? key)}`}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            )}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t hover:bg-white/50">
                {row.getVisibleCells().map((cell) => {
                  const rawValue = cell.getValue();
                  let displayValue: string = "";

                  if (rawValue instanceof Timestamp) {
                    displayValue = rawValue.toDate().toLocaleString();
                  } else if (rawValue != null) {
                    displayValue = formatValue(rawValue);
                  }

                  return (
                    <td key={cell.id} className="p-1 align-top border-r">
                      {cell.column.columnDef.cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-4 p-4">
        <div className="text-sm">View {rows.length ? `1 - ${rows.length} of ${rows.length}` : "0 - 0 of 0"}</div>
      </div>

      {showColumnsModal && (
        <ColumnToggle
          title={`Customize Column Visibility: ${title}`}
          columns={columns
            .map((c) => {
              const id = (c.id ?? (c as any).accessorKey) as string | undefined;
              if (!id) return null;
              return {
                id,
                label: ((c as any).header as string) ?? id,
                visible: !!visibleCols[id],
              };
            })
            .filter(Boolean) as Array<{
            id: string;
            label: string;
            visible: boolean;
          }>}
          onToggle={toggleCol}
          onClose={() => setShowColumnsModal(false)}
        />
      )}

      {viewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-auto relative border border-gray-200">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 cursor-pointer"
              onClick={() => setViewData(null)}
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold px-6 pt-6 pb-4 border-b bg-gray-50 rounded-t-lg">
              Record Details
            </h2>
            <div className="divide-y">
              {(viewColumns || columns).map((col, idx) => {
                const key = col.id ?? (col as any).accessorKey;

                if (key === "actions" || key === "sr") return null;

                let displayValue: React.ReactNode;

                if (typeof col.cell === "function") {
                  displayValue = flexRender(col.cell, {
                    row: { original: viewData },
                    // @ts-ignore
                    getValue: () => viewData[key],
                  });
                } else {
                  displayValue = formatValue(viewData[key]);
                }

                return (
                  <div
                    key={key}
                    className={`flex justify-between items-start px-6 py-3 ${
                      idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <span className="font-medium text-gray-800">
                      {col.header as string}
                    </span>
                    <span className="text-gray-700 max-w-[60%] text-right break-words">
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-4">Are you sure you want to delete this record?</p>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition cursor-pointer" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition cursor-pointer" onClick={() => handleDelete(confirmDelete)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Export Modal */}
      {exportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Export Data</h2>
              <button
                onClick={() => setExportModal(false)}
                className="text-gray-500 hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Column Selection Section */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">Select Columns to Export</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {totalSelectedColumns} of {allColumnsCount} selected
                    </span>
                    <button
                      onClick={() => selectAllExportColumns(true)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => selectAllExportColumns(false)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {columns
                    .filter(col => {
                      const colId = (col.id ?? (col as any).accessorKey) as string;
                      return colId && colId !== "sr" && colId !== "actions";
                    })
                    .map((col) => {
                      const colId = (col.id ?? (col as any).accessorKey) as string;
                      const filter = exportFilters[colId];
                      
                      return (
                        <div
                          key={colId}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            exportColumns[colId]
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => toggleExportColumn(colId)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                              exportColumns[colId] ? "bg-blue-500 border-blue-500" : "border-gray-300"
                            }`}>
                              {exportColumns[colId] && (
                                <span className="text-white text-xs">✓</span>
                              )}
                            </div>
                            <span className="font-medium text-gray-700">
                              {col.header as string || colId}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {filter?.enabled && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                Filter Active
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Filters Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Apply Filters</h3>
                <div className="space-y-6">
                  {columns
                    .filter(col => {
                      const colId = (col.id ?? (col as any).accessorKey) as string;
                      return colId && colId !== "sr" && colId !== "actions";
                    })
                    .map((col) => {
                      const colId = (col.id ?? (col as any).accessorKey) as string;
                      const filter = exportFilters[colId];
                      
                      if (!filter) return null;
                      
                      return (
                        <div key={colId} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={filter.enabled}
                                  onChange={(e) => updateExportFilter(colId, { enabled: e.target.checked })}
                                  className="sr-only peer"
                                />
                                <div className={`relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer ${
                                  filter.enabled ? 'peer-checked:bg-blue-600' : ''
                                }`}>
                                  <div className={`absolute top-0.5 left-0.5 bg-white border rounded-full h-5 w-5 transition-all ${
                                    filter.enabled ? 'transform translate-x-full border-blue-600' : 'border-gray-300'
                                  }`}></div>
                                </div>
                              </label>
                              <span className="font-medium text-gray-700">
                                {col.header as string || colId}
                              </span>
                            </div>
                          </div>
                          
                          {filter.enabled && (
                            <div className="mt-3 space-y-3">
                              {filter.type === 'string' && (
                                <div className="relative">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select or search text
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={filter.search || ''}
                                      onChange={(e) => handleSearchChange(colId, e.target.value)}
                                      onClick={() => toggleDropdown(colId)}
                                      placeholder={`Search in ${col.header || colId}`}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => toggleDropdown(colId)}
                                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                      <ChevronDown size={20} />
                                    </button>
                                  </div>
                                  
                                  {/* Unique values dropdown */}
                                  {showDropdown === colId && filter.uniqueValues && (
                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                      <div className="p-2 border-b bg-gray-50">
                                        <div className="text-xs text-gray-500 flex justify-between">
                                          <span>
                                            {filteredValues[colId]?.length || 0} matching values
                                          </span>
                                          <span>
                                            {filter.search ? `Filtered by: "${filter.search}"` : 'All values'}
                                          </span>
                                        </div>
                                      </div>
                                      {filteredValues[colId] && filteredValues[colId].length > 0 ? (
                                        filteredValues[colId].map((value, index) => (
                                          <div
                                            key={index}
                                            className={`px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between ${
                                              filter.search === value ? 'bg-blue-100' : ''
                                            }`}
                                            onClick={() => selectUniqueValue(colId, value)}
                                          >
                                            <span className="truncate">{value}</span>
                                            {filter.search === value && (
                                              <Check size={16} className="text-blue-600" />
                                            )}
                                          </div>
                                        ))
                                      ) : (
                                        <div className="px-3 py-3 text-gray-500 text-sm text-center">
                                          {filter.search ? (
                                            <div>
                                              No values start with "<span className="font-semibold">{filter.search}</span>"
                                            </div>
                                          ) : (
                                            <div>No values available</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {filter.uniqueValues && filter.uniqueValues.length > 0 && (
                                    <div className="mt-2 text-xs text-gray-500 flex justify-between">
                                      <span>
                                        {filter.search ? 
                                          `Showing ${filteredValues[colId]?.length || 0} values starting with "${filter.search}"` :
                                          `Found ${filter.uniqueValues.length} unique values. Start typing to filter.`
                                        }
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (filter.search) {
                                            updateExportFilter(colId, { search: '' });
                                          }
                                        }}
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        {filter.search ? 'Clear filter' : ''}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {filter.type === 'number' && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Minimum
                                    </label>
                                    <input
                                      type="number"
                                      value={filter.min || ''}
                                      onChange={(e) => updateExportFilter(colId, { min: e.target.value })}
                                      placeholder="Min value"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Maximum
                                    </label>
                                    <input
                                      type="number"
                                      value={filter.max || ''}
                                      onChange={(e) => updateExportFilter(colId, { max: e.target.value })}
                                      placeholder="Max value"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {filter.type === 'date' && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      From Date
                                    </label>
                                    <input
                                      type="date"
                                      value={filter.min || ''}
                                      onChange={(e) => updateExportFilter(colId, { min: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      To Date
                                    </label>
                                    <input
                                      type="date"
                                      value={filter.max || ''}
                                      onChange={(e) => updateExportFilter(colId, { max: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {filter.type === 'boolean' && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Filter by value
                                  </label>
                                  <select
                                    value={filter.search || ''}
                                    onChange={(e) => updateExportFilter(colId, { search: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">All values</option>
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Summary Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">Export Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-blue-600">Total Records</p>
                    <p className="text-xl font-bold text-blue-800">{rows.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">After Filtering</p>
                    <p className="text-xl font-bold text-blue-800">
                      {applyExportFilters(rows).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Selected Columns</p>
                    <p className="text-xl font-bold text-blue-800">
                      {totalSelectedColumns}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Active Filters</p>
                    <p className="text-xl font-bold text-blue-800">
                      {Object.values(exportFilters).filter(f => f.enabled).length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setExportModal(false)}
                  className="px-6 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={totalSelectedColumns === 0}
                  className={`px-6 py-2.5 font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    totalSelectedColumns === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                  }`}
                >
                  <Download size={18} />
                  Export {applyExportFilters(rows).length} Records
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}