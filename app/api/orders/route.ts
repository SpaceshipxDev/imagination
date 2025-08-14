import { NextResponse } from 'next/server';
import { readOrders, writeOrders } from '@/lib/orders';
import { Order } from '@/lib/types';

export async function GET() {
  const orders = await readOrders();
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const orders = await readOrders();
  const newOrder: Order = await request.json();
  if (!newOrder.id) {
    newOrder.id = Date.now().toString();
  }
  orders.push(newOrder);
  await writeOrders(orders);
  return NextResponse.json(newOrder, { status: 201 });
}
