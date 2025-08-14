'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Order {
  id: string;
  customer: string;
  rep: string;
  dueDate: string;
  mfgId: string;
  progress: number;
  currentDept: string;
  status: string;
}

export default function ManagerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showForm, setShowForm] = useState(false);
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
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setForm({ customer: '', rep: '', dueDate: '', mfgId: '' });
    setShowForm(false);
    fetchOrders();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-medium">Manager</h1>
        <Button onClick={() => setShowForm(!showForm)}>Add Job</Button>
      </div>
      {showForm && (
        <div className="border p-4 rounded mb-6 space-y-2">
          <Input placeholder="Customer" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
          <Input placeholder="Rep" value={form.rep} onChange={(e) => setForm({ ...form, rep: e.target.value })} />
          <Input placeholder="Due Date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Input placeholder="MFG ID" value={form.mfgId} onChange={(e) => setForm({ ...form, mfgId: e.target.value })} />
          <Button onClick={addOrder}>Save</Button>
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Customer</th>
            <th className="py-2">Rep</th>
            <th className="py-2">Due</th>
            <th className="py-2">MFG ID</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} className="border-b">
              <td className="py-2">{o.customer}</td>
              <td className="py-2">{o.rep}</td>
              <td className="py-2">{o.dueDate}</td>
              <td className="py-2">{o.mfgId}</td>
              <td className="py-2">{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
