import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  FileText, DollarSign, ClipboardList, BarChart3, Users, RefreshCw, Bell, TrendingUp, Target, 
  LineChart as LineChartIcon, Filter, CheckCircle, XCircle, AlertTriangle, Briefcase, GraduationCap, ShoppingCart,
  ListOrdered, Menu
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid,
  AreaChart, Area 
} from "recharts";
import {
  collection, query, where, Timestamp, onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../App";
import type { Enquiry } from "../types/enquiry";

// --- Helper Types for Dashboard Data (Unchanged) ---
type EmployeeDoc = { employeeName?: string; name?: string; email?:string; uid?: string; managerId?: string; };
type SegmentType = 'all' | 'ecommerce' | 'training' | 'projects';

interface SegmentPerformance {
    totalEnq: number;
    conversion: number;
    salesValue: number;
}

interface DashboardStats {
  totalRevenue: number;
  openInvoices: number;
  dueInvoices: number;
  totalEnquiries: number;
  quoteEnquiries: number;
  salesEnquiries: number;
  droppedEnquiries: number;
  openEnquiries: number;
  conversionRate: number;
  waitingPayment: number;
}

interface ChartData { name: string; value: number; [key: string]: any; }
interface RevenueData { date: string; revenue: number; }

// --- Configuration (Unchanged) ---
const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];
const CHART_HEIGHT = 240; 

// 🚀 NEW: Custom label component for the Pie Chart to prevent text overflow.
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const textAnchor = x > cx ? 'start' : 'end';

  return (
    <>
      <text x={x} y={y} fill="white" textAnchor={textAnchor} dominantBaseline="central" fontSize={12} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
      {/* This second text element places the name outside, preventing long names from getting cut off. */}
      <text x={cx + (outerRadius + 10) * Math.cos(-midAngle * RADIAN)} y={cy + (outerRadius + 10) * Math.sin(-midAngle * RADIAN)} fill="#333" textAnchor={textAnchor} dominantBaseline="central" fontSize={12}>
        {name}
      </text>
    </>
  );
};

// --- Dashboard Component ---
const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState<SegmentType>('all');

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const [dashboardData, setDashboardData] = useState<{
    stats: DashboardStats;
    leadsBySource: ChartData[];
    employeeLeads: { chartData: any[]; employeeNames: string[] };
    statusDistribution: ChartData[];
    revenueTrend: RevenueData[];
    employeeSegmentPerformance: Record<string, Record<SegmentType, SegmentPerformance>>;
  }>({
    stats: {
      totalRevenue: 0, openInvoices: 0, dueInvoices: 0, totalEnquiries: 0, quoteEnquiries: 0, salesEnquiries: 0, droppedEnquiries: 0, openEnquiries: 0, conversionRate: 0,waitingPayment: 0,
    },
    leadsBySource: [], employeeLeads: { chartData: [], employeeNames: [] }, statusDistribution: [], revenueTrend: [],
    employeeSegmentPerformance: {},
  });

  const [employeesByUid, setEmployeesByUid] = useState<Record<string, EmployeeDoc>>({});
  const [teamMemberUids, setTeamMemberUids] = useState<string[]>([]);

  // --- Data Fetching (Employee Profiles) ---
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "employees"), (snap) => {
      const byUid: Record<string, EmployeeDoc> = {};
      snap.docs.forEach((d) => {
        const data = d.data() as EmployeeDoc;
        const uid = (data.uid ?? d.id).toString();
        if (uid) byUid[uid] = { ...data, employeeName: data.employeeName || data.name || data.uid };
      });
      setEmployeesByUid(byUid);
    });
    return () => unsub();
  }, []);
  
  // --- Data Fetching (Manager's Team) ---
  useEffect(() => {
    if (user?.role === 'manager' && user.uid) {
      const teamsRef = collection(db, "teams");
      const q = query(teamsRef, where("managerId", "==", user.uid));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          let allStaffIds: string[] = [];
          snapshot.forEach(doc => {
            const teamData = doc.data();
            if (teamData.staff && Array.isArray(teamData.staff)) {
              const idsFromThisTeam = teamData.staff.map((member: { id: string }) => member.id);
              allStaffIds = [...allStaffIds, ...idsFromThisTeam];
            }
          });
          setTeamMemberUids([...new Set(allStaffIds)]);
        } else {
          setTeamMemberUids([]);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const getEmployeeName = useCallback((assignee: any): string => {
    if (!assignee) return "Unassigned";
    const employee = employeesByUid[assignee];
    return employee?.employeeName || assignee;
  }, [employeesByUid]);

  // --- Core Data Processing Logic (Unchanged) ---
  const processEnquiryData = useCallback((enquiries: Enquiry[]) => {
    const stats: DashboardStats = { totalRevenue: 0, openInvoices: 0, dueInvoices: 0, totalEnquiries: enquiries.length, quoteEnquiries: 0, salesEnquiries: 0, droppedEnquiries: 0, openEnquiries: 0, conversionRate: 0,waitingPayment:0 };
    const sourceCounts: Record<string, number> = {};
    const employeePerformance: Record<string, Record<string, number>> = {};
    const statusCounts: Record<string, number> = {};
    const dailyRevenue: Record<string, number> = {};
    
    const employeeSegmentPerformance: Record<string, Record<SegmentType, { total: number; converted: number; dropped: number; convertedValue: number }>> = {};
    const allSegments: SegmentType[] = ['all', 'ecommerce', 'training', 'projects'];
    const initialSegmentPerformance = allSegments.reduce((acc, seg) => ({ ...acc, [seg]: { total: 0, converted: 0, dropped: 0, convertedValue: 0 } }), {}) as Record<SegmentType, { total: number; converted: number; dropped: number; convertedValue: number }>;

    enquiries.forEach((enq) => {
        const status = enq.status?.toLowerCase().trim() || 'open';
        const paymentStatus = enq.paymentStatus?.toLowerCase().trim() || 'open';
        const employeeName = getEmployeeName(enq.assignedTo);
        const rawType = enq.type?.toLowerCase();
        const segment: SegmentType = (rawType === 'ecommerce' || rawType === 'b2c' ? 'ecommerce' : rawType === 'training' ? 'training' : rawType === 'projects' || rawType === 'b2b' ? 'projects' : 'all') as SegmentType;
        const revenue = Number(enq.value) || 0;

        const isPaid = ['paid'].includes(paymentStatus);
        const notPaid = ['not paid'].includes(paymentStatus);
        const isSales = ['paid'].includes(paymentStatus);
        const isQuote = status === 'quote';
        const isDropped = status === 'dropped';
        
        let chartStatus = 'Open';
        
        if (isSales) { 
            stats.totalRevenue += revenue; 
            chartStatus = 'Converted';
        } else if (isQuote) { 
            chartStatus = 'Quote'; 
            stats.quoteEnquiries += 1; 
        } else if (isDropped) { 
            chartStatus = 'Dropped'; 
            stats.droppedEnquiries += 1; 
        } else if(notPaid)
        {
            stats.waitingPayment+=revenue;
        }
        else { 
            stats.openEnquiries += 1; 
        }

        if (isSales) stats.salesEnquiries += 1;
        statusCounts[chartStatus] = (statusCounts[chartStatus] || 0) + 1;
        
        if (isPaid) {
            const date = (enq.paidDate || enq.createdAt) as Timestamp;
            const dateKey = date?.toDate()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
            dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + revenue;
        }

        if (!employeeSegmentPerformance[employeeName]) {
            employeeSegmentPerformance[employeeName] = JSON.parse(JSON.stringify(initialSegmentPerformance));
        }
        
        const segmentsToUpdate = [segment];
        if (segment !== 'all') segmentsToUpdate.push('all');

        segmentsToUpdate.forEach(seg => {
            employeeSegmentPerformance[employeeName][seg].total += 1;
            
            if (isSales) {
                employeeSegmentPerformance[employeeName][seg].converted += 1;
                employeeSegmentPerformance[employeeName][seg].convertedValue += revenue;
            } else if (isDropped) {
                employeeSegmentPerformance[employeeName][seg].dropped += 1;
            }
        });
        
        const source = enq.mode || enq.source || "Unknown";
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;

        const enqDate = (enq.createdAt as Timestamp)?.toDate() || new Date();
        const monthYear = enqDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!employeePerformance[monthYear]) employeePerformance[monthYear] = {};
        employeePerformance[monthYear][employeeName] = (employeePerformance[monthYear][employeeName] || 0) + 1;
    });
    
    const totalClosed = stats.salesEnquiries + stats.droppedEnquiries;
    if (totalClosed > 0) {
      stats.conversionRate = (stats.salesEnquiries / totalClosed) * 100;
    }
    
    const formattedEmployeePerformance: Record<string, Record<SegmentType, SegmentPerformance>> = {};
    Object.entries(employeeSegmentPerformance).forEach(([name, segments]) => {
        formattedEmployeePerformance[name] = {} as Record<SegmentType, SegmentPerformance>;
        allSegments.forEach(seg => {
            const { total, converted, dropped, convertedValue } = segments[seg];
            const closedForConversion = converted + dropped;
            formattedEmployeePerformance[name][seg] = {
                totalEnq: total,
                conversion: closedForConversion > 0 ? (converted / closedForConversion) * 100 : 0,
                salesValue: convertedValue,
            };
        });
    });

    const leadsBySource = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));
    const funnelOrder = ['Quote', 'Converted', 'Dropped', 'Open'];
    const statusDistribution = Object.entries(statusCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => {
            const indexA = funnelOrder.indexOf(a.name);
            const indexB = funnelOrder.indexOf(b.name);
            return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
        });

    const allEmployeeNames = [...new Set(Object.values(employeePerformance).flatMap(month => Object.keys(month)))].sort();
    const employeeLeadsChartData = Object.entries(employeePerformance).map(([month, leads]) => ({ month, ...leads }));
    const revenueTrend = Object.entries(dailyRevenue)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      stats, leadsBySource, employeeLeads: { chartData: employeeLeadsChartData, employeeNames: allEmployeeNames },
      statusDistribution, revenueTrend, employeeSegmentPerformance: formattedEmployeePerformance,
    };
  }, [getEmployeeName]);

  // --- REAL-TIME DATA FETCHING (Unchanged) ---
  useEffect(() => { 
    if (!user || !startDate || !endDate) return;
    setLoading(true);

    const enquiriesRef = collection(db, "enquiries");
    const q = query(
      enquiriesRef,
      where("createdAt", ">=", Timestamp.fromDate(new Date(startDate))),
      where("createdAt", "<=", Timestamp.fromDate(new Date(endDate + "T23:59:59")))
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const enquiries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Enquiry[];
      
      let filteredEnquiries = enquiries;
      if (user.role === 'manager') {
          const teamAndManagerUids = [...teamMemberUids, user.uid];
          filteredEnquiries = enquiries.filter(enq => enq.assignedTo && teamAndManagerUids.includes(enq.assignedTo));
      } else if (user.role === 'staff') {
          console.log(querySnapshot);
          filteredEnquiries = enquiries.filter(enq => enq.assignedTo === user.uid);
      }
      
      const processedData = processEnquiryData(filteredEnquiries);
      console.log(dashboardData);
      setDashboardData(processedData);
      setLoading(false);
    }, (error) => {
      console.error("Failed to fetch real-time dashboard data:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [startDate, endDate, processEnquiryData, user, teamMemberUids]); 
  
  const formatCurrency = (amount: number) =>
    `₹ ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    
  // --- CHART DEFINITIONS ---
  
  // 🚀 MODIFIED: The Pie chart now uses a custom label component to guarantee visibility.
  const LeadsPieChart = useMemo(() => (
    <div className="overflow-x-hidden w-full"> 
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                <Pie 
                  data={dashboardData.leadsBySource} 
                  cx="50%" 
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius="80%" 
                  dataKey="value"
                >
                    {dashboardData.leadsBySource.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => `${value} leads`} />
                <Legend layout="horizontal" align="center" verticalAlign="bottom"/>
            </PieChart>
        </ResponsiveContainer>
    </div>
  ), [dashboardData.leadsBySource]);

  const EmployeeBarChart = useMemo(() => (
    <div className="overflow-x-hidden w-full"> 
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart 
                data={dashboardData.employeeLeads.chartData} 
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                barCategoryGap="15%"
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => Number.isInteger(value) ? value : ''} allowDecimals={false} />
                <Tooltip formatter={(value, name) => [`${value} Leads`, name]} cursor={{ fill: 'rgba(240, 240, 240, 0.5)' }} />
                <Legend />
                {dashboardData.employeeLeads.employeeNames.map((name, index) => (
                    <Bar key={name} dataKey={name} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
            </BarChart>
        </ResponsiveContainer>
    </div>
  ), [dashboardData.employeeLeads]);
  
  const StatusFunnelChart = useMemo(() => (
    <div className="overflow-x-hidden w-full"> 
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart 
                  data={dashboardData.statusDistribution} 
                  layout="vertical" 
                  margin={{ top: 10, right: 30, left: 30, bottom: 0 }}
              >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis 
                      type="number" 
                      allowDecimals={false}
                      tickFormatter={(value) => Number.isInteger(value) ? value : ''}
                  />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip 
                      cursor={{ fill: 'rgba(240, 240, 240, 0.5)' }}
                      formatter={(value) => `${value} enquiries`}
                  />
                  <Bar dataKey="value" barSize={35} radius={[0, 10, 10, 0]}>
                      {dashboardData.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Bar>
              </BarChart>
        </ResponsiveContainer>
    </div>
  ), [dashboardData.statusDistribution]);

  const RevenueTrendChart = useMemo(() => (
    <div className="overflow-x-hidden w-full"> 
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <AreaChart data={dashboardData.revenueTrend} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(dateStr) => new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}/>
                <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Total Revenue" 
                    stroke="#10B981" 
                    fill="url(#colorRevenue)" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    activeDot={{ r: 8 }} 
                />
                <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                </defs>
            </AreaChart>
        </ResponsiveContainer>
    </div>
  ), [dashboardData.revenueTrend]);

  if (!user) {
    return <div className="flex items-center justify-center h-screen bg-gray-100"><div>Loading Dashboard...</div></div>;
  }
  
  const totalEnquiries = dashboardData.stats.totalEnquiries || 1; 
  const conversionRate = dashboardData.stats.conversionRate;
  const quotePercent = (dashboardData.stats.quoteEnquiries / totalEnquiries) * 100;
  const salesPercent = (dashboardData.stats.salesEnquiries / totalEnquiries) * 100;

  const chartTitles = useMemo(() => {
    const role = user.role;
    if (role === 'manager') {
        return {
            leads: "Your Team's Monthly Leads",
            revenue: "Your Team's Revenue Trend",
            leaderboard: "Team Performance Leaderboard",
        };
    }
    if (role === 'staff') {
        return {
            leads: "Your Monthly Leads",
            revenue: "Your Revenue Trend",
            leaderboard: "Your Performance",
        };
    }
    // Admin (default)
    return {
        leads: "Monthly Employee-wise Leads (Comparison)",
        revenue: "Revenue Trend (Daily Paid Value)",
        leaderboard: "Employee Performance Leaderboard",
    };
  }, [user.role]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between p-4 max-w-screen-2xl mx-auto overflow-x-hidden">
          <h1 className="text-2xl font-bold text-gray-800 ml-10 md:ml-0">
            Ibots {user.role?.toUpperCase() || 'ADMIN'} Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="group relative">
                <div className="flex items-center space-x-2 cursor-pointer">
                    <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-indigo-500">
                        <span className="text-white font-bold text-sm">{user.employeeName ? user.employeeName.charAt(0).toUpperCase() : 'U'}</span>
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-gray-700">Welcome, {user.employeeName || user.role}</span>
                </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
        <section className="mb-6 bg-white p-4 rounded-xl shadow-md border border-gray-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center shrink-0"><Filter className="w-5 h-5 mr-2 text-indigo-500"/>Analytics Period</h3>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full md:w-auto justify-start md:justify-end">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label htmlFor="startDate" className="text-sm font-medium text-gray-600">From:</label>
                <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label htmlFor="endDate" className="text-sm font-medium text-gray-600">To:</label>
                <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
              </div>
            </div>
          </div>
        </section>
        
        {loading ? (
            <div className="flex justify-center items-center h-96">
                <RefreshCw className="w-12 h-12 animate-spin text-indigo-500" />
            </div>
        ) : (
          <div className="space-y-8">
            <SegmentTabs activeSegment={activeSegment} setActiveSegment={setActiveSegment} />
            {(user.role === 'admin' || user.role === 'manager') && (
              <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-4 sm:gap-5">
                  <StatCard title="Total Revenue" value={formatCurrency(dashboardData.stats.totalRevenue)} icon={DollarSign} color="green" progress={100} className="col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-2 xl:col-span-2"/>
                  <StatCard title="Waiting Payment" value={dashboardData.stats.waitingPayment} icon={DollarSign} color="red" progress={100} className="col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-1" />
                  <StatCard title="Total Enquiries" value={dashboardData.stats.totalEnquiries} icon={ClipboardList} color="blue" progress={100} className="col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-1" />
                  <StatCard title="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} icon={TrendingUp} color="pink" progress={conversionRate} />
                  <StatCard title="Quote Enquiries" value={dashboardData.stats.quoteEnquiries} icon={Target} color="indigo" progress={quotePercent} />
                  <StatCard title="Sales Enquiries" value={dashboardData.stats.salesEnquiries} icon={CheckCircle} color="teal" progress={salesPercent} />
                  <StatCard title="Dropped Enquiries" value={dashboardData.stats.droppedEnquiries} icon={XCircle} color="red" progress={100 - salesPercent} />
                  {user.role === 'admin' && (
                    <>
                        <StatCard title="Open Invoices" value={dashboardData.stats.openInvoices} icon={FileText} color="yellow" progress={100} />
                        <StatCard title="Due Invoices" value={dashboardData.stats.dueInvoices} icon={AlertTriangle} color="orange" progress={100} />
                    </>
                  )}
              </section>
            )}

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <ChartCard title="Leads by Source" icon={BarChart3}>
                {dashboardData.leadsBySource.length > 0 ? LeadsPieChart : <EmptyState />}
              </ChartCard>
              <ChartCard title="Enquiry Status Funnel (Count)" icon={Filter}>
                {dashboardData.statusDistribution.length > 0 ? StatusFunnelChart : <EmptyState />}
              </ChartCard>
              
              <ChartCard title={chartTitles.leads} icon={Users} className="lg:col-span-2">
                {dashboardData.employeeLeads.chartData.length > 0 ? EmployeeBarChart : <EmptyState />}
              </ChartCard>
              <ChartCard title={chartTitles.revenue} icon={LineChartIcon} className="lg:col-span-2">
                {dashboardData.revenueTrend.length > 0 ? RevenueTrendChart : <EmptyState />}
              </ChartCard>
            </section>
            
            {(user.role === 'admin' || user.role === 'manager') && (
                <EmployeePerformanceTable 
                    data={dashboardData.employeeSegmentPerformance} 
                    activeSegment={activeSegment}
                    formatCurrency={formatCurrency}
                    title={chartTitles.leaderboard}
                    className="lg:col-span-2"
                />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// --- Sub-components (All Unchanged) ---
const StatCard = ({ title, value, icon: Icon, color, progress, className = "" }: { title: string; value: string | number; icon: any; color: string; progress: number; className?: string }) => {
    const colorClasses = {
        green: { bg: 'bg-green-100', text: 'text-green-600', progress: 'bg-green-500' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-600', progress: 'bg-blue-500' },
        indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', progress: 'bg-indigo-500' },
        yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', progress: 'bg-yellow-500' },
        pink: { bg: 'bg-pink-100', text: 'text-pink-600', progress: 'bg-pink-500' },
        teal: { bg: 'bg-teal-100', text: 'text-teal-600', progress: 'bg-teal-500' },
        red: { bg: 'bg-red-100', text: 'text-red-600', progress: 'bg-red-500' },
        orange: { bg: 'bg-orange-100', text: 'text-orange-600', progress: 'bg-orange-500' },
    }[color] || { bg: 'bg-gray-100', text: 'text-gray-600', progress: 'bg-gray-500' };
    const safeProgress = Math.max(0, Math.min(100, progress || 0));
    return (
        <div className={`bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-xl p-3 sm:p-4 border border-gray-100 ${className}`}>
            <div className="flex flex-col items-center justify-center text-center">
                <div className="flex items-center justify-center space-x-1 w-full mb-1">
                    <div className={`p-2 rounded-full ${colorClasses.bg} ${colorClasses.text} flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-xl font-bold text-gray-800">{value}</div>
                </div>
                <div className="text-xs text-gray-500 font-medium w-full px-1 truncate">{title}</div>
            </div>
            <div className="mt-3 bg-gray-200 rounded-full h-1">
                <div className={`${colorClasses.progress} h-1 rounded-full`} style={{ width: `${safeProgress}%` }}></div>
            </div>
        </div>
    );
};

const ChartCard = ({ title, icon: Icon, children, className = "" }: { title: string; icon: any; children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-6 flex flex-col border border-gray-100 ${className}`}>
    <div className="flex items-center space-x-3 mb-6">
      <Icon className="w-6 h-6 text-gray-500" />
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400 min-h-[240px]">
    <BarChart3 className="w-20 h-20 text-gray-300 mb-4" />
    <p className="font-semibold text-lg">No data available</p>
    <p className="text-sm">Try adjusting the date range or adding new enquiries.</p>
  </div>
);

const segmentMap: Record<SegmentType, { name: string; icon: any; color: string }> = {
    all: { name: 'Dashboard Overview', icon: ClipboardList, color: 'text-indigo-600' },
    ecommerce: { name: 'E-commerce', icon: ShoppingCart, color: 'text-teal-600' },
    training: { name: 'Training', icon: GraduationCap, color: 'text-orange-600' },
    projects: { name: 'Projects', icon: Briefcase, color: 'text-blue-600' },
};

const SegmentTabs = ({ activeSegment, setActiveSegment }: { activeSegment: SegmentType, setActiveSegment: (s: SegmentType) => void }) => (
    <div className="flex flex-wrap gap-2 lg:gap-4 p-3 bg-white rounded-xl shadow-md border border-gray-200">
        {Object.entries(segmentMap).map(([key, { name, icon: Icon, color }]) => (
            <button
                key={key}
                onClick={() => setActiveSegment(key as SegmentType)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                    activeSegment === key
                        ? `bg-indigo-100 ${color} ring-2 ring-indigo-500/50 shadow-sm`
                        : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
                <Icon className={`w-5 h-5`} />
                <span>{name}</span>
            </button>
        ))}
    </div>
);

const EmployeePerformanceTable = ({ data, activeSegment, formatCurrency, title, className = "" }: { data: any, activeSegment: SegmentType, formatCurrency: (n: number) => string, title: string, className?: string }) => {
    type PerformanceRow = { name: string; totalEnq: number; conversion: number; salesValue: number; };

    const tableData: PerformanceRow[] = useMemo(() => {
        return Object.entries(data)
            .map(([employeeName, segments]) => {
                const segmentData = (segments as any)[activeSegment] || (segments as any).all;
                return { name: employeeName, ...segmentData, };
            })
            .filter(row => row.totalEnq > 0) 
            .sort((a, b) => b.salesValue - a.salesValue);
    }, [data, activeSegment]);
    
    const segmentName = segmentMap[activeSegment]?.name || 'All Segments';

    return (
        <ChartCard title={`${title} (${segmentName})`} icon={ListOrdered} className={className}>
            {tableData.length === 0 ? <EmptyState /> : (
                <div className="overflow-x-auto w-full"> 
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank / Employee</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Enquiries</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Value</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-teal-500 uppercase tracking-wider">Conversion %</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tableData.map((row, index) => (
                                <tr key={row.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50 hover:bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                                        <span className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center font-bold text-xs
                                            ${index === 0 ? 'bg-yellow-400 text-white' : 
                                              index === 1 ? 'bg-gray-400 text-white' : 
                                              index === 2 ? 'bg-amber-700 text-white' : 'bg-gray-200 text-gray-600'}
                                        `}>{index + 1}</span>
                                        {row.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{row.totalEnq}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 text-right">{formatCurrency(row.salesValue)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-teal-600 text-right">{row.conversion.toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </ChartCard>
    );
};

export default Dashboard;