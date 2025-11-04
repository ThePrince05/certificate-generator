import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function generateGeminiMessage({ 
  recipientName, 
  programs, 
  organization,
  certificateTypes
}: {
  recipientName: string;
  programs: string[];
  organization: string;
  certificateTypes: string[];
}) {
  const firstName = recipientName.split(' ')[0];
  
  const formattedPrograms =
    programs.length > 1
      ? programs.slice(0, -1).join(", ") + " and " + programs.slice(-1)
      : programs[0] || "the program";

  const formattedTypes = certificateTypes.length > 0 
    ? certificateTypes.filter(Boolean).join(", ") 
    : "Achievement";

  const prompt = `
    Generate ONE warm and enthusiastic message to ${firstName} congratulating them on earning their Certificate of ${formattedTypes} for completing ${formattedPrograms}.
    
    CRITICAL REQUIREMENTS:
    - Use ONLY a warm, enthusiastic, and positive tone throughout
    - Follow this EXACT template structure:
    
    "Hello ${firstName}!
    
    We are absolutely thrilled to congratulate you on this fantastic accomplishment! Earning your Certificate of ${formattedTypes} for completing ${formattedPrograms} is a truly impressive milestone, showcasing your dedication and growth.
    
    Your well-deserved certificate${programs.length > 1 ? "s are" : " is"} attached to this email, a testament to your hard work and commitment.
    
    We're incredibly excited about the connections you'll foster and the opportunities you'll unlock. We look forward to continuing our collaboration to create even greater impact together!
    
    Please feel free to share this with your friends, family and on-line connections (LinkedIn, Social Media Platforms) so they can appreciate the work you do
    
    Best regards,
    Lyle Benjamin
    Founder, One Planet – One People
    Working for the Betterment of Kids, People and the Planet!"
    
    FORMATTING REQUIREMENTS:
    - Return ONLY the single message in the exact format above
    - No additional text, no explanations, no options
    - Maintain the exact template structure and warm tone
  `;

  const fallbackMessage = {
    id: "1",
    title: "Warm Congratulations",
    content: `Hello ${firstName}!

We are absolutely thrilled to congratulate you on this fantastic accomplishment! Earning your Certificate of ${formattedTypes} for completing ${formattedPrograms} is a truly impressive milestone, showcasing your dedication and growth.

Your well-deserved certificate${programs.length > 1 ? "s are" : " is"} attached to this email, a testament to your hard work and commitment.

We're incredibly excited about the connections you'll foster and the opportunities you'll unlock. We look forward to continuing our collaboration to create even greater impact together!

Please feel free to share this with your friends, family and on-line connections (LinkedIn, Social Media Platforms) so they can appreciate the work you do

Best regards,
Lyle Benjamin
Founder, One Planet – One People
Working for the Betterment of Kids, People and the Planet!`
  };

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    console.log("Gemini raw response:", text);
    
    // Clean up the response to ensure it follows the template
    let cleanContent = text
      .replace(/\*\*/g, '')
      .trim();
    
    // Ensure it starts with Hello and has proper formatting
    if (!cleanContent.startsWith('Hello')) {
      cleanContent = `Hello ${firstName}!\n\n${cleanContent}`;
    }
    
    // Ensure proper sign-off format
    const signOff = `Best regards,\nLyle Benjamin\nFounder, One Planet – One People\nWorking for the Betterment of Kids, People and the Planet!`;
    
    if (!cleanContent.includes('Best regards,')) {
      cleanContent += `\n\n${signOff}`;
    }
    
    return {
      id: "1",
      title: "Warm Congratulations", 
      content: cleanContent
    };
    
  } catch (err: any) {
    console.warn("Gemini failed, using fallback message:", err.message || err);
    return fallbackMessage;
  }
}

export async function POST(req: Request) {
  try {
    const { recipientName, programs, organization, certificateTypes } = await req.json();
    const message = await generateGeminiMessage({ 
      recipientName, 
      programs, 
      organization,
      certificateTypes: certificateTypes || []
    });
    return NextResponse.json({ message });
  } catch (err) {
    console.error("generate-email route error:", err);
    
    try {
      const { recipientName, programs, certificateTypes = [] } = await req.json();
      const firstName = recipientName.split(' ')[0];
      const formattedPrograms = programs.length > 1 
        ? programs.slice(0, -1).join(", ") + " and " + programs.slice(-1) 
        : programs[0] || "the program";
      
      const formattedTypes = certificateTypes.length > 0 
        ? certificateTypes.filter(Boolean).join(", ") 
        : "Achievement";
      
      const fallbackMessage = {
        id: "1",
        title: "Warm Congratulations",
        content: `Hello ${firstName}!

We are absolutely thrilled to congratulate you on this fantastic accomplishment! Earning your Certificate of ${formattedTypes} for completing ${formattedPrograms} is a truly impressive milestone, showcasing your dedication and growth.

Your well-deserved certificate${programs.length > 1 ? "s are" : " is"} attached to this email, a testament to your hard work and commitment.

We're incredibly excited about the connections you'll foster and the opportunities you'll unlock. We look forward to continuing our collaboration to create even greater impact together!

Please feel free to share this with your friends, family and on-line connections (LinkedIn, Social Media Platforms) so they can appreciate the work you do

Best regards,
Lyle Benjamin
Founder, One Planet – One People
Working for the Betterment of Kids, People and the Planet!`
      };
      
      return NextResponse.json({ message: fallbackMessage }, { status: 500 });
    } catch (parseErr) {
      console.error("Failed to parse request in error handler:", parseErr);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
}