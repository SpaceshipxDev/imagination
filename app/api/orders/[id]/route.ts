import { NextResponse } from 'next/server';
import { readOrders, writeOrders } from '@/lib/orders';
import { Order } from '@/lib/types';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const orders = await readOrders();
  const updated: Order = await request.json();
  const index = orders.findIndex(o => o.id === params.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  orders[index] = updated;
  await writeOrders(orders);
  return NextResponse.json(updated);
}
