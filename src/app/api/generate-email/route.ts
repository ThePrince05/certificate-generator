import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
// Update the function signature to accept certificate types
function parseMessageOptions(
  text: string, 
  fallbackMessages: { id: string; title: string; content: string }[],
  firstName: string,
  programs: string[]
): { id: string; title: string; content: string }[] {
  try {
    // Clean the text and split by the separator
    const cleanText = text.trim();
    const messageParts = cleanText.split('---').map(part => part.trim()).filter(part => part.length > 0);
    
    // If we don't get exactly 3 parts, use fallbacks
    if (messageParts.length !== 3) {
      console.warn(`Expected 3 messages, got ${messageParts.length}. Using fallbacks.`);
      return fallbackMessages;
    }
    
    // Map the parsed messages to our format
    const messages = messageParts.map((content, index) => {
      // Clean up any residual formatting
      let cleanContent = content
        .replace(/\*\*/g, '') // Remove bold markers
        .replace(/Option\s*\d+:?\s*/i, '') // Remove option labels
        .trim();
      
      // Ensure the content starts with Hello
      if (!cleanContent.startsWith('Hello')) {
        cleanContent = `Hello ${firstName}!,\n\n${cleanContent}`;
      } else if (!cleanContent.match(/^Hello [^!]+!,\s*\n/)) {
        // If it starts with Hello but doesn't have proper spacing after the comma
        cleanContent = cleanContent.replace(/^(Hello [^!]+!,)\s*/, '$1\n\n');
      }
      
      // Ensure proper sign-off format
      if (!cleanContent.includes('Best regards,')) {
        cleanContent += `\n\nBest regards,\nLyle Benjamin\nFounder, One Planet – One People\nWorking for the betterment of people and planet`;
      }
      
      return {
        id: (index + 1).toString(),
        title: fallbackMessages[index].title,
        content: cleanContent
      };
    });
    
    return messages;
    
  } catch (error) {
    console.error("Error parsing message options:", error);
    return fallbackMessages;
  }
}

async function generateGeminiMessages({ 
  recipientName, 
  programs, 
  organization,
  certificateTypes // Add this parameter
}: {
  recipientName: string;
  programs: string[];
  organization: string;
  certificateTypes: string[]; // Add this
}) {
  const firstName = recipientName.split(' ')[0];
  
  const formattedPrograms =
    programs.length > 1
      ? programs.slice(0, -1).join(", ") + " and " + programs.slice(-1)
      : programs[0] || "the program";

  // Format certificate types for the message
  const formattedTypes = certificateTypes.length > 0 
    ? certificateTypes.filter(Boolean).join(", ") 
    : "Achievement"; // Default fallback

  const prompt = `
    Generate THREE distinct message options to ${firstName} congratulating them on earning their Certificate of ${formattedTypes} for completing ${formattedPrograms}.
    
    CRITICAL FORMATTING REQUIREMENTS:
    - Return ONLY the three message options in this exact format, nothing else
    - No headings, no numbers, no labels like "Option 1"
    - Each message should be separated by exactly "---" on a new line
    - Maintain proper paragraph spacing and natural line breaks
    
    CONTENT REQUIREMENTS for each message:
    1. Start with: "Hello ${firstName}!," followed by a blank line
    2. Congratulate them on earning their Certificate of ${formattedTypes} for completing ${formattedPrograms}
    3. Mention that their Certificate of ${formattedTypes}${programs.length > 1 ? "s are" : " is"} attached
    4. Encourage them to continue working with us to create greater impact
    5. End with this exact formatting: "
    Best regards,
    Lyle Benjamin
    Founder, One Planet – One People
    Working for the betterment of people and planet"
    
    Make each message unique:
    - First message: Warm and enthusiastic tone
    - Second message: Professional and inspiring tone  
    - Third message: Casual and friendly tone
    
    Keep each message under 150 words with natural paragraph breaks.
  `;

  // Update fallback messages to include certificate type
  const fallbackMessages = [
    {
      id: "1",
      title: "Warm Congratulations",
      content: `Hello ${firstName}!,

Warmest congratulations on earning your Certificate of ${formattedTypes} for completing ${formattedPrograms}! Your Certificate of ${formattedTypes}${programs.length > 1 ? "s are" : " is"} attached.

We're so proud of your achievement and hope you'll continue this journey with us to create even greater impact together.

Best regards,
Lyle Benjamin
Founder, One Planet – One People
Working for the betterment of people and planet`
    },
    {
      id: "2", 
      title: "Professional Recognition",
      content: `Hello ${firstName}!,

Congratulations on successfully earning your Certificate of ${formattedTypes} for completing ${formattedPrograms}. Your Certificate of ${formattedTypes}${programs.length > 1 ? "s are" : " is"} attached.

We appreciate your dedication and look forward to your continued partnership in creating meaningful change.

Best regards,
Lyle Benjamin
Founder, One Planet – One People
Working for the betterment of people and planet`
    },
    {
      id: "3",
      title: "Friendly Encouragement", 
      content: `Hello ${firstName}!,

Awesome job earning your Certificate of ${formattedTypes} for completing ${formattedPrograms}! Your Certificate of ${formattedTypes}${programs.length > 1 ? "s are" : " is"} attached.

Can't wait to see what we accomplish next together - let's keep making a difference!

Best regards,
Lyle Benjamin
Founder, One Planet – One People
Working for the betterment of people and planet`
    }
  ];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Gemini raw response:", text);
    
    const messages = parseMessageOptions(text, fallbackMessages, firstName, programs);
    return messages;
    
  } catch (err: any) {
    console.warn("Gemini failed, using fallback messages:", err.message || err);
    return fallbackMessages;
  }
}

// Update the POST function to accept certificateTypes
export async function POST(req: Request) {
  try {
    const { recipientName, programs, organization, certificateTypes } = await req.json();
    const messages = await generateGeminiMessages({ 
      recipientName, 
      programs, 
      organization,
      certificateTypes: certificateTypes || [] // Add this with fallback
    });
    return NextResponse.json({ messages });
  } catch (err) {
    console.error("generate-email route error:", err);
    
    try {
      // Return formatted fallback messages with certificate types
      const { recipientName, programs, certificateTypes = [] } = await req.json();
      const firstName = recipientName.split(' ')[0];
      const formattedPrograms = programs.length > 1 
        ? programs.slice(0, -1).join(", ") + " and " + programs.slice(-1) 
        : programs[0] || "the program";
      
      const formattedTypes = certificateTypes.length > 0 
        ? certificateTypes.filter(Boolean).join(", ") 
        : "Achievement";
      
      const fallbackMessages = [
        {
          id: "1",
          title: "Warm Congratulations",
          content: `Hello ${firstName}!,

Warmest congratulations on earning your Certificate of ${formattedTypes} for completing ${formattedPrograms}! Your Certificate of ${formattedTypes}${programs.length > 1 ? "s are" : " is"} attached.

We're so proud of your achievement and hope you'll continue this journey with us to create even greater impact together.

Best regards,
Lyle Benjamin
Founder, One Planet – One People
Working for the betterment of people and planet`
        },
        {
          id: "2", 
          title: "Professional Recognition",
          content: `Hello ${firstName}!,

Congratulations on successfully earning your Certificate of ${formattedTypes} for completing ${formattedPrograms}. Your Certificate of ${formattedTypes}${programs.length > 1 ? "s are" : " is"} attached.

We appreciate your dedication and look forward to your continued partnership in creating meaningful change.

Best regards,
Lyle Benjamin
Founder, One Planet – One People
Working for the betterment of people and planet`
        },
        {
          id: "3",
          title: "Friendly Encouragement", 
          content: `Hello ${firstName}!,

Awesome job earning your Certificate of ${formattedTypes} for completing ${formattedPrograms}! Your Certificate of ${formattedTypes}${programs.length > 1 ? "s are" : " is"} attached.

Can't wait to see what we accomplish next together - let's keep making a difference!

Best regards,
Lyle Benjamin
Founder, One Planet – One People
Working for the betterment of people and planet`
        }
      ];
      
      return NextResponse.json({ messages: fallbackMessages }, { status: 500 });
    } catch (parseErr) {
      console.error("Failed to parse request in error handler:", parseErr);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
}