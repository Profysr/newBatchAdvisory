import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decrypt } from "./functions/LoginAction";

export default async function middleware(req) {
  const path = req.nextUrl.pathname;
  const publicRoutes = ["/auth"];

  if (publicRoutes.includes(path)) {
    return NextResponse.next();
  }

  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  if (!session) {
    return NextResponse.redirect(new URL("/auth", req.nextUrl));
  }

  console.log("Middleware Run");

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
