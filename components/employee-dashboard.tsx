'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle, Flag, Square, CheckSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Order, Department, EmployeeTask, DEPARTMENTS } from '@/lib/types';

// Generate employee tasks from orders
const generateEmployeeTasks = (orders: Order[], selectedDept: string): EmployeeTask[] => {
  const tasks: EmployeeTask[] = [];

  orders.forEach(order => {
    const currentDeptIndex = order.departments.findIndex(d => d.name === selectedDept);
    if (currentDeptIndex === -1) return;

    const dept = order.departments[currentDeptIndex];
    const prevDept = currentDeptIndex > 0 ? order.departments[currentDeptIndex - 1] : null;

    // Show task if: current department is in progress, or ready to be started.
    // Ready means previous department is completed (or doesn't exist for first dept),
    // current department isn't completed and hasn't started yet.
    const canStart = !dept.completed && !dept.inProgress && (!prevDept || prevDept.completed);

    if (dept.inProgress || canStart) {
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

    const priorityOrder = { high: 0, medium: 1, low: 2 } as const;
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
};

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

export default function EmployeeDashboard() {
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

      <EmployeeInterface orders={orders} refresh={fetchOrders} />
    </div>
  );
}

