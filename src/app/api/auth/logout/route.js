import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ success: true });

    // Clear the user cookie
    response.cookies.set("neet_user_id", "", {
        path: "/",
        maxAge: 0
    });

    return response;
}
