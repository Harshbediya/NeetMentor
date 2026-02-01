import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { cookies } from "next/headers";

const progressFile = path.join(process.cwd(), "src", "data", "progress.json");

async function getProgressData() {
    try {
        const data = await fs.readFile(progressFile, "utf-8");
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

async function saveProgressData(data) {
    await fs.writeFile(progressFile, JSON.stringify(data, null, 2));
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("neet_user_id")?.value;

        if (!userId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const allProgress = await getProgressData();
        const userProgress = allProgress[userId] || {};

        return NextResponse.json({ success: true, data: userProgress });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("neet_user_id")?.value;

        if (!userId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { tasksData } = await request.json();
        const allProgress = await getProgressData();

        allProgress[userId] = tasksData;
        await saveProgressData(allProgress);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
