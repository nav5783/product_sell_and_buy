// TaskManagement.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Edit2, 
  X,
  Plus,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Users,
  Star,
  Target,
  FileText,
  Tag,
  Briefcase,
  Flag,
  CheckSquare,
  Square,
  FolderOpenDot
} from 'lucide-react';
import { db } from "../firebase";
import { useAuth } from "../App";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import TaskDashboard from './TaskDashboard';

// ============ TYPES AND INTERFACES ============
interface Task {
  id: string;
  staffId: string;
  employeeName: string;
  status: 'inprogress' | 'completed' | 'delayed' | 'assigned' | 'opened' | 'closed';
  deadline: Timestamp | Date | string;
  task: string;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
  assignedBy?: string;
  assignedByName?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  primaryResponsibility?: string;
  additionalNotes?: string;
}

interface Employee {
  id: string;
  employeeName: string;
  email: string;
  role: 'admin' | 'staff' | 'manager';
  department?: string;
  position?: string;
}

type TaskStatus = 'inprogress' | 'completed' | 'delayed' | 'assigned' | 'opened' | 'closed';
type SortField = 'employeeName' | 'task' | 'status' | 'deadline' | 'createdAt' | 'priority' | 'category';
type SortDirection = 'asc' | 'desc';

// ============ HELPER FUNCTIONS ============
const formatDate = (date: Timestamp | Date | string): string => {
  let d: Date;
  
  if (date instanceof Timestamp) {
    d = date.toDate();
  } else if (date instanceof Date) {
    d = date;
  } else {
    d = new Date(date);
  }
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (date: Timestamp | Date | string): string => {
  let d: Date;
  
  if (date instanceof Timestamp) {
    d = date.toDate();
  } else if (date instanceof Date) {
    d = date;
  } else {
    d = new Date(date);
  }
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'inprogress': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'delayed': return 'bg-red-100 text-red-800 border-red-200';
    case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'closed': return 'bg-red-200 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'assigned' : return <Clock className="w-4 h-4"/>;
    case 'completed': return <CheckCircle className="w-4 h-4" />;
    case 'inprogress': return <Clock className="w-4 h-4" />;
    case 'delayed': return <AlertCircle className="w-4 h-4" />;
    case 'opened': return <FolderOpenDot className='w-4 h-4'/>;
    case 'closed': return <X className='w-4 h-4'/>
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'critical': return <Flag className="w-4 h-4" />;
    case 'high': return <Flag className="w-4 h-4" />;
    case 'medium': return <Flag className="w-4 h-4" />;
    case 'low': return <Flag className="w-4 h-4" />;
    default: return <Flag className="w-4 h-4" />;
  }
};

// ============ MAIN COMPONENT ============
const TaskManagement: React.FC = () => {
  const { user } = useAuth();
  
  // ============ STATES ============
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Form states with expanded fields
  const [newTask, setNewTask] = useState({
    task: '',
    staffId: '',
    deadline: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    primaryResponsibility: '',
    additionalNotes: ''
  });

  const [editForm, setEditForm] = useState<Partial<Task>>({});

  // ============ FIREBASE SUBSCRIPTIONS ============
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Subscribe to employees collection
    let employeesQuery;
    if (user.role === 'admin') {
      employeesQuery = query(
        collection(db, 'employees'),
        where('role', '!=', 'admin')
      );
    } else if (user.role === 'manager') {
      employeesQuery = query(
        collection(db, 'employees'),
        where('role', '==', 'staff')
      );
    } else {
      employeesQuery = query(
        collection(db, 'employees'),
        where('id', '==', user.uid)
      );
    }

    const unsubscribeEmployees = onSnapshot(employeesQuery,
      (snapshot) => {
        const employeesData: Employee[] = snapshot.docs.map(doc => ({
          ...doc.data()
        } as Employee));
        setEmployees(employeesData);
      },
      (error) => {
        console.error('Error fetching employees:', error);
        setLoading(false);
      }
    );

    // Subscribe to tasks collection
    let tasksQuery;
    if (user.role === 'admin') {
      tasksQuery = query(
        collection(db, 'tasks'),
        orderBy('createdAt', 'desc')
      );
    } else if (user.role === 'manager') {
      tasksQuery = query(
        collection(db, 'tasks'),
        orderBy('createdAt', 'desc')
      );
    } else {
      tasksQuery = query(
        collection(db, 'tasks'),
        where('staffId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribeTasks = onSnapshot(tasksQuery, 
      (snapshot) => {
        const tasksData: Task[] = snapshot.docs.map(doc => {
          const data = doc.data() as Task;
          return {
            id: doc.id,
            ...data,
          };
        });
        
        setLoading(false);
        
          const updatedTasks = tasksData.map(task => {
            const deadline = task.deadline instanceof Timestamp 
              ? task.deadline.toDate() 
              : new Date(task.deadline as string);
            const now = new Date();
            
            if (task.status !== 'completed' && task.status !== "closed" && deadline < now) {
              return { 
                ...task, 
                status: 'delayed'
              };
            }
            return task;
          });
          
          setTasks(updatedTasks);
        
      },
      (error) => {
        console.error('Error fetching tasks:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeEmployees();
      unsubscribeTasks();
    };
  }, [user]);

  // ============ HANDLERS ============
  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTask.task || !newTask.staffId || !newTask.deadline || !newTask.category || !newTask.priority ) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const selectedEmployee = employees.find(emp => emp.id === newTask.staffId);
      
      if (!selectedEmployee) {
        alert('Selected employee not found');
        return;
      }

      const taskData = {
        staffId: newTask.staffId,
        employeeName: selectedEmployee.employeeName,
        status: 'assigned' as const,
        deadline: Timestamp.fromDate(new Date(newTask.deadline)),
        task: newTask.task,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        assignedBy: user.uid,
        assignedByName: user.name || user.email,
        category: newTask.category,
        priority: newTask.priority,
        primaryResponsibility: newTask.primaryResponsibility || "",
        additionalNotes: newTask.additionalNotes || ""
      };

      console.log(taskData);

      await addDoc(collection(db, 'tasks'), taskData);
      
      // Reset form
      setNewTask({
        task: '',
        staffId: '',
        deadline: '',
        category: '',
        priority: 'medium',
        primaryResponsibility: '',
        additionalNotes: ''
      });
      setIsAddModalOpen(false);
      
    } catch (error) {
      console.error('Error assigning task:', error);
      alert('Failed to assign task');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status');
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setEditForm({
      task: task.task,
      deadline: task.deadline instanceof Timestamp 
        ? task.deadline.toDate().toISOString().slice(0, 16)
        : new Date(task.deadline as string).toISOString().slice(0, 16),
      status: task.status,
      category: task.category,
      priority: task.priority,
      primaryResponsibility: task.primaryResponsibility,
      additionalNotes: task.additionalNotes
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      const taskRef = doc(db, 'tasks', selectedTask.id);
      
      const updateData: any = {
        task: editForm.task,
        updatedAt: serverTimestamp(),
      };

      if (user.role === 'admin') {
        if (editForm.deadline) {
          updateData.deadline = Timestamp.fromDate(new Date(editForm.deadline as string));
        }
        if (editForm.status) {
          updateData.status = editForm.status;
        }
        if (editForm.category) updateData.category = editForm.category;
        if (editForm.priority) updateData.priority = editForm.priority;
        if (editForm.primaryResponsibility !== undefined) updateData.primaryResponsibility = editForm.primaryResponsibility;
        if (editForm.additionalNotes !== undefined) updateData.additionalNotes = editForm.additionalNotes;
      } else if ((user.role === 'manager' || user.role === 'staff') && selectedTask.assignedBy === user.uid) {
        if (editForm.deadline) {
          updateData.deadline = Timestamp.fromDate(new Date(editForm.deadline as string));
        }
        if (editForm.category) updateData.category = editForm.category;
        if (editForm.priority) updateData.priority = editForm.priority;
        if (editForm.primaryResponsibility !== undefined) updateData.primaryResponsibility = editForm.primaryResponsibility;
        if (editForm.additionalNotes !== undefined) updateData.additionalNotes = editForm.additionalNotes;
      }

      await updateDoc(taskRef, updateData);
      setIsEditModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
      setIsDeleteConfirmOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ============ PERMISSION CHECKS ============
  const canAssignTask = (): boolean => {
    return user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff';
  };

  const canEditTask = (task: Task): boolean => {
    if (user?.role === 'admin') return true;
    if (task.staffId === user?.uid) return true;
    if (task.assignedBy === user?.uid) return true;
    return false;
  };

  const canDeleteTask = (task: Task): boolean => {
    if (user?.role === 'admin') return true;
    if (task.staffId === user?.uid) return true;
    if (task.assignedBy === user?.uid) return true;
    return false;
  };

  const canUpdateDeadline = (task: Task): boolean => {
    if (user?.role === 'admin') return true;
    if (task.assignedBy === user?.uid) return true;
    return false;
  };

  const canUpdateStatus = (task: Task): boolean => {
    if (user?.role === 'admin') return true;
    if (task.staffId === user?.uid) return true;
    return false;
  };

  const canViewAllTasks = (): boolean => {
    return user?.role === 'admin' || user?.role === 'manager';
  };

  // ============ FILTERED AND SORTED DATA ============
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    if (searchTerm && canViewAllTasks()) {
      filtered = filtered.filter(task =>
        task.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.assignedByName && task.assignedByName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (task.category && task.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }
    
    filtered = [...filtered].sort((a, b) => {
      let aValue: any, bValue: any;
      
      if (sortField === 'deadline' || sortField === 'createdAt' || sortField === 'updatedAt') {
        aValue = a[sortField] instanceof Timestamp 
          ? (a[sortField] as Timestamp).toDate() 
          : new Date(a[sortField] as string);
        bValue = b[sortField] instanceof Timestamp 
          ? (b[sortField] as Timestamp).toDate() 
          : new Date(b[sortField] as string);
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [tasks, searchTerm, filterStatus, sortField, sortDirection, canViewAllTasks]);

  // ============ RENDER FUNCTIONS ============
  const renderPriorityBadge = (priority: string) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(priority)}`}>
      {getPriorityIcon(priority)}
      <span className="ml-1 capitalize">{priority}</span>
    </span>
  );

  const renderStatusBadge = (status: TaskStatus) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      <span className="ml-1 capitalize">{status}</span>
    </span>
  );

  const renderTaskDetails = (task: Task) => {
    if (expandedTaskId !== task.id) return null;

    const canEdit = canEditTask(task);
    const canDelete = canDeleteTask(task);
    const canUpdateDeadlinePerm = canUpdateDeadline(task);
    const canUpdateStatusPerm = canUpdateStatus(task);

    return (
      <tr className="bg-gray-50">
        <td colSpan={7} className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Task Details</h4>
              <p className="text-gray-700 mb-4">{task.task}</p>
              
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Deadline: <span className="font-semibold ml-1">{formatDate(task.deadline)}</span></span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Created: <span className="font-semibold ml-1">{formatDate(task.createdAt)}</span></span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Updated: <span className="font-semibold ml-1">{formatDateTime(task.updatedAt)}</span></span>
                </div>
                {task.category && (
                  <div className="flex items-center text-gray-600">
                    <Tag className="w-4 h-4 mr-2" />
                    <span>Category: <span className="font-semibold ml-1">{task.category}</span></span>
                  </div>
                )}
                {task.priority && (
                  <div className="flex items-center text-gray-600">
                    <Flag className="w-4 h-4 mr-2" />
                    <span>Priority: <span className="font-semibold ml-1">{renderPriorityBadge(task.priority)}</span></span>
                  </div>
                )}
                {task.assignedByName && (
                  <div className="flex items-center text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    <span>Assigned by: <span className="font-semibold ml-1">{task.assignedByName}</span></span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold mr-3">
                  {getInitials(task.employeeName)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{task.employeeName}</h4>
                  <p className="text-sm text-gray-600">Assigned Employee</p>
                </div>
              </div>
              
              
              {canUpdateStatusPerm && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Update Status</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleStatusChange(task.id, 'inprogress')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        task.status === 'inprogress'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => handleStatusChange(task.id, 'completed')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        task.status === 'completed'
                          ? 'bg-green-600 text-white'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      Completed
                    </button>
                    <button
                      onClick={() => handleStatusChange(task.id, 'closed')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        task.status === 'closed'
                          ? 'bg-red-600 text-white'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      Closed
                    </button>
                  </div>
                </div>
              )}
              
              {(canEdit || canDelete) && (
                <div className="mt-6 flex space-x-3">
                  {canEdit && (
                    <button
                      onClick={() => handleEditTask(task)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        setTaskToDelete(task.id);
                        setIsDeleteConfirmOpen(true);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  const renderAddTaskModal = () => {
    const selectedEmployee = employees.find(emp => emp.id === newTask.staffId);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-4xl p-8 my-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Assign New Task</h2>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleAssignTask}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Form Fields */}
              <div className="space-y-6">
                {/* Employee Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Select Employee *
                  </label>
                  <select
                    value={newTask.staffId}
                    onChange={(e) => setNewTask({ ...newTask, staffId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all bg-white"
                    required
                  >
                    <option value="">Select an employee</option>
                    {employees.map(employee => {
                      if (user.role === 'staff' && employee.id !== user.uid) {
                        return null;
                      }
                      return (
                        <option key={employee.id} value={employee.id}>
                          {employee.employeeName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Category *
                  </label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all bg-white"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="training">Training</option>
                    <option value="Project">Project</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Priority *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setNewTask({ ...newTask, priority: 'low' })}
                      className={`px-4 py-3 rounded-xl border flex items-center justify-center transition-colors ${
                        newTask.priority === 'low'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Low
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTask({ ...newTask, priority: 'medium' })}
                      className={`px-4 py-3 rounded-xl border flex items-center justify-center transition-colors ${
                        newTask.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Medium
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTask({ ...newTask, priority: 'high' })}
                      className={`px-4 py-3 rounded-xl border flex items-center justify-center transition-colors ${
                        newTask.priority === 'high'
                          ? 'bg-orange-100 text-orange-800 border-orange-300'
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      High
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTask({ ...newTask, priority: 'critical' })}
                      className={`px-4 py-3 rounded-xl border flex items-center justify-center transition-colors ${
                        newTask.priority === 'critical'
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Critical
                    </button>
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Right Column - Task Details and Employee Info */}
              <div className="space-y-6">
                {/* Task Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Task Description *
                  </label>
                  <textarea
                    value={newTask.task}
                    onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all min-h-[120px]"
                    placeholder="Enter detailed task description..."
                    required
                  />
                </div>

                {/* Primary Responsibility */}
                <div>
                  <label  className="block text-sm font-semibold text-gray-900 mb-3" >
                    Responsibilities staff name 
                  </label>
                  <textarea
                    value={newTask.primaryResponsibility}
                    onChange={(e) => setNewTask({ ...newTask, primaryResponsibility: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all bg-white"
                    placeholder="Enter the resposibility name"
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Additional Notes
                  </label>
                  <textarea
                    value={newTask.additionalNotes}
                    onChange={(e) => setNewTask({ ...newTask, additionalNotes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all min-h-[100px]"
                    placeholder="Add any additional notes..."
                  />
                </div>

                {/* Selected Employee Details */}
                {selectedEmployee && (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Selected Employee Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium text-gray-900">{selectedEmployee.employeeName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Role:</span>
                        <span className="font-medium text-gray-900 capitalize">{selectedEmployee.role}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900">{selectedEmployee.email}</span>
                      </div>
                      {selectedEmployee.department && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Department:</span>
                          <span className="font-medium text-gray-900">{selectedEmployee.department}</span>
                        </div>
                      )}
                      {selectedEmployee.position && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Position:</span>
                          <span className="font-medium text-gray-900">{selectedEmployee.position}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="my-8 border-t border-gray-200"></div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-8 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg"
              >
                Assign Task
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderEditTaskModal = () => {
    if (!selectedTask) return null;

    const canUpdateDeadlinePerm = canUpdateDeadline(selectedTask);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-4xl p-8 my-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Edit Task</h2>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleUpdateTask}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Form Fields */}
              <div className="space-y-6">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Category *
                  </label>
                  <select
                    value={editForm.category || ''}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all bg-white"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="training">Training</option>
                    <option value="project">Project</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Priority *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {['low', 'medium', 'high', 'critical'].map(priority => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, priority: priority as any })}
                        className={`px-4 py-3 rounded-xl border flex items-center justify-center transition-colors ${
                          editForm.priority === priority
                            ? priority === 'low' ? 'bg-green-100 text-green-800 border-green-300'
                            : priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                            : priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-300'
                            : 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <Square className="w-4 h-4 mr-2" />
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deadline */}

                {canUpdateDeadlinePerm && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Deadline *
                    </label>
                    <input
                      type="datetime-local"
                      value={editForm.deadline as string || ''}
                      onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                      required
                    />
                  </div>
                )}

                {/* Status (Admin only) */}
                {user.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Status
                    </label>
                    <select
                      value={editForm.status || ''}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TaskStatus })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                    >
                      <option value="inprogress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Right Column - Task Details */}
              <div className="space-y-6">
                {/* Task Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Task Description *
                  </label>
                  <textarea
                    value={editForm.task || ''}
                    onChange={(e) => setEditForm({ ...editForm, task: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all min-h-[120px]"
                    placeholder="Enter detailed task description..."
                    required
                  />
                </div>

                {/* Primary Responsibility */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Primary Responsibility
                  </label>
                      <textarea
                    value={editForm.primaryResponsibility}
                    onChange={(e) => setEditForm({ ...editForm, primaryResponsibility: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all bg-white"
                    placeholder="Enter the resposibility name"
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Additional Notes
                  </label>
                  <textarea
                    value={editForm.additionalNotes || ''}
                    onChange={(e) => setEditForm({ ...editForm, additionalNotes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all min-h-[100px]"
                    placeholder="Add any additional notes..."
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="my-8 border-t border-gray-200"></div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-8 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg"
              >
                Update Task
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderDeleteConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 transform transition-all duration-300 scale-100">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Task</h3>
          <p className="text-gray-600">
            Are you sure you want to delete this task? This action cannot be undone.
          </p>
        </div>
        
        <div className="flex justify-center space-x-3">
          <button
            onClick={() => setIsDeleteConfirmOpen(false)}
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => taskToDelete && handleDeleteTask(taskToDelete)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all font-medium shadow-md hover:shadow-lg"
          >
            Delete Task
          </button>
        </div>
      </div>
    </div>
  );

  // ============ MAIN RENDER ============
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: tasks.length,
    assigned: tasks.filter(t => t.status === 'assigned').length,
    opened: tasks.filter(t => t.status === 'opened').length,
    inprogress: tasks.filter(t => t.status === 'inprogress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    delayed: tasks.filter(t => t.status === 'delayed').length,
    closed: tasks.filter(t => t.status === 'closed').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      {/* Header */}
      <TaskDashboard/>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
            <p className="text-gray-600 mt-2">
              {user.role === 'admin' 
                ? 'Manage and assign tasks to your team'
                : user.role === 'manager'
                ? 'Manage tasks for your team'
                : 'Manage your tasks'
              }
            </p>
          </div>
          
          {canAssignTask() && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              {user.role === 'staff' ? 'Create New Task' : 'Assign New Task'}
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {canViewAllTasks() && (
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by employee name, task, category, or assigner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                />
              </div>
            )}
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus('assigned')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'assigned'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-grey-700 hover:bg-blue-100'
              }`}
            >
              Assigned ({stats.assigned})
            </button>
            <button
              onClick={() => setFilterStatus('opened')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'opened'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-500 hover:bg-blue-100'
              }`}
            >
              Opened ({stats.opened})
            </button>
            <button
              onClick={() => setFilterStatus('inprogress')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'inprogress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              In Progress ({stats.inprogress})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              Completed ({stats.completed})
            </button>
            <button
              onClick={() => setFilterStatus('delayed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'delayed'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              Delayed ({stats.delayed})
            </button>
            <button
              onClick={() => setFilterStatus('closed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'closed'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-500 hover:bg-red-100'
              }`}
            >
              Closed ({stats.closed})
            </button>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-4 px-6 text-left">
                      <button
                        onClick={() => handleSort('employeeName')}
                        className="flex items-center font-semibold text-gray-700 hover:text-gray-900"
                      >
                        Employee
                        {sortField === 'employeeName' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="w-4 h-4 ml-1" /> : 
                            <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <button
                        onClick={() => handleSort('task')}
                        className="flex items-center font-semibold text-gray-700 hover:text-gray-900"
                      >
                        Task
                        {sortField === 'task' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="w-4 h-4 ml-1" /> : 
                            <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center font-semibold text-gray-700 hover:text-gray-900"
                      >
                        Status
                        {sortField === 'status' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="w-4 h-4 ml-1" /> : 
                            <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <button
                        onClick={() => handleSort('category')}
                        className="flex items-center font-semibold text-gray-700 hover:text-gray-900"
                      >
                        Category
                        {sortField === 'category' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="w-4 h-4 ml-1" /> : 
                            <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <button
                        onClick={() => handleSort('priority')}
                        className="flex items-center font-semibold text-gray-700 hover:text-gray-900"
                      >
                        Priority
                        {sortField === 'priority' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="w-4 h-4 ml-1" /> : 
                            <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <button
                        onClick={() => handleSort('deadline')}
                        className="flex items-center font-semibold text-gray-700 hover:text-gray-900"
                      >
                        Deadline
                        {sortField === 'deadline' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="w-4 h-4 ml-1" /> : 
                            <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <span className="font-semibold text-gray-700">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    const canEdit = canEditTask(task);
                    const canDelete = canDeleteTask(task);
                    
                    return (
                      <React.Fragment key={task.id}>
                        <tr 
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                            expandedTaskId === task.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={async() => {
                            try {
                              if(task.status==='assigned' && task.staffId===user.uid)
                              {
                                task.status="opened";
                                const taskRef = doc(db, "tasks", task.id);
                                await updateDoc(taskRef,task);
                              }
                              setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
                            } catch (error) {
                              
                            }}}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold mr-3">
                                {getInitials(task.employeeName)}
                              </div>
                              <div>
                                <span className="font-medium text-gray-900">{task.employeeName}</span>
                                {task.assignedByName && (
                                  <p className="text-xs text-gray-500">Assigned by: {task.assignedByName}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="text-gray-800 line-clamp-2 max-w-md mb-1 capitalize">{task.task}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {renderStatusBadge(task.status)}
                          </td>
                          <td className="py-4 px-6 capitalize">{task.category}</td>
                          <td className="py-4 px-6">
                            {task.priority && renderPriorityBadge(task.priority)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center text-gray-700">
                              <Calendar className="w-4 h-4 mr-2" />
                              {formatDate(task.deadline)}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              {(canEdit || canDelete) && (
                                <div className="flex space-x-1">
                                  {canEdit && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditTask(task);
                                      }}
                                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTaskToDelete(task.id);
                                        setIsDeleteConfirmOpen(true);
                                      }}
                                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                {expandedTaskId === task.id ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {renderTaskDetails(task)}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No tasks found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try changing your search or filter criteria'
                  : canAssignTask()
                    ? 'Start by creating a new task'
                    : 'No tasks have been assigned to you yet'}
              </p>
              {canAssignTask() && !searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  {user.role === 'staff' ? 'Create Your First Task' : 'Assign The First Task'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isAddModalOpen && renderAddTaskModal()}
      {isEditModalOpen && renderEditTaskModal()}
      {isDeleteConfirmOpen && renderDeleteConfirmModal()}

      {/* Global Styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default TaskManagement;