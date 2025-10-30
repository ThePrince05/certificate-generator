import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function generateGeminiMessage({ recipientName, programs, organization }: {
  recipientName: string;
  programs: string[];
  organization: string;
}): Promise<string> {
  const formattedPrograms =
    programs.length > 1
      ? programs.slice(0, -1).join(", ") + " and " + programs.slice(-1)
      : programs[0] || "the program";

  const prompt = `
      Write a short, warm, and friendly message to ${recipientName}, congratulating them
      for completing ${formattedPrograms} at ${organization}. Mention that their certificate${
        programs.length > 1 ? "s" : ""
      } are attached or available. Make the wording suitable for any platform (email, WhatsApp, or messaging apps). 
      Avoid any placeholders like [Your Name]. 
      End with a friendly sign-off using the organization name, e.g., "Best regards, ${organization}".
      Keep it under 90 words.
      `;

  const fallback = `Hi ${recipientName}, congratulations on completing ${formattedPrograms} under ${organization}! Your certificate(s) are attached. Keep up the great work!`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response?.text?.() ?? fallback;
  } catch (err: any) {
  //  console.warn("Gemini failed, using fallback message:", err.message || err);
    return fallback;
  }
}

export async function POST(req: Request) {
  try {
    const { recipientName, programs, organization } = await req.json();
    const message = await generateGeminiMessage({ recipientName, programs, organization });
    return NextResponse.json({ message });
  } catch (err) {
  //  console.error("generate-email route error:", err);
    return NextResponse.json({ message: "Hi! Please find your certificate(s) attached." }, { status: 500 });
  }
}
