import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const usersFile = path.join(process.cwd(), "src", "data", "users.json");

export async function POST(request) {
    try {
        const { email, password } = await request.json();
        const data = await fs.readFile(usersFile, "utf-8");
        const users = JSON.parse(data);

        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // In a real app, you'd set a secure cookie/session here
            const response = NextResponse.json({
                success: true,
                user: { id: user.id, name: user.name, email: user.email }
            });

            // Set a simple cookie for "session" persistence
            response.cookies.set("neet_user_id", user.id, {
                path: "/",
                httpOnly: true, // Secure cookie, server-side only
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            return response;
        }

        return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
