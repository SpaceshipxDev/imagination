import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFile = path.join(process.cwd(), 'data', 'orders.json');

async function readOrders() {
  const data = await fs.readFile(dataFile, 'utf-8');
  return JSON.parse(data);
}

async function writeOrders(orders: any) {
  await fs.writeFile(dataFile, JSON.stringify(orders, null, 2));
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const { action, department } = await request.json();
  const orders = await readOrders();
  const order = orders.find((o: any) => o.id === id);
  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const dept = order.departments.find((d: any) => d.name === department);
  if (!dept) {
    return NextResponse.json({ error: 'Department not found' }, { status: 400 });
  }
  if (action === 'start') {
    dept.inProgress = true;
  } else if (action === 'complete') {
    dept.inProgress = false;
    dept.completed = true;
  } else if (action === 'flag') {
    dept.note = 'FLAGGED';
    order.status = 'RISK';
  }
  const completedCount = order.departments.filter((d: any) => d.completed).length;
  order.progress = Math.round((completedCount / order.departments.length) * 100);
  const current = order.departments.find((d: any) => !d.completed);
  order.currentDept = current ? current.name : 'Done';
  await writeOrders(orders);
  return NextResponse.json(order);
}
