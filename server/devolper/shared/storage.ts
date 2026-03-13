import { randomUUID } from "crypto";

// Определение интерфейсов, ранее находившихся в schema.ts
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

export interface IStorage {
  getSubscriber(id: number): Promise<Subscriber | undefined>;
  getSubscriberByEmail(email: string): Promise<Subscriber | undefined>;
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  updateSubscriber(id: number, updates: Partial<InsertSubscriber>): Promise<Subscriber | undefined>;
  deleteSubscriber(id: number): Promise<boolean>;
  getAllSubscribers(): Promise<Subscriber[]>;

  getNewsletter(id: string): Promise<Newsletter | undefined>;
  getAllNewsletters(): Promise<Newsletter[]>;
  createNewsletter(newsletter: InsertNewsletter): Promise<Newsletter>;

  getStats(): Promise<Stats | undefined>;
  updateStats(stats: InsertStats): Promise<Stats>;
}

export class MemStorage implements IStorage {
  private subscribers: Map<number, Subscriber> = new Map();
  private newsletters: Map<string, Newsletter> = new Map();
  private stats: Stats;
  private nextSubscriberId = 1;

  constructor() {
    this.stats = {
      id: randomUUID(),
      activeSubscribers: 0,
      satisfactionRate: 98,
      contentViews: 0,
      expertAuthors: 500,
    };
  }

  async getSubscriber(id: number): Promise<Subscriber | undefined> {
    return this.subscribers.get(id);
  }

  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    for (const subscriber of this.subscribers.values()) {
      if (subscriber.email === email) {
        return subscriber;
      }
    }
    return undefined;
  }

  async createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber> {
    const id = this.nextSubscriberId++;
    const newSubscriber: Subscriber = {
      id,
      ...subscriber
    };
    
    this.subscribers.set(id, newSubscriber);
    this.updateSubscriberStats();
    return newSubscriber;
  }

  async updateSubscriber(id: number, updates: Partial<InsertSubscriber>): Promise<Subscriber | undefined> {
    const subscriber = this.subscribers.get(id);
    if (!subscriber) return undefined;
    
    const updatedSubscriber = { ...subscriber, ...updates };
    this.subscribers.set(id, updatedSubscriber);
    return updatedSubscriber;
  }

  async deleteSubscriber(id: number): Promise<boolean> {
    const existed = this.subscribers.delete(id);
    if (existed) {
      this.updateSubscriberStats();
    }
    return existed;
  }

  async getAllSubscribers(): Promise<Subscriber[]> {
    return Array.from(this.subscribers.values());
  }

  async getNewsletter(id: string): Promise<Newsletter | undefined> {
    return this.newsletters.get(id);
  }

  async getAllNewsletters(): Promise<Newsletter[]> {
    return Array.from(this.newsletters.values());
  }

  async createNewsletter(newsletter: InsertNewsletter): Promise<Newsletter> {
    const id = randomUUID();
    const newNewsletter: Newsletter = {
      id,
      title: newsletter.title,
      content: newsletter.content,
      createdAt: new Date(),
      sentAt: newsletter.sendImmediately ? new Date() : undefined,
      views: 0
    };
    
    this.newsletters.set(id, newNewsletter);
    return newNewsletter;
  }

  async getStats(): Promise<Stats | undefined> {
    return this.stats;
  }

  async updateStats(stats: InsertStats): Promise<Stats> {
    this.stats = {
      ...this.stats,
      ...stats,
      id: this.stats.id
    };
    return this.stats;
  }

  private updateSubscriberStats() {
    this.stats = {
      ...this.stats,
      activeSubscribers: this.subscribers.size
    };
  }

  async incrementNewsletterViews(id: string): Promise<void> {
    const newsletter = this.newsletters.get(id);
    if (newsletter) {
      newsletter.views = (newsletter.views || 0) + 1;
      this.newsletters.set(id, newsletter);
      this.stats.contentViews += 1;
    }
  }

  async markNewsletterSent(id: string): Promise<void> {
    const newsletter = this.newsletters.get(id);
    if (newsletter && !newsletter.sentAt) {
      newsletter.sentAt = new Date();
      this.newsletters.set(id, newsletter);
    }
  }
}