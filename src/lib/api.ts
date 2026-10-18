import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export const unauthorized = () => jsonError("Sign in with an active plan to do that.", 401);
export const notFound = () => jsonError("Not found", 404);
