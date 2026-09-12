export interface Client {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
  createdAt: string;
  _count?: {
    projects: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  clientId: string;
  client: Client;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
}
