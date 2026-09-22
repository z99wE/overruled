import type { D1Database, D1PreparedStatement, D1Result } from './d1';

interface UserRow {
  id: string;
  email: string;
  pw_hash: string;
  pw_salt: string;
  iterations: number;
  role: string;
  created_at: string;
}

interface SessionRow {
  token_hash: string;
  user_id: string;
  created_at: string;
  expires_at: string;
}

interface LoginAttemptRow {
  email: string;
  attempted_at: string;
}

interface RecoveryCodeRow {
  user_id: string;
  code_hash: string;
  used_at: string | null;
}

interface PasswordResetRow {
  token_hash: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

interface MeterRow {
  account_id: string;
  day: string;
  credits: number;
  calls: number;
  burst_at: number;
  burst_count: number;
}

interface CreditOverrideRow {
  account_id: string;
  daily_cap: number;
}

/**
 * A tiny in-memory D1 stand-in that understands exactly the queries in db.ts.
 * Good enough to exercise the auth/run handlers end-to-end in tests.
 */
export function makeFakeDb() {
  const users: UserRow[] = [];
  const sessions: SessionRow[] = [];
  const runs = new Map<string, { data: string; updated_at: string }>();
  const loginAttempts: LoginAttemptRow[] = [];
  const recoveryCodes: RecoveryCodeRow[] = [];
  const passwordResets: PasswordResetRow[] = [];
  const meter = new Map<string, MeterRow>();
  const creditOverrides = new Map<string, CreditOverrideRow>();

  const setOverride = (accountId: string, dailyCap: number): void => {
    creditOverrides.set(accountId, { account_id: accountId, daily_cap: dailyCap });
  };

  const db: D1Database = {
    prepare(sql: string): D1PreparedStatement {
      let bound: unknown[] = [];
      const stmt: D1PreparedStatement = {
        bind(...values: unknown[]) {
          bound = values;
          return stmt;
        },
        async first<T>() {
          if (sql.includes('sessions s') && sql.includes('JOIN users')) {
            const [tokenHash, now] = bound;
            const s = sessions.find((x) => x.token_hash === tokenHash && x.expires_at > String(now));
            if (!s) return null;
            const u = users.find((x) => x.id === s.user_id);
            return (u ?? null) as T | null;
          }
          if (sql.includes('FROM users WHERE email = ?')) {
            return (users.find((u) => u.email === bound[0]) ?? null) as T | null;
          }
          if (sql.includes('FROM users WHERE id = ?')) {
            return (users.find((u) => u.id === bound[0]) ?? null) as T | null;
          }
          if (sql.includes('FROM runs WHERE user_id = ?')) {
            const r = runs.get(String(bound[0]));
            return r ? ({ user_id: bound[0], data: r.data, updated_at: r.updated_at } as T) : (null as T | null);
          }
          if (sql.includes('COUNT(*) AS n FROM recovery_codes')) {
            const [userId] = bound;
            const n = recoveryCodes.filter((c) => c.user_id === userId && !c.used_at).length;
            return { n } as T;
          }
          if (sql.includes('FROM recovery_codes WHERE user_id') && sql.includes('code_hash')) {
            const [userId, codeHash] = bound;
            const row = recoveryCodes.find((c) => c.user_id === userId && c.code_hash === codeHash && !c.used_at);
            return (row ? { user_id: row.user_id } : null) as T | null;
          }
          if (sql.includes('FROM password_resets r') && sql.includes('JOIN users')) {
            const [tokenHash, now] = bound;
            const r = passwordResets.find((x) => x.token_hash === tokenHash && !x.used_at && x.expires_at > String(now));
            if (!r) return null;
            const u = users.find((x) => x.id === r!.user_id);
            return (u ?? null) as T | null;
          }
          if (sql.includes('FROM credit_overrides WHERE account_id')) {
            const override = creditOverrides.get(String(bound[0]));
            return (override ? { daily_cap: override.daily_cap } : null) as T | null;
          }
          if (sql.includes('FROM meter WHERE account_id') && sql.includes('AND day')) {
            const row = meter.get(`${String(bound[0])}:${String(bound[1])}`);
            return (row
              ? { credits: row.credits, burst_at: row.burst_at, burst_count: row.burst_count }
              : null) as T | null;
          }
          return null as T | null;
        },
        async all<T>() {
          if (sql.includes('FROM login_attempts')) {
            const [email, cutoff] = bound;
            const rows = loginAttempts
              .filter((x) => x.email === email && x.attempted_at > String(cutoff))
              .sort((a, b) => (a.attempted_at < b.attempted_at ? -1 : 1))
              .map((x) => ({ attempted_at: x.attempted_at }));
            return { results: rows as T[], success: true };
          }
          return { results: [] as T[], success: true };
        },
        async run(): Promise<D1Result> {
          if (sql.startsWith('INSERT INTO users')) {
            const [id, email, pwHash, pwSalt, iterations, role, createdAt] = bound;
            users.push({
              id: String(id),
              email: String(email),
              pw_hash: String(pwHash),
              pw_salt: String(pwSalt),
              iterations: Number(iterations),
              role: String(role),
              created_at: String(createdAt),
            });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('UPDATE users SET role')) {
            const [role, email] = bound;
            const u = users.find((x) => x.email === email);
            if (!u) return { meta: { changes: 0 } };
            u.role = String(role);
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('DELETE FROM sessions WHERE user_id')) {
            const before = sessions.length;
            const id = String(bound[0]);
            for (let i = sessions.length - 1; i >= 0; i--) if (sessions[i].user_id === id) sessions.splice(i, 1);
            return { meta: { changes: before - sessions.length } };
          }
          if (sql.startsWith('INSERT INTO sessions')) {
            const [tokenHash, userId, createdAt, expiresAt] = bound;
            sessions.push({
              token_hash: String(tokenHash),
              user_id: String(userId),
              created_at: String(createdAt),
              expires_at: String(expiresAt),
            });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('DELETE FROM sessions WHERE token_hash')) {
            const before = sessions.length;
            const h = String(bound[0]);
            for (let i = sessions.length - 1; i >= 0; i--) if (sessions[i].token_hash === h) sessions.splice(i, 1);
            return { meta: { changes: before - sessions.length } };
          }
          if (sql.includes('INSERT INTO runs')) {
            const [userId, data, updatedAt] = bound;
            runs.set(String(userId), { data: String(data), updated_at: String(updatedAt) });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('INSERT INTO login_attempts')) {
            const [email, attemptedAt] = bound;
            loginAttempts.push({ email: String(email), attempted_at: String(attemptedAt) });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('DELETE FROM login_attempts WHERE attempted_at')) {
            const [cutoff] = bound;
            const before = loginAttempts.length;
            for (let i = loginAttempts.length - 1; i >= 0; i--) {
              if (loginAttempts[i].attempted_at < String(cutoff)) loginAttempts.splice(i, 1);
            }
            return { meta: { changes: before - loginAttempts.length } };
          }
          if (sql.startsWith('DELETE FROM login_attempts WHERE email = ?')) {
            const [email] = bound;
            const before = loginAttempts.length;
            for (let i = loginAttempts.length - 1; i >= 0; i--) {
              if (loginAttempts[i].email === String(email)) loginAttempts.splice(i, 1);
            }
            return { meta: { changes: before - loginAttempts.length } };
          }
          if (sql.startsWith('INSERT INTO recovery_codes')) {
            const [userId, codeHash] = bound;
            recoveryCodes.push({ user_id: String(userId), code_hash: String(codeHash), used_at: null });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('DELETE FROM recovery_codes WHERE user_id')) {
            const [userId] = bound;
            const before = recoveryCodes.length;
            for (let i = recoveryCodes.length - 1; i >= 0; i--) {
              if (recoveryCodes[i].user_id === String(userId)) recoveryCodes.splice(i, 1);
            }
            return { meta: { changes: before - recoveryCodes.length } };
          }
          if (sql.startsWith('UPDATE recovery_codes SET used_at')) {
            const [now, userId, codeHash] = bound;
            const row = recoveryCodes.find((c) => c.user_id === String(userId) && c.code_hash === String(codeHash));
            if (!row) return { meta: { changes: 0 } };
            row.used_at = String(now);
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('INSERT INTO password_resets')) {
            const [tokenHash, userId, createdAt, expiresAt] = bound;
            passwordResets.push({
              token_hash: String(tokenHash),
              user_id: String(userId),
              created_at: String(createdAt),
              expires_at: String(expiresAt),
              used_at: null,
            });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('DELETE FROM password_resets WHERE user_id')) {
            const [userId] = bound;
            const before = passwordResets.length;
            for (let i = passwordResets.length - 1; i >= 0; i--) {
              if (passwordResets[i].user_id === String(userId)) passwordResets.splice(i, 1);
            }
            return { meta: { changes: before - passwordResets.length } };
          }
          if (sql.startsWith('UPDATE password_resets SET used_at')) {
            const [now, tokenHash] = bound;
            const row = passwordResets.find((x) => x.token_hash === String(tokenHash));
            if (!row) return { meta: { changes: 0 } };
            row.used_at = String(now);
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('UPDATE users SET pw_hash')) {
            const [pwHash, pwSalt, iterations, userId] = bound;
            const u = users.find((x) => x.id === String(userId));
            if (!u) return { meta: { changes: 0 } };
            u.pw_hash = String(pwHash);
            u.pw_salt = String(pwSalt);
            u.iterations = Number(iterations);
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('INSERT INTO meter')) {
            const [accountId, day, cost, window, nextBurst] = bound;
            const key = `${String(accountId)}:${String(day)}`;
            const prev = meter.get(key);
            if (prev) {
              prev.credits += Number(cost);
              prev.calls += 1;
              prev.burst_at = Number(window);
              prev.burst_count = Number(nextBurst);
            } else {
              meter.set(key, {
                account_id: String(accountId),
                day: String(day),
                credits: Number(cost),
                calls: 1,
                burst_at: Number(window),
                burst_count: Number(nextBurst),
              });
            }
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        },
      };
      return stmt;
    },
  };

  const counts = () => ({ users: users.length, sessions: sessions.length, runs: runs.size, loginAttempts: loginAttempts.length });
  return { db, counts, setOverride, meterStats: () => new Map(meter) };
}

export type FakeDb = ReturnType<typeof makeFakeDb>;