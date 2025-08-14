'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Department {
  name: string;
  completed: boolean;
  inProgress: boolean;
  note?: string;
}

interface Order {
  id: string;
  customer: string;
  dueDate: string;
  mfgId: string;
  departments: Department[];
}

interface Task {
  orderId: string;
  customer: string;
  dueDate: string;
  mfgId: string;
  department: string;
  status: 'pending' | 'in-progress' | 'completed';
}

function generateTasks(orders: Order[], dept: string): Task[] {
  const tasks: Task[] = [];
  orders.forEach(o => {
    const current = o.departments.find(d => d.name === dept);
    if (!current) return;
    const idx = o.departments.findIndex(d => d.name === dept);
    const prev = idx > 0 ? o.departments[idx - 1] : null;
    if (current.inProgress || (!current.completed && prev && prev.completed)) {
      tasks.push({
        orderId: o.id,
        customer: o.customer,
        dueDate: o.dueDate,
        mfgId: o.mfgId,
        department: dept,
        status: current.inProgress ? 'in-progress' : current.completed ? 'completed' : 'pending'
      });
    }
  });
  return tasks;
}

export default function EmployeePage() {
  const departments = ['报价','生产审批','编程','操机','手工','表面处理','检验','出货'];
  const [selectedDept, setSelectedDept] = useState(departments[0]);
  const [search, setSearch] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer: '', rep: '', dueDate: '', mfgId: '' });

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data);
    setTasks(generateTasks(data, selectedDept));
  }, [selectedDept]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const act = async (id: string, action: string) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, department: selectedDept })
    });
    fetchOrders();
  };

  const filtered = tasks.filter(t =>
    t.mfgId.toLowerCase().includes(search.toLowerCase()) ||
    t.customer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-medium">Employee</h1>
        <Button onClick={() => setShowForm(!showForm)}>Add Job</Button>
      </div>
      {showForm && (
        <div className="border p-4 rounded mb-4 space-y-2">
          <Input placeholder="Customer" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} />
          <Input placeholder="Rep" value={form.rep} onChange={e => setForm({ ...form, rep: e.target.value })} />
          <Input placeholder="Due Date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          <Input placeholder="MFG ID" value={form.mfgId} onChange={e => setForm({ ...form, mfgId: e.target.value })} />
          <Button onClick={async () => {
            await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(form)
            });
            setForm({ customer: '', rep: '', dueDate: '', mfgId: '' });
            setShowForm(false);
            fetchOrders();
          }}>Save</Button>
        </div>
      )}
      <div className="flex gap-4 mb-4">
        <Select value={selectedDept} onValueChange={setSelectedDept}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departments.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="space-y-2">
        {filtered.map(t => (
          <div key={t.orderId} className="border p-3 rounded flex justify-between items-center">
            <div>
              <div className="font-mono">{t.mfgId}</div>
              <div className="text-sm">{t.customer}</div>
            </div>
            <div className="space-x-2">
              {t.status === 'pending' && <Button size="sm" onClick={() => act(t.orderId, 'start')}>Start</Button>}
              {t.status === 'in-progress' && <Button size="sm" onClick={() => act(t.orderId, 'complete')}>Complete</Button>}
              <Button variant="outline" size="sm" onClick={() => act(t.orderId, 'flag')}>Flag</Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-500">No tasks</p>}
      </div>
    </div>
  );
}
