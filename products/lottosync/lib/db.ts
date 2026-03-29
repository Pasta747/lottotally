import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.POSTGRES_URL!;
const sql = neon(dbUrl);

export type User = {
  id: number;
  email: string;
  password_hash: string;
  store_name: string | null;
  state: string | null;
  commission_rate: number;
  lottery_terminal_id: string | null;
  created_at: string
};
export { sql };
