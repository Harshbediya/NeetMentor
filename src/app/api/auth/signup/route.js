import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const usersFile = path.join(process.cwd(), "src", "data", "users.json");

export async function POST(request) {
    try {
        const { name, email, password } = await request.json();
        const fileData = await fs.readFile(usersFile, "utf-8");
        const users = JSON.parse(fileData);

        if (users.find(u => u.email === email)) {
            return NextResponse.json({ success: false, message: "User already exists" }, { status: 400 });
        }

        const newUser = {
            id: `user_${Date.now()}`,
            name,
            email,
            password
        };

        users.push(newUser);
        await fs.writeFile(usersFile, JSON.stringify(users, null, 2));

        const response = NextResponse.json({
            success: true,
            user: { id: newUser.id, name: newUser.name, email: newUser.email }
        });

        response.cookies.set("neet_user_id", newUser.id, {
            path: "/",
            httpOnly: true, // Secure cookie
            maxAge: 60 * 60 * 24 * 7
        });

        return response;
    } catch (error) {
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
