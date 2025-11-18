/**
 * Base Repository Interface
 */
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(options?: FindManyOptions): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

/**
 * Find Many Options
 */
export interface FindManyOptions {
  where?: Record<string, any>;
  select?: Record<string, boolean>;
  include?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  take?: number;
  skip?: number;
}

/**
 * Transaction Options
 */
export interface TransactionOptions {
  isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
  maxWait?: number;
  timeout?: number;
}
