export interface Subscriber {
  id: number;
  name: string;
  email: string;
}

export interface InsertSubscriber {
  name: string;
  email: string;
}

export interface Newsletter {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  sentAt?: Date;
  views: number;
}

export interface InsertNewsletter {
  title: string;
  content: string;
  sendImmediately?: boolean;
}

export interface Stats {
  id: string;
  activeSubscribers: number;
  satisfactionRate: number;
  contentViews: number;
  expertAuthors: number;
}

export interface InsertStats {
  activeSubscribers?: number;
  satisfactionRate?: number;
  contentViews?: number;
  expertAuthors?: number;
}