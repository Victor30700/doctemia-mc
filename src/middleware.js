// src/middleware.js
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = req.cookies.get("__session")?.value;
  const role = req.cookies.get("role")?.value;
  const { pathname } = req.nextUrl;

  // 1. Redirigir raíz a login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 2. Rutas públicas
  const publicPaths = ["/login", "/register", "/favicon.ico"];
  if (publicPaths.includes(pathname)) {
    // Si ya tiene sesión, mandarlo a su dashboard correspondiente
    if (token) {
      const dest = role === "admin" ? "/admin" : "/app";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // 3. Protección de rutas: Si NO hay token, mandar a login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    // Evitar bucles: si ya estamos en una redirección, no añadir más parámetros
    return NextResponse.redirect(loginUrl);
  }

  // 4. Protección de Admin
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/", 
    "/login", 
    "/register", 
    "/app/:path*", 
    "/admin/:path*"
  ]
};
