'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronRight, FolderOpen, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Order, Department } from '@/lib/types';

const defaultDepartments: Department[] = [
  { name: '报价', completed: false, inProgress: false, priority: 'high' },
  { name: '生产审批', completed: false, inProgress: false, priority: 'medium' },
  { name: '编程', completed: false, inProgress: false, priority: 'high' },
  { name: '操机', completed: false, inProgress: false, priority: 'medium' },
  { name: '手工', completed: false, inProgress: false, priority: 'low' },
  { name: '表面处理', completed: false, inProgress: false, priority: 'medium' },
  { name: '检验', completed: false, inProgress: false, priority: 'high' },
  { name: '出货', completed: false, inProgress: false, priority: 'low' },
];

function StatusBadge({ status }: { status: Order['status'] }) {
  const variants = {
    LATE: { color: 'bg-red-500', text: 'text-white', label: 'LATE' },
    RISK: { color: 'bg-yellow-500', text: 'text-white', label: 'RISK' },
    OK: { color: 'bg-green-500', text: 'text-white', label: 'OK' }
  };
  const variant = variants[status];
  return (
    <Badge className={`${variant.color} ${variant.text} hover:opacity-90 text-xs`}>
      {variant.label}
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

function DepartmentChip({ dept, index, isLast }: { dept: Department; index: number; isLast: boolean }) {
  const getStatusStyle = () => {
    if (dept.completed) return 'bg-green-100 text-green-700 border-green-200';
    if (dept.inProgress) return 'bg-blue-100 text-blue-700 border-blue-200 ring-1 ring-blue-300/50';
    return 'bg-gray-100 text-gray-500 border-gray-200';
  };

  return (
    <TooltipProvider>
      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger>
            <div
              className={`relative px-2.5 py-1.5 rounded-lg border ${getStatusStyle()} transition-all duration-200 hover:shadow-sm cursor-pointer`}
            >
              <div className="flex items-center gap-1.5">
                <PriorityDot priority={dept.priority} />
                <span className="text-xs font-medium truncate">{dept.name}</span>
                {dept.hoursLate && (
                  <span className="text-xs bg-red-500 text-white px-1 py-0.5 rounded-full">
                    +{dept.hoursLate}h
                  </span>
                )}
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
                <div>
                  <span className="text-gray-400">Actual: </span>
                  {dept.actualHours}h
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
        {!isLast && <div className="w-3 h-0.5 bg-gray-200" />}
      </div>
    </TooltipProvider>
  );
}

function DepartmentFlow({ departments, mfgId }: { departments: Department[]; mfgId: string }) {
  return (
    <div className="px-6 py-4 bg-gray-50/40 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="font-medium text-gray-900 text-sm">{mfgId}</span>
          <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs text-blue-600 cursor-pointer hover:underline">Files</span>
        </div>
      </div>
      <div className="flex items-start gap-1.5 flex-wrap">
        {departments.map((dept, index) => (
          <DepartmentChip key={dept.name} dept={dept} index={index} isLast={index === departments.length - 1} />
        ))}
      </div>
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
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            <span className="font-medium text-gray-900 text-sm">{order.customer}</span>
          </div>
        </td>
        <td className="py-3 px-6 text-gray-600 text-sm">{order.rep}</td>
        <td className="py-3 px-6 text-gray-600 text-sm">{order.dueDate}</td>
        <td className="py-3 px-6">
          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{order.mfgId}</span>
        </td>
        <td className="py-3 px-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-xs">
              <Progress value={order.progress} className="h-2" />
            </div>
            <span className="text-sm font-medium text-gray-700 min-w-[2.5rem] text-right">{order.progress}%</span>
            <span className="text-xs text-gray-500 min-w-[4rem] truncate">{order.currentDept}</span>
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

export default function ManagerInterface() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer: '', rep: '', dueDate: '', mfgId: '' });

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const addOrder = async () => {
    const newOrder: Order = {
      id: '',
      customer: form.customer,
      rep: form.rep,
      dueDate: form.dueDate,
      mfgId: form.mfgId,
      progress: 0,
      currentDept: '报价',
      status: 'OK',
      departments: defaultDepartments.map(d => ({ ...d }))
    };
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    });
    setOpen(false);
    setForm({ customer: '', rep: '', dueDate: '', mfgId: '' });
    await fetchOrders();
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.mfgId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.rep.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === 'All' ||
      (filter === 'Active' && order.status !== 'LATE') ||
      (filter === 'Late' && order.status === 'LATE') ||
      (filter === 'Done' && order.progress === 100);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto bg-gray-900 text-white hover:bg-gray-800">
              <Plus className="w-4 h-4 mr-1" /> Add Job
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Job</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Customer" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} />
              <Input placeholder="Rep" value={form.rep} onChange={e => setForm({ ...form, rep: e.target.value })} />
              <Input placeholder="Due Date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              <Input placeholder="MFG ID" value={form.mfgId} onChange={e => setForm({ ...form, mfgId: e.target.value })} />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" onClick={addOrder} className="bg-blue-600 text-white">
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
            {filteredOrders.map(order => (
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
