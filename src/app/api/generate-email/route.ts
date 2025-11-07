import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Helper function to convert plain text to HTML with proper formatting
function convertTextToHtml(text: string): string {
  if (!text) return "";
  
  // Convert line breaks to HTML paragraphs and line breaks
  const htmlContent = text
    .split('\n\n') // Split on double line breaks for paragraphs
    .map(paragraph => {
      if (paragraph.trim() === '') return '';
      // Convert single line breaks to <br> within paragraphs
      const withLineBreaks = paragraph.replace(/\n/g, '<br>');
      return `<p style="margin: 0 0 16px 0; line-height: 1.5; font-family: Arial, sans-serif; color: #333; text-align: left;">${withLineBreaks}</p>`;
    })
    .join('');
  
  // Wrap in a proper email container (remove centering)
  return `
    <div style="max-width: 600px; margin: 0; padding: 20px; font-family: Arial, sans-serif; line-height: 1.6; color: #333; text-align: left;">
      ${htmlContent}
    </div>
  `;
}

function groupCertificatesByType(programs: string[], certificateTypes: string[]) {
  const grouped: { [key: string]: string[] } = {};
  
  programs.forEach((program, index) => {
    const type = certificateTypes[index] || "Achievement";
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(program);
  });
  
  return grouped;
}

function formatCertificateList(groupedCertificates: { [key: string]: string[] }): string {
  const types = Object.keys(groupedCertificates);
  
  if (types.length === 0) return "your certificates";
  
  const typeList = types.map(type => {
    const programs = groupedCertificates[type];
    const programText = programs.length > 1 
      ? programs.slice(0, -1).join(", ") + " and " + programs.slice(-1)
      : programs[0];
    
    return `Certificate of ${type} for ${programText}`;
  });
  
  if (typeList.length === 1) {
    return typeList[0];
  } else if (typeList.length === 2) {
    return typeList.join(" and ");
  } else {
    return typeList.slice(0, -1).join(", ") + ", and " + typeList.slice(-1);
  }
}

function formatCertificateSummary(groupedCertificates: { [key: string]: string[] }): string {
  const totalCertificates = Object.values(groupedCertificates).flat().length;
  const typeCount = Object.keys(groupedCertificates).length;
  
  if (totalCertificates === 1) {
    const type = Object.keys(groupedCertificates)[0];
    return `your Certificate of ${type}`;
  } else if (typeCount === 1) {
    return `your ${totalCertificates} Certificates of ${Object.keys(groupedCertificates)[0]}`;
  } else {
    return `your ${totalCertificates} certificates across ${typeCount} different categories`;
  }
}

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
  
  // Group certificates by type
  const groupedCertificates = groupCertificatesByType(programs, certificateTypes);
  const certificateList = formatCertificateList(groupedCertificates);
  const certificateSummary = formatCertificateSummary(groupedCertificates);
  
  const isMultipleCertificates = programs.length > 1;
  const certificateText = isMultipleCertificates ? "certificates" : "certificate";
  const areIs = isMultipleCertificates ? "are" : "is";

  const prompt = `
    Generate ONE warm and enthusiastic message to ${firstName} congratulating them on earning ${certificateSummary}.
    
    CRITICAL REQUIREMENTS:
    - Use ONLY a warm, enthusiastic, and positive tone throughout
    - Follow this EXACT template structure:
    
    "Hello ${firstName}!
    
    We are absolutely thrilled to congratulate you on this fantastic accomplishment! Earning ${certificateList} ${isMultipleCertificates ? 'are' : 'is'} a truly impressive milestone, showcasing your dedication and growth.
    
    Your well-deserved ${certificateText} ${areIs} attached to this email, a testament to your hard work and commitment.
    
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
    - Use the exact certificate list provided: "${certificateList}"
  `;

  // Create both plain text and HTML versions for the fallback
  const plainTextContent = `Hello ${firstName}!

We are absolutely thrilled to congratulate you on this fantastic accomplishment! Earning ${certificateList} ${isMultipleCertificates ? 'are' : 'is'} a truly impressive milestone, showcasing your dedication and growth.

Your well-deserved ${certificateText} ${areIs} attached to this email, a testament to your hard work and commitment.

We're incredibly excited about the connections you'll foster and the opportunities you'll unlock. We look forward to continuing our collaboration to create even greater impact together!

Please feel free to share this with your friends, family and on-line connections (LinkedIn, Social Media Platforms) so they can appreciate the work you do

Best regards,
Lyle Benjamin
Founder, One Planet – One People
Working for the Betterment of Kids, People and the Planet!`;

  const fallbackMessage = {
    id: "1",
    title: "Warm Congratulations",
    content: plainTextContent,
    htmlContent: convertTextToHtml(plainTextContent)
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
      content: cleanContent, // Keep plain text for display
      htmlContent: convertTextToHtml(cleanContent) // Add HTML version for email
    };
    
  } catch (err: any) {
    console.warn("Gemini failed, using fallback message:", err.message || err);
    return fallbackMessage;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🔍 API Route called with:", {
      recipientName: body.recipientName,
      programs: body.programs,
      certificateTypes: body.certificateTypes,
      organization: body.organization
    });
    
    const { recipientName, programs, organization, certificateTypes } = body;
    
    const message = await generateGeminiMessage({ 
      recipientName, 
      programs, 
      organization,
      certificateTypes: certificateTypes || []
    });
    
    console.log("✅ Generated message successfully");
    console.log("📝 Message formats:", {
      hasPlainText: !!message.content,
      hasHtml: !!message.htmlContent,
      plainTextLength: message.content?.length,
      htmlLength: message.htmlContent?.length
    });
    
    return NextResponse.json({ message });
  } catch (err) {
    console.error("❌ generate-email route error:", err);
    
    try {
      const { recipientName, programs, certificateTypes = [] } = await req.json();
      const firstName = recipientName.split(' ')[0];
      
      // Use the same grouping logic for fallback
      const groupedCertificates = groupCertificatesByType(programs, certificateTypes);
      const certificateList = formatCertificateList(groupedCertificates);
      const isMultipleCertificates = programs.length > 1;
      const certificateText = isMultipleCertificates ? "certificates" : "certificate";
      const areIs = isMultipleCertificates ? "are" : "is";
      
      const plainTextContent = `Hello ${firstName}!

We are absolutely thrilled to congratulate you on this fantastic accomplishment! Earning ${certificateList} ${isMultipleCertificates ? 'are' : 'is'} a truly impressive milestone, showcasing your dedication and growth.

Your well-deserved ${certificateText} ${areIs} attached to this email, a testament to your hard work and commitment.

We're incredibly excited about the connections you'll foster and the opportunities you'll unlock. We look forward to continuing our collaboration to create even greater impact together!

Please feel free to share this with your friends, family and on-line connections (LinkedIn, SocialMedia Platforms) so they can appreciate the work you do

Best regards,
Lyle Benjamin
Founder, One Planet – One People
Working for the Betterment of Kids, People and the Planet!`;
      
      const fallbackMessage = {
        id: "1",
        title: "Warm Congratulations",
        content: plainTextContent,
        htmlContent: convertTextToHtml(plainTextContent)
      };
      
      return NextResponse.json({ message: fallbackMessage });
    } catch (parseErr) {
      console.error("Failed to parse request in error handler:", parseErr);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
}