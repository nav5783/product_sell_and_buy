// TrainingManagement.tsx
import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../App";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  Columns,
  X,
  Search,
  RefreshCw,
  Save,
  User,
  Briefcase,
  BookOpen,
  CreditCard,
  FileText,
  ChevronRight,
  Settings,
  Filter,
  Calendar,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  GraduationCap,
  Sliders,
  DownloadCloud,
  Table,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";

interface TrainingData {
  id?: string;
  name: string;
  email: string;
  dateOfBirth: string;
  phone: string;
  gender: "male" | "female" | "others";
  place: string;
  profession: "student" | "working" | "others";
  mode: "regular" | "intern" | "workshop";
  status: "interested" | "maybe" | "notInterested";
  substatus?: "summer" | "winter" | "fasttrack";
  organizationName: string;
  paymentStatus: "installment" | "paid";
  remarks: string;
  course: "electronics" | "embedded" | "iot";
  createdBy: {
    uid: string;
    role: string;
    email: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ColumnVisibility {
  sno: boolean;
  name: boolean;
  email: boolean;
  phone: boolean;
  course: boolean;
  status: boolean;
  paymentStatus: boolean;
  profession: boolean;
  mode: boolean;
  place: boolean;
  organizationName: boolean;
  createdAt: boolean;
}

interface ExportColumn {
  key: keyof TrainingData | 'sno';
  label: string;
  selected: boolean;
  type: 'text' | 'date' | 'number' | 'select';
}

interface ExportFilter {
  column: string;
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in';
  value: any;
  value2?: any;
}

const TrainingManagement: React.FC = () => {
  const { user } = useAuth();
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [filteredData, setFilteredData] = useState<TrainingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedData, setSelectedData] = useState<TrainingData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [professionFilter, setProfessionFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof TrainingData>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  const [selectedColumns, setSelectedColumns] = useState<ColumnVisibility>({
    sno: true,
    name: true,
    email: false,
    phone: true,
    course: true,
    status: true,
    paymentStatus: true,
    profession: false,
    mode: false,
    place: false,
    organizationName: false,
    createdAt: false,
  });

  // Export modal state
  const [exportColumns, setExportColumns] = useState<ExportColumn[]>([
    { key: 'sno', label: 'S.No', selected: true, type: 'number' },
    { key: 'name', label: 'Name', selected: true, type: 'text' },
    { key: 'email', label: 'Email', selected: true, type: 'text' },
    { key: 'phone', label: 'Phone', selected: true, type: 'text' },
    { key: 'course', label: 'Course', selected: true, type: 'select' },
    { key: 'status', label: 'Status', selected: true, type: 'select' },
    { key: 'paymentStatus', label: 'Payment Status', selected: true, type: 'select' },
    { key: 'profession', label: 'Profession', selected: false, type: 'select' },
    { key: 'mode', label: 'Mode', selected: false, type: 'select' },
    { key: 'place', label: 'Place', selected: false, type: 'text' },
    { key: 'organizationName', label: 'Organization', selected: false, type: 'text' },
    { key: 'createdAt', label: 'Created At', selected: false, type: 'date' },
    { key: 'dateOfBirth', label: 'Date of Birth', selected: false, type: 'date' },
    { key: 'gender', label: 'Gender', selected: false, type: 'select' },
  ]);

  const [exportFilters, setExportFilters] = useState<ExportFilter[]>([]);
  const [exportData, setExportData] = useState<TrainingData[]>([]);
  const [exportFileName, setExportFileName] = useState(`training_export_${new Date().toISOString().split('T')[0]}`);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [currentFilterColumn, setCurrentFilterColumn] = useState<string>('');
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);

  const [formData, setFormData] = useState<Partial<TrainingData>>({
    name: "",
    email: "",
    dateOfBirth: "",
    phone: "",
    gender: "male",
    place: "",
    profession: "student",
    mode: "regular",
    status: "interested",
    course: "electronics",
    organizationName: "",
    paymentStatus: "installment",
    remarks: "",
  });

  useEffect(() => {
    fetchTrainingData();
  }, []);

  useEffect(() => {
    filterAndSortData();
  }, [trainingData, searchTerm, professionFilter, sortField, sortDirection]);

  useEffect(() => {
    // Update export data when filters change
    applyExportFilters();
  }, [exportFilters, trainingData]);

  const fetchTrainingData = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "training"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TrainingData[];
      setTrainingData(data);
      setExportData(data);
    } catch (error) {
      console.error("Error fetching training data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortData = () => {
    let filtered = [...trainingData];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.phone?.includes(searchTerm)
      );
    }

    // Apply profession filter
    if (professionFilter !== "all") {
      filtered = filtered.filter((item) => item.profession === professionFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "createdAt") {
        aValue = a.createdAt?.toDate() || new Date(0);
        bValue = b.createdAt?.toDate() || new Date(0);
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredData(filtered);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const dataToSave = {
        ...formData,
        createdBy: {
          uid: user.uid,
          role: user.role,
          email: user.email,
        },
        updatedAt: Timestamp.now(),
      };

      if (editingId) {
        const docRef = doc(db, "training", editingId);
        await updateDoc(docRef, {
          ...dataToSave,
          updatedAt: Timestamp.now(),
        });
      } else {
        await addDoc(collection(db, "training"), {
          ...dataToSave,
          createdAt: Timestamp.now(),
        });
      }

      fetchTrainingData();
      resetForm();
    } catch (error) {
      console.error("Error saving training data:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || user.role !== "admin") {
      alert("Only admins can delete records");
      return;
    }

    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteDoc(doc(db, "training", id));
        fetchTrainingData();
      } catch (error) {
        console.error("Error deleting training data:", error);
      }
    }
  };

  const handleEdit = (data: TrainingData) => {
    setFormData(data);
    setEditingId(data.id || null);
    setShowModal(true);
  };

  const handleView = (data: TrainingData) => {
    setSelectedData(data);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      dateOfBirth: "",
      phone: "",
      gender: "male",
      place: "",
      profession: "student",
      mode: "regular",
      status: "interested",
      course: "electronics",
      organizationName: "",
      paymentStatus: "installment",
      remarks: "",
    });
    setEditingId(null);
    setShowModal(false);
  };

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setSelectedColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const selectAllColumns = () => {
    const allTrue = Object.keys(selectedColumns).reduce((acc, key) => {
      acc[key as keyof ColumnVisibility] = true;
      return acc;
    }, {} as ColumnVisibility);
    setSelectedColumns(allTrue);
  };

  const deselectAllColumns = () => {
    const allFalse = Object.keys(selectedColumns).reduce((acc, key) => {
      acc[key as keyof ColumnVisibility] = false;
      return acc;
    }, {} as ColumnVisibility);
    setSelectedColumns(allFalse);
  };

  const toggleExportColumn = (index: number) => {
    const updated = [...exportColumns];
    updated[index].selected = !updated[index].selected;
    setExportColumns(updated);
  };

  const selectAllExportColumns = () => {
    setExportColumns(prev => prev.map(col => ({ ...col, selected: true })));
  };

  const deselectAllExportColumns = () => {
    setExportColumns(prev => prev.map(col => ({ ...col, selected: false })));
  };

  const addFilter = () => {
    if (!currentFilterColumn) return;
    
    const column = exportColumns.find(c => c.key === currentFilterColumn);
    if (!column) return;

    const newFilter: ExportFilter = {
      column: currentFilterColumn,
      operator: 'contains',
      value: '',
    };
    
    setExportFilters([...exportFilters, newFilter]);
    setCurrentFilterColumn('');
  };

  const removeFilter = (index: number) => {
    setExportFilters(exportFilters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: keyof ExportFilter, value: any) => {
    const updated = [...exportFilters];
    updated[index] = { ...updated[index], [field]: value };
    setExportFilters(updated);
  };

  const applyExportFilters = () => {
    let filtered = [...trainingData];

    exportFilters.forEach(filter => {
      filtered = filtered.filter(item => {
        const itemValue = item[filter.column as keyof TrainingData];
        
        if (filter.column === 'sno') return true; // Skip for S.No
        
        switch (filter.operator) {
          case 'contains':
            return String(itemValue).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'equals':
            return String(itemValue).toLowerCase() === String(filter.value).toLowerCase();
          case 'startsWith':
            return String(itemValue).toLowerCase().startsWith(String(filter.value).toLowerCase());
          case 'endsWith':
            return String(itemValue).toLowerCase().endsWith(String(filter.value).toLowerCase());
          case 'greaterThan':
            if (filter.column === 'createdAt' || filter.column === 'dateOfBirth') {
              return new Date(itemValue as string) > new Date(filter.value);
            }
            return Number(itemValue) > Number(filter.value);
          case 'lessThan':
            if (filter.column === 'createdAt' || filter.column === 'dateOfBirth') {
              return new Date(itemValue as string) < new Date(filter.value);
            }
            return Number(itemValue) < Number(filter.value);
          case 'between':
            if (filter.column === 'createdAt' || filter.column === 'dateOfBirth') {
              return new Date(itemValue as string) >= new Date(filter.value) && 
                     new Date(itemValue as string) <= new Date(filter.value2);
            }
            return Number(itemValue) >= Number(filter.value) && 
                   Number(itemValue) <= Number(filter.value2);
          case 'in':
            return filter.value?.includes(itemValue);
          default:
            return true;
        }
      });
    });

    setExportData(filtered);
  };

  const performExport = () => {
    const selectedColumnsList = exportColumns.filter(col => col.selected);
    
    if (exportFormat === 'csv') {
      // Generate CSV
      const headers = selectedColumnsList.map(col => col.label);
      const csvData = exportData.map((item, index) => {
        return selectedColumnsList.map(col => {
          if (col.key === 'sno') return index + 1;
          if (col.key === 'createdAt' && item.createdAt) {
            return item.createdAt.toDate().toLocaleString();
          }
          if (col.key === 'dateOfBirth' && item.dateOfBirth) {
            return item.dateOfBirth;
          }
          return item[col.key as keyof TrainingData] || '';
        });
      });

      const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportFileName}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      // Generate JSON
      const jsonData = exportData.map((item, index) => {
        const obj: any = {};
        selectedColumnsList.forEach(col => {
          if (col.key === 'sno') obj['S.No'] = index + 1;
          else if (col.key === 'createdAt' && item.createdAt) {
            obj[col.label] = item.createdAt.toDate().toLocaleString();
          } else {
            obj[col.label] = item[col.key as keyof TrainingData];
          }
        });
        return obj;
      });

      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportFileName}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }

    setShowExportModal(false);
  };

  const handleSort = (field: keyof TrainingData) => {
    if (field === sortField) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: keyof TrainingData }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const capitalizeFirstLetter = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "interested":
        return "bg-emerald-100 text-emerald-800 border-l-4 border-emerald-500";
      case "maybe":
        return "bg-amber-100 text-amber-800 border-l-4 border-amber-500";
      case "notInterested":
        return "bg-rose-100 text-rose-800 border-l-4 border-rose-500";
      default:
        return "bg-gray-100 text-gray-800 border-l-4 border-gray-500";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    return status === "paid" 
      ? "bg-indigo-100 text-indigo-800 border-l-4 border-indigo-500" 
      : "bg-orange-100 text-orange-800 border-l-4 border-orange-500";
  };

  const getCourseColor = (course: string) => {
    switch (course) {
      case "electronics":
        return "bg-blue-100 text-blue-800";
      case "embedded":
        return "bg-green-100 text-green-800";
      case "iot":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProfessionIcon = (profession: string) => {
    switch (profession) {
      case "student":
        return <GraduationCap size={14} className="mr-1" />;
      case "working":
        return <Briefcase size={14} className="mr-1" />;
      default:
        return <User size={14} className="mr-1" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Glassmorphism */}
        <div className="mb-8 backdrop-blur-lg bg-white/30 rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Training Management
              </h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <ChevronRight size={16} className="text-blue-500" />
                Manage and track all training-related records
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white/70 backdrop-blur-sm rounded-lg">
                <span className="text-sm text-gray-600">Total Records: </span>
                <span className="font-bold text-blue-600">{trainingData.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar with Enhanced Design */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-5 mb-6 border border-white/60 relative z-20">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/30"
              >
                <Plus size={20} />
                Add New Record
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 shadow-sm"
                >
                  <Columns size={20} />
                  Columns
                  <Settings size={14} className="ml-1 text-gray-400" />
                </button>
                
                {showColumnSelector && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-5 z-50 min-w-[320px]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800">Column Visibility</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={selectAllColumns}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                        >
                          Select All
                        </button>
                        <button
                          onClick={deselectAllColumns}
                          className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                      {Object.keys(selectedColumns).map((col) => (
                        <label
                          key={col}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer group"
                        >
                          <span className="text-sm font-medium text-gray-700 capitalize flex items-center gap-2">
                            {col === 'sno' && '📊 S.No'}
                            {col === 'name' && '👤 Name'}
                            {col === 'email' && '📧 Email'}
                            {col === 'phone' && '📞 Phone'}
                            {col === 'course' && '📚 Course'}
                            {col === 'status' && '⚡ Status'}
                            {col === 'paymentStatus' && '💰 Payment'}
                            {col === 'profession' && '💼 Profession'}
                            {col === 'mode' && '🎯 Mode'}
                            {col === 'place' && '📍 Place'}
                            {col === 'organizationName' && '🏢 Organization'}
                            {col === 'createdAt' && '📅 Created'}
                          </span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedColumns[col as keyof ColumnVisibility]}
                              onChange={() => toggleColumn(col as keyof ColumnVisibility)}
                              className="sr-only"
                            />
                            <div className={`w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${selectedColumns[col as keyof ColumnVisibility] ? 'bg-blue-600' : 'bg-gray-300'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${selectedColumns[col as keyof ColumnVisibility] ? 'translate-x-5' : 'translate-x-1'} mt-0.5`} />
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 shadow-sm"
                >
                  <DownloadCloud size={20} />
                  Export
                </button>
              </div>
            </div>

            <div className="flex gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                />
              </div>
              
              <select
                value={professionFilter}
                onChange={(e) => setProfessionFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
              >
                <option value="all">All Professions</option>
                <option value="student">Student</option>
                <option value="working">Working</option>
                <option value="others">Others</option>
              </select>

              <button
                onClick={fetchTrainingData}
                className="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
                title="Refresh"
              >
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* Table with Enhanced Design */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/60 relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/80 border-b border-gray-200">
                <tr>
                  {selectedColumns.sno && (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">S.No</th>
                  )}
                  {selectedColumns.name && (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:text-blue-600" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">
                        Name <SortIcon field="name" />
                      </div>
                    </th>
                  )}
                  {selectedColumns.email && (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:text-blue-600" onClick={() => handleSort("email")}>
                      <div className="flex items-center gap-1">
                        Email <SortIcon field="email" />
                      </div>
                    </th>
                  )}
                  {selectedColumns.phone && (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                  )}
                  {selectedColumns.course && (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:text-blue-600" onClick={() => handleSort("course")}>
                      <div className="flex items-center gap-1">
                        Course <SortIcon field="course" />
                      </div>
                    </th>
                  )}
                  {selectedColumns.status && (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:text-blue-600" onClick={() => handleSort("status")}>
                      <div className="flex items-center gap-1">
                        Status <SortIcon field="status" />
                      </div>
                    </th>
                  )}
                  {selectedColumns.paymentStatus && (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Payment</th>
                  )}
                  {selectedColumns.profession && (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Profession</th>
                  )}
                  {selectedColumns.mode && (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Mode</th>
                  )}
                  {selectedColumns.place && (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Place</th>
                  )}
                  {selectedColumns.organizationName && (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Organization</th>
                  )}
                  {selectedColumns.createdAt && (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:text-blue-600" onClick={() => handleSort("createdAt")}>
                      <div className="flex items-center gap-1">
                        Created <SortIcon field="createdAt" />
                      </div>
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={20} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <RefreshCw size={30} className="animate-spin text-blue-600" />
                        <p className="text-gray-600 font-medium">Loading records...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={20} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText size={40} className="text-gray-400" />
                        <p className="text-gray-600 font-medium">No records found</p>
                        <button
                          onClick={() => setShowModal(true)}
                          className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          + Add your first record
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors duration-150 group">
                      {selectedColumns.sno && (
                        <td className="px-6 py-4 text-gray-600 font-medium">{index + 1}</td>
                      )}
                      {selectedColumns.name && (
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{capitalizeFirstLetter(item.name)}</div>
                        </td>
                      )}
                      {selectedColumns.email && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail size={14} className="text-gray-400" />
                            {item.email.toLowerCase()}
                          </div>
                        </td>
                      )}
                      {selectedColumns.phone && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone size={14} className="text-gray-400" />
                            {item.phone}
                          </div>
                        </td>
                      )}
                      {selectedColumns.course && (
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getCourseColor(item.course)}`}>
                            {capitalizeFirstLetter(item.course)}
                          </span>
                        </td>
                      )}
                      {selectedColumns.status && (
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getStatusColor(item.status)}`}>
                            {capitalizeFirstLetter(item.status)}
                          </span>
                        </td>
                      )}
                      {selectedColumns.paymentStatus && (
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getPaymentStatusColor(item.paymentStatus)}`}>
                            <DollarSign size={12} className="inline mr-1" />
                            {capitalizeFirstLetter(item.paymentStatus)}
                          </span>
                        </td>
                      )}
                      {selectedColumns.profession && (
                        <td className="px-6 py-4">
                          <div className="flex items-center text-gray-600">
                            {getProfessionIcon(item.profession)}
                            {capitalizeFirstLetter(item.profession)}
                          </div>
                        </td>
                      )}
                      {selectedColumns.mode && (
                        <td className="px-6 py-4 text-gray-600 capitalize">{item.mode}</td>
                      )}
                      {selectedColumns.place && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin size={14} className="text-gray-400" />
                            {capitalizeFirstLetter(item.place) || 'N/A'}
                          </div>
                        </td>
                      )}
                      {selectedColumns.organizationName && (
                        <td className="px-6 py-4 text-gray-600">{item.organizationName || 'N/A'}</td>
                      )}
                      {selectedColumns.createdAt && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar size={14} className="text-gray-400" />
                            {item.createdAt?.toDate().toLocaleDateString()}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleView(item)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-all duration-200 hover:scale-110"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          {user?.role === "admin" && (
                            <button
                              onClick={() => item.id && handleDelete(item.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <DownloadCloud size={20} />
                Custom Export Data
              </h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Export Format Selection */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Download size={18} className="text-blue-600" />
                  Export Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">File Name</label>
                    <input
                      type="text"
                      value={exportFileName}
                      onChange={(e) => setExportFileName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="Enter file name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="csv"
                          checked={exportFormat === 'csv'}
                          onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>CSV</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="json"
                          checked={exportFormat === 'json'}
                          onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>JSON</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column Selection */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Table size={18} className="text-purple-600" />
                    Select Columns to Export
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllExportColumns}
                      className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllExportColumns}
                      className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {exportColumns.map((col, index) => (
                    <label
                      key={col.key}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        col.selected ? 'bg-purple-100 border border-purple-300' : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={col.selected}
                        onChange={() => toggleExportColumn(index)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter Builder */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Filter size={18} className="text-amber-600" />
                    Filter Data
                  </h3>
                  <button
                    onClick={() => setShowFilterBuilder(!showFilterBuilder)}
                    className="text-sm px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 flex items-center gap-1"
                  >
                    <Sliders size={14} />
                    {showFilterBuilder ? 'Hide Filters' : 'Show Filters'}
                  </button>
                </div>

                {showFilterBuilder && (
                  <>
                    {/* Add Filter */}
                    <div className="flex gap-2 mb-4">
                      <select
                        value={currentFilterColumn}
                        onChange={(e) => setCurrentFilterColumn(e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select column to filter...</option>
                        {exportColumns.filter(col => col.selected).map(col => (
                          <option key={col.key} value={col.key}>{col.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={addFilter}
                        disabled={!currentFilterColumn}
                        className="px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Filter
                      </button>
                    </div>

                    {/* Filter List */}
                    {exportFilters.length > 0 && (
                      <div className="space-y-3">
                        {exportFilters.map((filter, index) => {
                          const column = exportColumns.find(c => c.key === filter.column);
                          return (
                            <div key={index} className="bg-white p-4 rounded-xl border border-gray-200">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="font-medium text-gray-700">{column?.label}:</span>
                                <select
                                  value={filter.operator}
                                  onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                                >
                                  {column?.type === 'text' && (
                                    <>
                                      <option value="contains">Contains</option>
                                      <option value="equals">Equals</option>
                                      <option value="startsWith">Starts with</option>
                                      <option value="endsWith">Ends with</option>
                                    </>
                                  )}
                                  {column?.type === 'number' && (
                                    <>
                                      <option value="equals">Equals</option>
                                      <option value="greaterThan">Greater than</option>
                                      <option value="lessThan">Less than</option>
                                      <option value="between">Between</option>
                                    </>
                                  )}
                                  {column?.type === 'date' && (
                                    <>
                                      <option value="equals">Equals</option>
                                      <option value="greaterThan">After</option>
                                      <option value="lessThan">Before</option>
                                      <option value="between">Between</option>
                                    </>
                                  )}
                                  {column?.type === 'select' && (
                                    <>
                                      <option value="equals">Equals</option>
                                      <option value="in">In list</option>
                                    </>
                                  )}
                                </select>
                                <button
                                  onClick={() => removeFilter(index)}
                                  className="ml-auto p-1 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <X size={16} />
                                </button>
                              </div>

                              <div className="flex gap-2">
                                {filter.operator === 'between' ? (
                                  <>
                                    <input
                                      type={column?.type === 'date' ? 'date' : 'text'}
                                      value={filter.value || ''}
                                      onChange={(e) => updateFilter(index, 'value', e.target.value)}
                                      placeholder="From"
                                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg"
                                    />
                                    <input
                                      type={column?.type === 'date' ? 'date' : 'text'}
                                      value={filter.value2 || ''}
                                      onChange={(e) => updateFilter(index, 'value2', e.target.value)}
                                      placeholder="To"
                                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg"
                                    />
                                  </>
                                ) : filter.operator === 'in' && column?.type === 'select' ? (
                                  <select
                                    multiple
                                    value={filter.value || []}
                                    onChange={(e) => {
                                      const values = Array.from(e.target.selectedOptions, opt => opt.value);
                                      updateFilter(index, 'value', values);
                                    }}
                                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg"
                                    size={3}
                                  >
                                    {column.key === 'course' && (
                                      <>
                                        <option value="electronics">Electronics</option>
                                        <option value="embedded">Embedded</option>
                                        <option value="iot">IoT</option>
                                      </>
                                    )}
                                    {column.key === 'status' && (
                                      <>
                                        <option value="interested">Interested</option>
                                        <option value="maybe">Maybe</option>
                                        <option value="notInterested">Not Interested</option>
                                      </>
                                    )}
                                    {column.key === 'paymentStatus' && (
                                      <>
                                        <option value="installment">Installment</option>
                                        <option value="paid">Paid</option>
                                      </>
                                    )}
                                    {column.key === 'profession' && (
                                      <>
                                        <option value="student">Student</option>
                                        <option value="working">Working</option>
                                        <option value="others">Others</option>
                                      </>
                                    )}
                                    {column.key === 'mode' && (
                                      <>
                                        <option value="regular">Regular</option>
                                        <option value="intern">Intern</option>
                                        <option value="workshop">Workshop</option>
                                      </>
                                    )}
                                    {column.key === 'gender' && (
                                      <>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="others">Others</option>
                                      </>
                                    )}
                                  </select>
                                ) : (
                                  <input
                                    type={column?.type === 'date' ? 'date' : 'text'}
                                    value={filter.value || ''}
                                    onChange={(e) => updateFilter(index, 'value', e.target.value)}
                                    placeholder={`Enter ${column?.label.toLowerCase()}...`}
                                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Preview */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-5 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-gray-600" />
                  Preview ({exportData.length} records)
                </h3>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        {exportColumns.filter(col => col.selected).map(col => (
                          <th key={col.key} className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {exportData.slice(0, 5).map((item, idx) => (
                        <tr key={idx}>
                          {exportColumns.filter(col => col.selected).map(col => (
                            <td key={col.key} className="px-3 py-2 text-xs text-gray-600">
                              {col.key === 'sno' ? idx + 1 :
                               col.key === 'createdAt' && item.createdAt ? item.createdAt.toDate().toLocaleDateString() :
                               col.key === 'dateOfBirth' ? item.dateOfBirth :
                               item[col.key as keyof TrainingData] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {exportData.length > 5 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Showing first 5 of {exportData.length} records
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={performExport}
                  disabled={exportData.length === 0 || !exportColumns.some(col => col.selected)}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DownloadCloud size={18} />
                  Export {exportData.length} Records
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {editingId ? <Edit size={20} /> : <Plus size={20} />}
                {editingId ? "Edit Training Record" : "Add New Training Record"}
              </h2>
              <button
                onClick={resetForm}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
                    <input
                      type="text"
                      name="place"
                      value={formData.place}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="Enter place"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Briefcase size={18} className="text-purple-600" />
                  Professional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profession</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="profession"
                          value="student"
                          checked={formData.profession === "student"}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span>Student</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="profession"
                          value="working"
                          checked={formData.profession === "working"}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span>Working</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="profession"
                          value="others"
                          checked={formData.profession === "others"}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span>Others</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mode"
                          value="regular"
                          checked={formData.mode === "regular"}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span>Regular</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mode"
                          value="intern"
                          checked={formData.mode === "intern"}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span>Intern</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mode"
                          value="workshop"
                          checked={formData.mode === "workshop"}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span>Workshop</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Selection - Now Dropdown */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <BookOpen size={18} className="text-green-600" />
                  Course Selection
                </h3>
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Course *</label>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="electronics">Electronics</option>
                    <option value="embedded">Embedded</option>
                    <option value="iot">IoT</option>
                  </select>
                </div>
              </div>

              {/* Status and Payment */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-amber-600" />
                  Status & Payment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                    >
                      <option value="interested">Interested</option>
                      <option value="maybe">Maybe</option>
                      <option value="notInterested">Not Interested</option>
                    </select>
                  </div>
                  
                  {formData.status === "interested" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sub Status</label>
                      <select
                        name="substatus"
                        value={formData.substatus || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                      >
                        <option value="summer">Summer</option>
                        <option value="winter">Winter</option>
                        <option value="fasttrack">Fast Track</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Organization/Institution</label>
                    <input
                      type="text"
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                      placeholder="Enter organization name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                    <select
                      name="paymentStatus"
                      value={formData.paymentStatus}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                    >
                      <option value="installment">Installment</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-5 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-gray-600" />
                  Additional Information
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    placeholder="Add any additional notes or remarks..."
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/30 font-medium"
                >
                  <Save size={18} />
                  {editingId ? "Update Record" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Eye size={20} />
                Training Record Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</p>
                  <p className="text-base font-semibold text-gray-900">{capitalizeFirstLetter(selectedData.name)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
                  <p className="text-base text-gray-900">{selectedData.email}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</p>
                  <p className="text-base text-gray-900">{selectedData.dateOfBirth || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</p>
                  <p className="text-base text-gray-900">{selectedData.phone}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</p>
                  <p className="text-base text-gray-900 capitalize">{selectedData.gender}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Place</p>
                  <p className="text-base text-gray-900">{capitalizeFirstLetter(selectedData.place) || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Profession</p>
                  <p className="text-base text-gray-900 capitalize">{selectedData.profession}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</p>
                  <p className="text-base text-gray-900 capitalize">{selectedData.mode}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Course</p>
                  <p className="text-base">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getCourseColor(selectedData.course)}`}>
                      {capitalizeFirstLetter(selectedData.course)}
                    </span>
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(selectedData.status)}`}>
                    {capitalizeFirstLetter(selectedData.status)}
                  </span>
                </div>
                {selectedData.status === "interested" && selectedData.substatus && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Status</p>
                    <p className="text-base text-gray-900 capitalize">{selectedData.substatus}</p>
                  </div>
                )}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</p>
                  <p className="text-base text-gray-900">{selectedData.organizationName || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</p>
                  <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${getPaymentStatusColor(selectedData.paymentStatus)}`}>
                    {capitalizeFirstLetter(selectedData.paymentStatus)}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Remarks</p>
                <p className="text-base text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                  {selectedData.remarks || "No remarks added"}
                </p>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <User size={14} className="text-blue-600" />
                  Created by: <span className="font-medium">{selectedData.createdBy?.email}</span> 
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {selectedData.createdBy?.role}
                  </span>
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  <Calendar size={14} className="text-blue-600" />
                  Created at: {selectedData.createdAt?.toDate().toLocaleString()}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingManagement;