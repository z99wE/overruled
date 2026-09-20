export interface D1Result {
  meta: { changes: number; last_row_id?: number };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

export interface AiLike {
  run(model: string, input: unknown): Promise<unknown>;
}

export interface AppEnv {
  DB: D1Database;
  AI?: AiLike;
}