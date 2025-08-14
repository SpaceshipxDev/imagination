'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronRight, FolderOpen, Clock, CheckCircle, AlertCircle, User, Calendar, Play, Flag, Users, Square, CheckSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Order {
  id: string;
  customer: string;
  rep: string;
  dueDate: string;
  mfgId: string;
  progress: number;
  currentDept: string;
  status: 'LATE' | 'RISK' | 'OK';
  departments: Department[];
}

interface Department {
  name: string;
  completed: boolean;
  inProgress: boolean;
  hoursLate?: number;
  note?: string;
  employee?: string;
  startTime?: string;
  completedTime?: string;
  estimatedHours?: number;
  actualHours?: number;
  priority?: 'high' | 'medium' | 'low';
}

interface EmployeeTask {
  orderId: string;
  mfgId: string;
  customer: string;
  dueDate: string;
  department: string;
  priority: 'high' | 'medium' | 'low';
  estimatedHours: number;
  status: 'pending' | 'in-progress' | 'completed' | 'flagged';
  assignedEmployee?: string;
  note?: string;
}
const DEPARTMENTS = ['报价', '生产审批', '编程', '操机', '手工', '表面处理', '检验', '出货'];

// Generate employee tasks from orders
const generateEmployeeTasks = (orders: Order[], selectedDept: string): EmployeeTask[] => {
  const tasks: EmployeeTask[] = [];
  
  orders.forEach(order => {
    const currentDeptIndex = order.departments.findIndex(d => d.name === selectedDept);
    if (currentDeptIndex === -1) return;
    
    const dept = order.departments[currentDeptIndex];
    const prevDept = currentDeptIndex > 0 ? order.departments[currentDeptIndex - 1] : null;
    
    // Show task if: current department is in progress, or previous department is completed and current is not started
    if (dept.inProgress || (prevDept?.completed && !dept.completed && !dept.inProgress)) {
      tasks.push({
        orderId: order.id,
        mfgId: order.mfgId,
        customer: order.customer,
        dueDate: order.dueDate,
        department: selectedDept,
        priority: dept.priority || 'medium',
        estimatedHours: dept.estimatedHours || 0,
        status: dept.inProgress ? 'in-progress' : 'pending',
        assignedEmployee: dept.employee,
        note: dept.note
      });
    }
  });
  
  return tasks.sort((a, b) => {
    // Sort by: in-progress first, then by priority, then by due date
    if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
    if (b.status === 'in-progress' && a.status !== 'in-progress') return 1;
    
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
};

function StatusBadge({ status }: { status: Order['status'] }) {
  const variants = {
    LATE: { color: 'bg-red-500', text: 'text-white', label: 'LATE' },
    RISK: { color: 'bg-yellow-500', text: 'text-white', label: 'RISK' },
    OK: { color: 'bg-green-500', text: 'text-white', label: 'OK' }
  };
  
  const variant = variants[status];
  
  return (
    <Badge className={`${variant.color} ${variant.text} hover:opacity-90 text-xs`}>
      {status === 'LATE' && '🔴'} {status === 'RISK' && '🟡'} {status === 'OK' && '🟢'} {variant.label}
    </Badge>
  );
}

function PriorityDot({ priority }: { priority?: 'high' | 'medium' | 'low' }) {
  if (!priority) return null;
  
  const colors = {
    high: 'bg-red-400',
    medium: 'bg-yellow-400',
    low: 'bg-green-400'
  };
  
  return <div className={`w-1.5 h-1.5 rounded-full ${colors[priority]} opacity-60`} />;
}

function SimpleTaskRow({ 
  task, 
  onStart,
  onComplete,
  onFlag
}: {
  task: EmployeeTask;
  onStart: () => void;
  onComplete: () => void;
  onFlag: () => void;
}) {
  const isToday = task.dueDate === '12/25';
  const isDueTomorrow = task.dueDate === '12/26';
  
  const getDueDateDisplay = () => {
    if (isToday) return 'Due today';
    if (isDueTomorrow) return 'Due tomorrow';
    return `Due ${task.dueDate}`;
  };
  
  const getDueDateColor = () => {
    if (isToday) return 'text-red-600';
    if (isDueTomorrow) return 'text-orange-600';
    return 'text-gray-500';
  };
  
  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50/50 transition-colors">
      {/* Checkbox */}
      <div className="flex items-center">
        {task.status === 'completed' ? (
          <CheckSquare className="w-5 h-5 text-green-600" />
        ) : (
          <Square className="w-5 h-5 text-gray-400" />
        )}
      </div>
      
      {/* Task Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">
            {task.mfgId}
          </span>
          <span className="text-sm text-gray-700 truncate">
            {task.customer}
          </span>
          <span className={`text-sm ${getDueDateColor()}`}>
            {getDueDateDisplay()}
          </span>
          {task.note && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
              Issue
            </span>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        {task.status === 'pending' && (
          <Button
            size="sm"
            onClick={onStart}
            className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700"
          >
            Start
          </Button>
        )}

        {task.status === 'in-progress' && (
          <Button
            size="sm"
            onClick={onComplete}
            className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700"
          >
            Complete
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onFlag}
          className="h-8 px-3 text-xs border-gray-300 hover:bg-gray-50"
        >
          <Flag className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function EmployeeInterface({ orders, refresh }: { orders: Order[]; refresh: () => void }) {
  const [selectedDept, setSelectedDept] = useState('编程');
  const [searchTerm, setSearchTerm] = useState('');
  const departments = DEPARTMENTS;

  const tasks = generateEmployeeTasks(orders, selectedDept);

  const filteredTasks = tasks.filter(task =>
    task.mfgId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStart = async (orderId: string, dept: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department: dept, action: 'start' })
    });
    refresh();
  };

  const handleComplete = async (orderId: string, dept: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department: dept, action: 'complete' })
    });
    refresh();
  };

  const handleFlag = async (orderId: string, dept: string) => {
    const note = prompt('Issue note?') || '';
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department: dept, action: 'flag', note })
    });
    refresh();
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">Select your department:</span>
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-36 bg-gray-50 border-gray-200 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search MFG ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white text-sm h-9"
          />
        </div>
      </div>
      
      {/* Queue Header */}
      <div className="mb-4">
        <h3 className="text-base font-medium text-gray-900">Your Queue:</h3>
      </div>
      
      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.map(task => (
          <SimpleTaskRow
            key={`${task.mfgId}-${task.department}`}
            task={task}
            onStart={() => handleStart(task.orderId, task.department)}
            onComplete={() => handleComplete(task.orderId, task.department)}
            onFlag={() => handleFlag(task.orderId, task.department)}
          />
        ))}
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-gray-400 mb-2">
              <CheckCircle className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-gray-500 text-sm">No tasks in your queue</p>
            <p className="text-gray-400 text-xs mt-1">All caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DepartmentChip({ dept, index, isLast }: { dept: Department, index: number, isLast: boolean }) {
  const getStatusStyle = () => {
    if (dept.completed) return 'bg-green-100 text-green-700 border-green-200';
    if (dept.inProgress) return 'bg-blue-100 text-blue-700 border-blue-200 ring-1 ring-blue-300/50';
    return 'bg-gray-100 text-gray-500 border-gray-200';
  };

  const getTimeDisplay = () => {
    if (dept.completed && dept.completedTime) {
      return dept.completedTime.split(' ')[1]; // Just show time
    }
    if (dept.inProgress && dept.startTime) {
      return `Started ${dept.startTime.split(' ')[1]}`;
    }
    return null;
  };

  const getEfficiencyColor = () => {
    if (!dept.estimatedHours || !dept.actualHours) return 'text-gray-400';
    const efficiency = dept.actualHours / dept.estimatedHours;
    if (efficiency <= 1) return 'text-green-500';
    if (efficiency <= 1.2) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <TooltipProvider>
      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger>
            <div className={`
              relative px-2.5 py-1.5 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer
              ${getStatusStyle()}
            `}>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1">
                  {dept.completed && <CheckCircle className="w-3 h-3" />}
                  {dept.inProgress && <Clock className="w-3 h-3" />}
                  {dept.hoursLate && <AlertCircle className="w-3 h-3 text-red-500" />}
                  <PriorityDot priority={dept.priority} />
                </div>
                
                <div className="flex flex-col items-start min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate">{dept.name}</span>
                    {dept.hoursLate && (
                      <span className="text-xs bg-red-500 text-white px-1 py-0.5 rounded-full">
                        +{dept.hoursLate}h
                      </span>
                    )}
                  </div>
                  
                  {(dept.employee || getTimeDisplay()) && (
                    <div className="flex items-center gap-1 text-xs opacity-60 mt-0.5">
                      {dept.employee && (
                        <span className="truncate max-w-16">{dept.employee}</span>
                      )}
                      {dept.employee && getTimeDisplay() && <span>•</span>}
                      {getTimeDisplay() && (
                        <span className="text-xs">{getTimeDisplay()}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1.5 text-xs">
              <div className="font-medium">{dept.name}</div>
              {dept.employee && (
                <div>
                  <span className="text-gray-400">Employee: </span>
                  {dept.employee}
                </div>
              )}
              {dept.estimatedHours && (
                <div>
                  <span className="text-gray-400">Est: </span>
                  {dept.estimatedHours}h
                </div>
              )}
              {dept.actualHours && (
                <div className={getEfficiencyColor()}>
                  <span className="text-gray-400">Actual: </span>
                  {dept.actualHours}h
                </div>
              )}
              {dept.startTime && (
                <div>
                  <span className="text-gray-400">Started: </span>
                  {dept.startTime}
                </div>
              )}
              {dept.completedTime && (
                <div>
                  <span className="text-gray-400">Completed: </span>
                  {dept.completedTime}
                </div>
              )}
              {dept.note && (
                <div className="text-xs p-2 bg-yellow-50 rounded border-l-2 border-yellow-300 mt-2">
                  <span className="text-gray-400">Note: </span>
                  {dept.note}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
        
        {!isLast && (
          <ChevronRight className="w-3 h-3 text-gray-300 mx-1.5 flex-shrink-0" />
        )}
      </div>
    </TooltipProvider>
  );
}

function DepartmentFlow({ departments, mfgId }: { departments: Department[], mfgId: string }) {
  const currentDept = departments.find(d => d.inProgress);
  
  return (
    <div className="px-6 py-4 bg-gray-50/40 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="font-medium text-gray-900 text-sm">{mfgId}</span>
          <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs text-blue-600 cursor-pointer hover:underline">Files</span>
        </div>
        
        {currentDept && (
          <div className="text-xs text-gray-500">
            Current: <span className="font-medium text-blue-600">{currentDept.name}</span>
            {currentDept.employee && (
              <span className="ml-1 text-gray-400">({currentDept.employee})</span>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-start gap-1.5 flex-wrap mb-4">
        {departments.map((dept, index) => (
          <DepartmentChip 
            key={dept.name} 
            dept={dept} 
            index={index}
            isLast={index === departments.length - 1}
          />
        ))}
      </div>
      
      {currentDept?.note && (
        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-blue-900 text-xs">{currentDept.name}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <p className="text-blue-800 text-xs mb-2">&quot;{currentDept.note}&quot;</p>
              <div className="flex items-center gap-3 text-xs text-blue-600">
                {currentDept.employee && (
                  <span>{currentDept.employee}</span>
                )}
                {currentDept.startTime && (
                  <span>Started {currentDept.startTime}</span>
                )}
                {currentDept.actualHours && currentDept.estimatedHours && (
                  <span className={currentDept.actualHours > currentDept.estimatedHours ? 'text-red-600' : 'text-green-600'}>
                    {currentDept.actualHours}/{currentDept.estimatedHours}h
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <>
      <tr 
        className="hover:bg-gray-50/50 transition-colors cursor-pointer border-b border-gray-100"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-6 text-left">
          <div className="flex items-center gap-2">
            {expanded ? 
              <ChevronDown className="w-4 h-4 text-gray-400" /> : 
              <ChevronRight className="w-4 h-4 text-gray-400" />
            }
            <span className="font-medium text-gray-900 text-sm">{order.customer}</span>
          </div>
        </td>
        <td className="py-3 px-6 text-gray-600 text-sm">{order.rep}</td>
        <td className="py-3 px-6 text-gray-600 text-sm">{order.dueDate}</td>
        <td className="py-3 px-6">
          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
            {order.mfgId}
          </span>
        </td>
        <td className="py-3 px-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-xs">
              <Progress value={order.progress} className="h-2" />
            </div>
            <span className="text-sm font-medium text-gray-700 min-w-[2.5rem] text-right">
              {order.progress}%
            </span>
            <span className="text-xs text-gray-500 min-w-[4rem] truncate">
              {order.currentDept}
            </span>
          </div>
        </td>
        <td className="py-3 px-6">
          <StatusBadge status={order.status} />
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="p-0">
            <DepartmentFlow departments={order.departments} mfgId={order.mfgId} />
          </td>
        </tr>
      )}
    </>
  );
}

function ManagerInterface({ orders, refresh }: { orders: Order[]; refresh: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer: '', rep: '', dueDate: '', mfgId: '' });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.mfgId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.rep.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filter === 'All' ||
                         (filter === 'Active' && order.status !== 'LATE') ||
                         (filter === 'Late' && order.status === 'LATE') ||
                         (filter === 'Done' && order.progress === 100);

    return matchesSearch && matchesFilter;
  });

  const handleCreate = async () => {
    const newOrder: Order = {
      id: Date.now().toString(),
      customer: form.customer,
      rep: form.rep,
      dueDate: form.dueDate,
      mfgId: form.mfgId,
      progress: 0,
      currentDept: DEPARTMENTS[0],
      status: 'OK',
      departments: DEPARTMENTS.map(name => ({ name, completed: false, inProgress: false }))
    };
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    });
    setOpen(false);
    setForm({ customer: '', rep: '', dueDate: '', mfgId: '' });
    refresh();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-60 bg-gray-50 border-gray-200 focus:bg-white text-sm h-9"
          />
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-28 bg-gray-50 border-gray-200 h-9 text-sm">
            <Filter className="w-3.5 h-3.5 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Late">Late</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setOpen(true)} className="ml-auto bg-black text-white hover:bg-gray-800">
          Add Job
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Customer" value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})} />
            <Input placeholder="Rep" value={form.rep} onChange={e=>setForm({...form,rep:e.target.value})} />
            <Input placeholder="Due Date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} />
            <Input placeholder="MFG ID" value={form.mfgId} onChange={e=>setForm({...form,mfgId:e.target.value})} />
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} className="bg-black text-white hover:bg-gray-800">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              <th className="text-left py-3 px-6 font-medium text-gray-700 text-sm">Customer</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700 text-sm">Rep</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700 text-sm">Due</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700 text-sm">MFG ID</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700 text-sm">Progress</th>
              <th className="text-left py-3 px-6 font-medium text-gray-700 text-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </tbody>
        </table>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <Search className="w-10 h-10 mx-auto" />
            </div>
            <p className="text-gray-500 text-sm">No orders found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard({ initialTab = 'manager', singleView = false }: { initialTab?: 'manager' | 'employee'; singleView?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-medium text-gray-900">CNC Manufacturing</h1>
              <p className="text-gray-600 mt-0.5 text-sm">Priority List with Progress Tracking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {singleView ? (
        initialTab === 'manager' ? (
          <ManagerInterface orders={orders} refresh={fetchOrders} />
        ) : (
          <EmployeeInterface orders={orders} refresh={fetchOrders} />
        )
      ) : (
        <Tabs defaultValue={initialTab} className="w-full">
          <div className="max-w-7xl mx-auto px-6">
            <TabsList className="grid w-48 grid-cols-2 mt-4">
              <TabsTrigger value="manager" className="text-sm">
                <Users className="w-4 h-4 mr-1.5" />
                Manager
              </TabsTrigger>
              <TabsTrigger value="employee" className="text-sm">
                <User className="w-4 h-4 mr-1.5" />
                Employee
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="manager" className="mt-0">
            <ManagerInterface orders={orders} refresh={fetchOrders} />
          </TabsContent>

          <TabsContent value="employee" className="mt-0">
            <EmployeeInterface orders={orders} refresh={fetchOrders} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
