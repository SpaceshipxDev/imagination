import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      <h1 className="text-2xl font-medium">CNC Manufacturing</h1>
      <div className="space-x-4">
        <Link href="/manager" className="underline">Manager</Link>
        <Link href="/employee" className="underline">Employee</Link>
      </div>
    </div>
  );
}
