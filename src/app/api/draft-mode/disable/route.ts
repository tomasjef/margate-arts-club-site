import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

// Turns the preview off again (the editor sees the published site as everyone does)
export async function GET(request: Request) {
  (await draftMode()).disable();
  return NextResponse.redirect(new URL("/", request.url));
}
