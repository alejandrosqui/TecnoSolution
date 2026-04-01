// Shared TypeScript types used across marketing and app modules

export type UserRole = "superadmin" | "admin_local" | "tecnico";

export type PlanSlug = "free" | "professional" | "enterprise";

export type WorkOrderStatus =
  | "received"
  | "queued"
  | "diagnosing"
  | "waiting_customer_approval"
  | "quote_sent"
  | "approved"
  | "rejected"
  | "waiting_parts"
  | "repairing"
  | "repaired"
  | "ready_for_pickup"
  | "delivered"
  | "warranty"
  | "cancelled";

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}
