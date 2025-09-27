export type OrderTimelineEventType =
  | 'order_created'
  | 'status_update'
  | 'chat_message'
  | 'payment_recorded';

export type OrderTimelineActorType = 'customer' | 'admin' | 'system' | 'unknown';

export interface OrderTimelineEvent {
  event_id: string;
  order_id: number;
  event_type: OrderTimelineEventType;
  actor_type: OrderTimelineActorType;
  actor_id?: string | null;
  actor_name?: string | null;
  occurred_at: string;
  title: string;
  message?: string | null;
  metadata?: Record<string, any> | null;
}
