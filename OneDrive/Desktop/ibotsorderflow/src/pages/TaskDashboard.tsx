// Dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { 
  FiActivity, 
  FiCheckCircle, 
  FiClock, 
  FiAlertTriangle, 
  FiAlertOctagon,
  FiTrendingUp,
  FiPieChart,
  FiBarChart2,
  FiLayers,
  FiRefreshCw,
  FiUser,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

interface Task {
  id: string;
  additionalNotes: string;
  assignedBy: string;
  assignedByName: string;
  category: string;
  createdAt: any;
  deadline: any;
  employeeName: string;
  primaryResponsibility: string;
  priority: string;
  staffId: string;
  status: string;
  task: string;
  updatedAt: any;
}

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  delayedTasks: number;
  criticalPriorityCount: number;
}

const TaskDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    delayedTasks: 0,
    criticalPriorityCount: 0
  });
  const [currentDateRange, setCurrentDateRange] = useState(0); // 0 = most recent, 1 = previous, etc.
  const DATE_RANGE_SIZE = 6; // Number of dates to show at once

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const tasksRef = collection(db, 'tasks');
      
      let q;
      if (user.role === 'admin') {
        // Admin sees all tasks
        q = query(tasksRef);
      } else {
        // Non-admin users see only their tasks
        q = query(tasksRef, where('staffId', '==', user.uid));
      }
      
      const querySnapshot = await getDocs(q);
      const tasksData: Task[] = [];
      
      querySnapshot.forEach((doc) => {
        tasksData.push({
          id: doc.id,
          ...doc.data()
        } as Task);
      });
      
      setTasks(tasksData);
      calculateStats(tasksData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tasksData: Task[]) => {
    const now = new Date();
    const delayedTasks = tasksData.filter(task => {
      if (task.status === 'completed' || task.status === 'closed') return false;
      const deadline = task.deadline?.toDate();
      return deadline && deadline < now;
    }).length;

    setDashboardStats({
      totalTasks: tasksData.length,
      completedTasks: tasksData.filter(t => t.status === 'completed').length,
      inProgressTasks: tasksData.filter(t => t.status === 'inprogress').length,
      delayedTasks,
      criticalPriorityCount: tasksData.filter(t => t.priority === 'critical').length
    });
  };

  // Data for created at chart (grouped by date) with pagination
  const getCreatedAtChartData = () => {
    const dateMap = new Map<string, number>();
    
    tasks.forEach(task => {
      if (task.createdAt) {
        const date = task.createdAt.toDate().toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      }
    });
    
    // Convert to array and sort by date (most recent first)
    const sortedDates = Array.from(dateMap.entries())
      .sort((a, b) => {
        // Parse dates for comparison
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateB.getTime() - dateA.getTime();
      });
    
    // Calculate start and end indices for pagination
    const startIndex = currentDateRange * DATE_RANGE_SIZE;
    const endIndex = startIndex + DATE_RANGE_SIZE;
    
    // Get the paginated slice
    const paginatedData = sortedDates.slice(startIndex, endIndex);
    
    // Reverse so oldest is first on x-axis
    return paginatedData.reverse().map(([date, count]) => ({
      date,
      count
    }));
  };

  // Get total number of date ranges for pagination
  const getTotalDateRanges = () => {
    const dateMap = new Map<string, number>();
    
    tasks.forEach(task => {
      if (task.createdAt) {
        const date = task.createdAt.toDate().toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      }
    });
    
    return Math.ceil(dateMap.size / DATE_RANGE_SIZE);
  };

  // Navigation functions for date pagination
  const handleNextDateRange = () => {
    const totalRanges = getTotalDateRanges();
    if (currentDateRange < totalRanges - 1) {
      setCurrentDateRange(prev => prev + 1);
    }
  };

  const handlePrevDateRange = () => {
    if (currentDateRange > 0) {
      setCurrentDateRange(prev => prev - 1);
    }
  };

  // Data for status pie chart
  const getStatusData = () => {
    const statuses = ['assigned', 'opened', 'inprogress', 'completed', 'delayed', 'closed'];
    const statusMap = new Map<string, number>();
    
    statuses.forEach(status => {
      const count = tasks.filter(t => t.status === status).length;
      if (count > 0) {
        statusMap.set(status, count);
      }
    });
    
    return Array.from(statusMap.entries()).map(([name, value]) => ({
      name,
      value
    }));
  };

  // Data for priority bar chart
  const getPriorityData = () => {
    const priorities = ['low', 'medium', 'high', 'critical'];
    const priorityMap = new Map<string, number>();
    
    priorities.forEach(priority => {
      const count = tasks.filter(t => t.priority === priority).length;
      priorityMap.set(priority, count);
    });
    
    return Array.from(priorityMap.entries()).map(([priority, count]) => ({
      priority,
      count
    }));
  };

  // Data for category chart
  const getCategoryData = () => {
    const categories = ['ecommerce', 'training', 'project'];
    const categoryMap = new Map<string, number>();
    
    categories.forEach(category => {
      const count = tasks.filter(t => t.category === category).length;
      categoryMap.set(category, count);
    });
    
    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count
    }));
  };

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  const PRIORITY_COLORS = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#F97316',
    critical: '#EF4444'
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      completed: 'bg-gradient-to-r from-emerald-500 to-teal-600',
      inprogress: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      delayed: 'bg-gradient-to-r from-rose-500 to-pink-600',
      assigned: 'bg-gradient-to-r from-amber-500 to-orange-600',
      opened: 'bg-gradient-to-r from-cyan-500 to-blue-600',
      closed: 'bg-gradient-to-r from-gray-500 to-slate-600'
    };
    return colors[status] || 'bg-gradient-to-r from-gray-500 to-slate-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Task Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm">
                <FiUser className="text-gray-400" />
                <p className="text-gray-600 text-sm">
                  {user?.role === 'admin' 
                    ? 'Admin View - All Tasks' 
                    : `Personal View - ${user?.email}`
                  }
                </p>
              </div>
              <button 
                onClick={fetchTasks}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 text-gray-600 hover:text-gray-800"
              >
                <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">
                  {dashboardStats.totalTasks}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Tasks</p>
                <p className="text-lg font-semibold text-gray-800">
                  {tasks.length} Tasks
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Total Tasks Card */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <FiActivity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm font-medium">Total Tasks</h3>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {dashboardStats.totalTasks}
                </p>
              </div>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {/* In Progress Card */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                <FiClock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm font-medium">In Progress</h3>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {dashboardStats.inProgressTasks}
                </p>
              </div>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" 
                   style={{ width: `${(dashboardStats.inProgressTasks / dashboardStats.totalTasks) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Completed Card */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-violet-50 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                <FiCheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm font-medium">Completed</h3>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {dashboardStats.completedTasks}
                </p>
              </div>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-violet-600 rounded-full" 
                   style={{ width: `${(dashboardStats.completedTasks / dashboardStats.totalTasks) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Delayed Card */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-50 to-pink-50 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                <FiAlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm font-medium">Delayed</h3>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {dashboardStats.delayedTasks}
                </p>
              </div>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-500 to-pink-600 rounded-full" 
                   style={{ width: `${(dashboardStats.delayedTasks / dashboardStats.totalTasks) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Critical Priority Card */}
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-50 to-orange-50 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <FiAlertOctagon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm font-medium">Critical</h3>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {dashboardStats.criticalPriorityCount}
                </p>
              </div>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full" 
                   style={{ width: `${(dashboardStats.criticalPriorityCount / dashboardStats.totalTasks) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-8">
        {/* First Row of Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tasks Created Over Time Chart */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FiTrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Tasks Created Over Time</h2>
                    <p className="text-sm text-gray-500">Daily task creation trend</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevDateRange}
                      disabled={currentDateRange === 0}
                      className={`p-2 rounded-lg transition-colors ${
                        currentDateRange === 0
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                      }`}
                    >
                      <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-600 font-medium">
                      Range {currentDateRange + 1} of {getTotalDateRanges()}
                    </span>
                    <button
                      onClick={handleNextDateRange}
                      disabled={currentDateRange >= getTotalDateRanges() - 1}
                      className={`p-2 rounded-lg transition-colors ${
                        currentDateRange >= getTotalDateRanges() - 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                      }`}
                    >
                      <FiChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getCreatedAtChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      name="Tasks Created" 
                      radius={[4, 4, 0, 0]}
                    >
                      {getCreatedAtChartData().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill="url(#colorGradient)"
                        />
                      ))}
                    </Bar>
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.9}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-center items-center gap-4">
                <div className="text-sm text-gray-500">
                  Showing {getCreatedAtChartData().length} of {getTotalDateRanges() * DATE_RANGE_SIZE} dates
                </div>
              </div>
            </div>
          </div>

          {/* Status Distribution Chart */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <FiPieChart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Task Status Distribution</h2>
                    <p className="text-sm text-gray-500">Overview of task progress</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {getStatusData().length} statuses
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getStatusData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={(entry) => `${entry.name}`}
                    >
                      {getStatusData().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [value, `${name} tasks`]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => (
                        <span className="text-sm text-gray-600">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row of Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Priority Distribution Chart */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <FiBarChart2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Task Priority Distribution</h2>
                    <p className="text-sm text-gray-500">Breakdown by priority levels</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {getPriorityData().length} levels
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getPriorityData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="priority" 
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      name="Task Count" 
                      radius={[4, 4, 0, 0]}
                    >
                      {getPriorityData().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PRIORITY_COLORS[entry.priority as keyof typeof PRIORITY_COLORS] || '#8884d8'} 
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <FiLayers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Task Categories</h2>
                    <p className="text-sm text-gray-500">Distribution across categories</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {getCategoryData().length} categories
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getCategoryData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="category" 
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      name="Task Count" 
                      radius={[4, 4, 0, 0]}
                      fill="url(#categoryGradient)"
                    />
                    <defs>
                      <linearGradient id="categoryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.9}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="mt-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {getStatusData().map((status, index) => (
              <div 
                key={status.name} 
                className="flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className={`w-3 h-3 rounded-full mb-2`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-sm font-medium text-gray-700 capitalize">{status.name}</span>
                <span className="text-2xl font-bold text-gray-800 mt-2">{status.value}</span>
                <span className="text-xs text-gray-500 mt-1">
                  {dashboardStats.totalTasks > 0 
                    ? `${((status.value / dashboardStats.totalTasks) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDashboard;