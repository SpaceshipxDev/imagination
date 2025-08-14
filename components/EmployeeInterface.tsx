'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle, Flag, Square, CheckSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Order, EmployeeTask } from '@/lib/types';

const departments = ['报价', '生产审批', '编程', '操机', '手工', '表面处理', '检验', '出货'];

const generateEmployeeTasks = (orders: Order[], selectedDept: string): EmployeeTask[] => {
  const tasks: EmployeeTask[] = [];
  orders.forEach(order => {
    const currentDeptIndex = order.departments.findIndex(d => d.name === selectedDept);
    if (currentDeptIndex === -1) return;
    const dept = order.departments[currentDeptIndex];
    const prevDept = currentDeptIndex > 0 ? order.departments[currentDeptIndex - 1] : null;
    if (dept.inProgress || (prevDept?.completed && !dept.completed && !dept.inProgress)) {
      tasks.push({
        orderId: order.id,
        mfgId: order.mfgId,
        customer: order.customer,
        dueDate: order.dueDate,
        department: selectedDept,
        priority: dept.priority || 'medium',
        estimatedHours: dept.estimatedHours || 0,
        status: dept.completed ? 'completed' : dept.inProgress ? 'in-progress' : 'pending',
        assignedEmployee: dept.employee,
        note: dept.note,
      });
    }
  });
  return tasks;
};

function SimpleTaskRow({
  task,
  onStart,
  onComplete,
  onFlag,
}: {
  task: EmployeeTask;
  onStart: (orderId: string, dept: string) => void;
  onComplete: (orderId: string, dept: string) => void;
  onFlag: (orderId: string, dept: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50/50 transition-colors">
      <div className="flex items-center">
        {task.status === 'completed' ? (
          <CheckSquare className="w-5 h-5 text-green-600" />
        ) : (
          <Square className="w-5 h-5 text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{task.mfgId}</span>
          <span className="text-sm text-gray-700 truncate">{task.customer}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {task.status === 'pending' && (
          <Button size="sm" onClick={() => onStart(task.orderId, task.department)} className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700">
            Start
          </Button>
        )}
        {task.status === 'in-progress' && (
          <Button size="sm" onClick={() => onComplete(task.orderId, task.department)} className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700">
            Complete
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => onFlag(task.orderId, task.department)} className="h-8 px-3 text-xs border-gray-300 hover:bg-gray-50">
          <Flag className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function EmployeeInterface() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedDept, setSelectedDept] = useState('编程');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrder = async (order: Order) => {
    await fetch(`/api/orders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    await fetchOrders();
  };

  const handleStart = async (orderId: string, deptName: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const dept = order.departments.find(d => d.name === deptName);
    if (!dept) return;
    dept.inProgress = true;
    dept.startTime = new Date().toISOString();
    await updateOrder(order);
  };

  const handleComplete = async (orderId: string, deptName: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const dept = order.departments.find(d => d.name === deptName);
    if (!dept) return;
    dept.inProgress = false;
    dept.completed = true;
    dept.completedTime = new Date().toISOString();
    const completedCount = order.departments.filter(d => d.completed).length;
    order.progress = Math.round((completedCount / order.departments.length) * 100);
    const nextDept = order.departments.find(d => !d.completed);
    order.currentDept = nextDept ? nextDept.name : 'Done';
    await updateOrder(order);
  };

  const handleFlag = async (orderId: string, deptName: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const dept = order.departments.find(d => d.name === deptName);
    if (!dept) return;
    dept.flagged = true;
    dept.note = 'Flagged by employee';
    order.status = 'RISK';
    await updateOrder(order);
  };

  const tasks = generateEmployeeTasks(orders, selectedDept).filter(task =>
    task.mfgId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">Select your department:</span>
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-36 bg-gray-50 border-gray-200 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search MFG ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white text-sm h-9"
          />
        </div>
      </div>
      <div className="mb-4">
        <h3 className="text-base font-medium text-gray-900">Your Queue:</h3>
      </div>
      <div className="space-y-2">
        {tasks.map(task => (
          <SimpleTaskRow
            key={`${task.orderId}-${task.department}`}
            task={task}
            onStart={handleStart}
            onComplete={handleComplete}
            onFlag={handleFlag}
          />
        ))}
        {tasks.length === 0 && (
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
