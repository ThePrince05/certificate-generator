import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { recipientName, programs = [], organization } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const formattedPrograms =
      programs.length > 1
        ? programs.slice(0, -1).join(", ") + " and " + programs.slice(-1)
        : programs[0] || "the program";

    const prompt = `
      Write a warm, short message to ${recipientName}, congratulating them 
      for completing ${formattedPrograms} under ${organization}.
      Mention that their certificates are attached.
      Make it friendly, personal, and suitable for email or WhatsApp.
      Keep it under 90 words.
    `;

    const result = await model.generateContent(prompt);
    const message = result.response.text();

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Gemini email generation error:", error);
    return NextResponse.json({ error: "Failed to generate message" }, { status: 500 });
  }
}
