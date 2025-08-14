import fs from 'fs/promises';
import path from 'path';
import { Order } from '@/lib/types';

const dataPath = path.join(process.cwd(), 'data', 'orders.json');

export async function readOrders(): Promise<Order[]> {
  try {
    const data = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(data) as Order[];
  } catch {
    return [];
  }
}

export async function writeOrders(orders: Order[]): Promise<void> {
  await fs.writeFile(dataPath, JSON.stringify(orders, null, 2), 'utf-8');
}
