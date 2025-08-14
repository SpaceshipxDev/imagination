import ManagerInterface from '@/components/ManagerInterface';

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-medium text-gray-900">CNC Manufacturing</h1>
              <p className="text-gray-600 mt-0.5 text-sm">Priority List with Progress Tracking</p>
            </div>
          </div>
        </div>
      </div>
      <ManagerInterface />
    </div>
  );
}
