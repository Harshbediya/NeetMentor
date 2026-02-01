import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { cookies } from "next/headers";

const timerFile = path.join(process.cwd(), "src", "data", "timer_stats.json");

async function getData() {
    try {
        const data = await fs.readFile(timerFile, "utf-8");
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

async function saveData(data) {
    await fs.writeFile(timerFile, JSON.stringify(data, null, 2));
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("neet_user_id")?.value;

        if (!userId) return NextResponse.json({ success: false }, { status: 401 });

        const all = await getData();
        const userStats = all[userId] || { date: null, minutes: 0, sessions: 0, modeStats: {} };
        return NextResponse.json({ success: true, data: userStats });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("neet_user_id")?.value;

        if (!userId) return NextResponse.json({ success: false }, { status: 401 });

        const { stats } = await request.json();
        const all = await getData();

        all[userId] = stats;
        await saveData(all);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
