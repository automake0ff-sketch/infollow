export type Agency = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  agencyId: string;
  email: string;
  fullName: string;
  role: 'owner' | 'agent';
  createdAt: string;
  updatedAt: string;
};

export type LeadType = 'buyer' | 'seller' | 'owner' | 'tenant' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'interested' | 'visit_pending' | 'visit_done' | 'negotiation' | 'closed' | 'not_interested';

export type Lead = {
  id: string;
  agencyId: string;
  name: string;
  phone: string | null;
  email: string | null;
  type: LeadType;
  status: LeadStatus;
  budget: number | null;
  zone: string | null;
  propertyType: string | null;
  bedrooms: number | null;
  preferences: string | null;
  notes: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Property = {
  id: string;
  agencyId: string;
  reference: string;
  type: string;
  operation: 'sale' | 'rent';
  price: number;
  zone: string;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  surface: number | null;
  description: string | null;
  features: string[] | null;
  status: 'available' | 'reserved' | 'sold' | 'rented';
  createdAt: string;
  updatedAt: string;
};

export type VisitStatus = 'scheduled' | 'completed' | 'cancelled';

export type Visit = {
  id: string;
  agencyId: string;
  leadId: string;
  propertyId: string | null;
  scheduledAt: string;
  status: VisitStatus;
  notes: string | null;
  result: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskStatus = 'pending' | 'completed' | 'cancelled';
export type TaskType = 'follow_up' | 'visit' | 'call' | 'message' | 'other';

export type Task = {
  id: string;
  agencyId: string;
  leadId: string;
  visitId: string | null;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  dueDate: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ActivityType = 'call' | 'message' | 'email' | 'note' | 'system';

export type Activity = {
  id: string;
  agencyId: string;
  leadId: string;
  type: ActivityType;
  content: string | null;
  createdBy: string | null;
  createdAt: string;
};

export type CommercialMessage = {
  id: string;
  agencyId: string;
  leadId: string;
  content: string;
  tone: string;
  status: 'draft' | 'edited' | 'sent' | 'scheduled';
  createdAt: string;
  updatedAt: string;
};
