import { NextResponse } from "next/server";

export async function GET() {
  const pgUrl = process.env.POSTGRES_URL;
  const nodeEnv = process.env.NODE_ENV;
  const dbKeys = Object.keys(process.env).filter(k => k.includes("POSTGRES") || k.includes("DATABASE") || k.includes("NEXTAUTH") || k.includes("NEXT_PUBLIC"));
  
  return NextResponse.json({
    hasPgUrl: !!pgUrl,
    pgUrlPrefix: pgUrl ? pgUrl.substring(0, 30) + "..." : "MISSING",
    nodeEnv: nodeEnv,
    dbKeys: dbKeys,
    allEnv: Object.keys(process.env).length
  });
}
