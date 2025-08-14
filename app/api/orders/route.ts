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

export async function GET() {
  const orders = await readOrders();
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const body = await request.json();
  const orders = await readOrders();
  const departments = ['报价','生产审批','编程','操机','手工','表面处理','检验','出货'];
  const newOrder = {
    id: Date.now().toString(),
    customer: body.customer,
    rep: body.rep,
    dueDate: body.dueDate,
    mfgId: body.mfgId,
    progress: 0,
    currentDept: departments[0],
    status: 'OK',
    departments: departments.map((name) => ({ name, completed: false, inProgress: false }))
  };
  orders.push(newOrder);
  await writeOrders(orders);
  return NextResponse.json(newOrder, { status: 201 });
}
