import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { cookies } from "next/headers";

const usersFile = path.join(process.cwd(), "src", "data", "users.json");

export async function GET() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("neet_user_id")?.value;

        if (!userId) {
            return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
        }

        const data = await fs.readFile(usersFile, "utf-8");
        const users = JSON.parse(data);
        const user = users.find(u => u.id === userId);

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // Return name, email, and password as requested by user for "real application" feel
        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                password: user.password
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
