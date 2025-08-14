import { NextResponse } from 'next/server';
import { readOrders, writeOrders } from '@/lib/orders';

function computeProgress(order: any) {
  const total = order.departments.length;
  const completed = order.departments.filter((d: any) => d.completed).length;
  order.progress = Math.round((completed / total) * 100);
  const next = order.departments.find((d: any) => !d.completed);
  order.currentDept = next ? next.name : 'Completed';
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const { department, action, note } = await req.json();
  const orders = await readOrders();
  const order = orders.find((o: any) => o.id === id);
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const dept = order.departments.find((d: any) => d.name === department);
  if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 404 });

  const now = new Date().toISOString();
  if (action === 'start') {
    dept.inProgress = true;
    dept.startTime = now;
  }
  if (action === 'complete') {
    dept.inProgress = false;
    dept.completed = true;
    dept.completedTime = now;
  }
  if (action === 'flag') {
    dept.note = note;
    order.status = 'RISK';
  }
  computeProgress(order);
  await writeOrders(orders);
  return NextResponse.json(order);
}
