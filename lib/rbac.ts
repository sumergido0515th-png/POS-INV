import type { Role } from "@/lib/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export type { Role };

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireRole(roles: Role[]) {
  const { session, error } = await requireSession();
  if (error) return { session: null, error };
  if (!roles.includes(session!.user.role)) {
    return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, error: null };
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Owner / Admin",
  CASHIER: "Cashier",
};
