import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

// neon() called ONCE at module load
let _sql: NeonQueryFunction<false, false> | null = null;
if (dbUrl) {
  try {
    _sql = neon(dbUrl) as NeonQueryFunction<false, false>;
  } catch (err) {
    console.error("neon() init failed:", err);
    _sql = null;
  }
} else {
  console.error("POSTGRES_URL is empty — DB disabled");
}

// Tagged template sql — all calls go through here
function sql(strings: TemplateStringsArray, ...values: any[]) {
  if (!_sql) return Promise.resolve([]);
  try {
    return _sql(strings, ...values) as Promise<any[]>;
  } catch (err) {
    console.error("sql call error:", err);
    return Promise.resolve([]);
  }
}

export { sql };

export type User = {
  id: number;
  password_hash: string;
  email: string;
  store_name: string | null;
  state: string | null;
  commission_rate: number;
  lottery_terminal_id: string | null;
  created_at: string;
};
