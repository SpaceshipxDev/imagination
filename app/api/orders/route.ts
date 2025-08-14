import { NextResponse } from 'next/server';
import { readOrders, writeOrders } from '@/lib/orders';

export async function GET() {
  const orders = await readOrders();
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const orders = await readOrders();
  const newOrder = await req.json();
  orders.push(newOrder);
  await writeOrders(orders);
  return NextResponse.json(newOrder, { status: 201 });
}
