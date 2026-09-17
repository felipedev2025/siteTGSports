import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { randomUUID } from "crypto";

const ADMIN_COOKIE = "tg_admin_session";
const CUSTOMER_COOKIE = "tg_customer_session";
const CART_COOKIE = "tg_cart_token";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

function getSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && pathname !== "/admin/setup") {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!(await isValidSession(token))) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (
    pathname.startsWith("/minha-conta") &&
    !pathname.startsWith("/minha-conta/entrar") &&
    !pathname.startsWith("/minha-conta/cadastro")
  ) {
    const token = request.cookies.get(CUSTOMER_COOKIE)?.value;
    if (!(await isValidSession(token))) {
      const url = new URL("/minha-conta/entrar", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // O carrinho precisa persistir entre visitas mesmo sem login. Cookies só
  // podem ser escritos em Route Handlers/Server Actions/proxy — nunca durante
  // a renderização de um Server Component — então garantimos aqui que todo
  // request já chega com o token de carrinho definido, inclusive para o
  // próprio request atual (não só para os próximos).
  if (!request.cookies.get(CART_COOKIE)?.value && !pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
    const token = randomUUID();
    request.cookies.set(CART_COOKIE, token);
    const response = NextResponse.next({ request });
    response.cookies.set(CART_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CART_COOKIE_MAX_AGE,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/media).*)"],
};
