export interface Department {
  name: string;
  completed: boolean;
  inProgress: boolean;
  hoursLate?: number;
  note?: string;
  employee?: string;
  startTime?: string;
  completedTime?: string;
  estimatedHours?: number;
  actualHours?: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface Order {
  id: string;
  customer: string;
  rep: string;
  dueDate: string;
  mfgId: string;
  progress: number;
  currentDept: string;
  status: 'LATE' | 'RISK' | 'OK';
  departments: Department[];
}

export interface EmployeeTask {
  orderId: string;
  mfgId: string;
  customer: string;
  dueDate: string;
  department: string;
  priority: 'high' | 'medium' | 'low';
  estimatedHours: number;
  status: 'pending' | 'in-progress' | 'completed' | 'flagged';
  assignedEmployee?: string;
  note?: string;
}

export const DEPARTMENTS = ['报价', '生产审批', '编程', '操机', '手工', '表面处理', '检验', '出货'];
