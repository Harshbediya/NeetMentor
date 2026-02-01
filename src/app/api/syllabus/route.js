import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { cookies } from "next/headers";

const syllabusFile = path.join(process.cwd(), "src", "data", "syllabus_progress.json");

async function getData() {
    try {
        const data = await fs.readFile(syllabusFile, "utf-8");
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

async function saveData(data) {
    await fs.writeFile(syllabusFile, JSON.stringify(data, null, 2));
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("neet_user_id")?.value;

        if (!userId) return NextResponse.json({ success: false }, { status: 401 });

        const all = await getData();
        return NextResponse.json({ success: true, data: all[userId] || {} });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("neet_user_id")?.value;

        if (!userId) return NextResponse.json({ success: false }, { status: 401 });

        const { progress } = await request.json();
        const all = await getData();

        all[userId] = progress;
        await saveData(all);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
