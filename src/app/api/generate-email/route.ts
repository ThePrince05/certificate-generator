import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { recipientName, programName, organization } = await req.json();

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

 const prompt = `
Write a short, warm message to ${recipientName} congratulating them 
for completing the ${programName} program under ${organization}.
Make it sound friendly and personal, and suitable for email, WhatsApp, or other platforms.
Mention that their certificate is attached.
Keep it under 80 words.
`;


    const result = await model.generateContent(prompt);
    const message = result.response.text();

    return NextResponse.json({ message });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate email" }, { status: 500 });
  }
}
