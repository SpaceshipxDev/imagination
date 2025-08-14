import { promises as fs } from 'fs';
import path from 'path';

const dataFile = path.join(process.cwd(), 'data', 'orders.json');

export async function readOrders() {
  const data = await fs.readFile(dataFile, 'utf-8');
  return JSON.parse(data);
}

export async function writeOrders(orders: any) {
  await fs.writeFile(dataFile, JSON.stringify(orders, null, 2));
}
