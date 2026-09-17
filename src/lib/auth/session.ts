import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const ADMIN_COOKIE = "tg_admin_session";
const CUSTOMER_COOKIE = "tg_customer_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 dias

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET não configurado (ou muito curto). Defina uma string aleatória forte no .env"
    );
  }
  return new TextEncoder().encode(secret);
}

type AdminClaims = { sub: string; role: "ADMIN" | "STAFF"; type: "user" };
type CustomerClaims = { sub: string; type: "customer" };

async function signToken(claims: AdminClaims | CustomerClaims) {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

async function verifyToken<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Admin / Staff
// ---------------------------------------------------------------------------

export async function createAdminSession(userId: string, role: "ADMIN" | "STAFF") {
  const token = await signToken({ sub: userId, role, type: "user" });
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const claims = await verifyToken<AdminClaims>(token);
  if (!claims || claims.type !== "user") return null;
  const user = await prisma.user.findUnique({ where: { id: claims.sub } });
  if (!user || !user.active) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}

// ---------------------------------------------------------------------------
// Cliente (loja)
// ---------------------------------------------------------------------------

export async function createCustomerSession(customerId: string) {
  const token = await signToken({ sub: customerId, type: "customer" });
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroyCustomerSession() {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
}

export async function getCurrentCustomer() {
  const store = await cookies();
  const token = store.get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const claims = await verifyToken<CustomerClaims>(token);
  if (!claims || claims.type !== "customer") return null;
  const customer = await prisma.customer.findUnique({ where: { id: claims.sub } });
  if (!customer || !customer.active) return null;
  return customer;
}

export async function requireCustomer() {
  const customer = await getCurrentCustomer();
  if (!customer) throw new Error("UNAUTHORIZED");
  return customer;
}
