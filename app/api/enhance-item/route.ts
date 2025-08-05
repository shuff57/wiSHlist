import { NextRequest, NextResponse } from 'next/server';

interface ItemEnhancementRequest {
  action: 'enhance-scraped' | 'enhance-manual' | 'improve-existing';
  data: {
    url?: string;
    title?: string;
    description?: string;
    price?: string;
    image?: string;
    userInput?: string;
    searchContext?: string;
  };
}

interface ItemEnhancementResponse {
  name: string;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ItemEnhancementRequest = await request.json();
    const { action, data } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Gemini API key not configured'
      }, { status: 500 });
    }

    // Dynamic import for server-side usage
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let prompt: string;

    switch (action) {
      case 'enhance-scraped':
        prompt = `
You are an AI assistant helping parents understand classroom supply needs. Your goal is to create clear, brand-independent item names and practical descriptions for educational materials.

Given the following scraped item data:
- Title: ${data.title || 'Not provided'}
- Description: ${data.description || 'Not provided'}
- Price: ${data.price || 'Not provided'}
- URL: ${data.url || 'Not provided'}

Please generate:
1. A clear, generic item name (max 50 characters) that describes WHAT the item is without technical specifications
2. A factual description (max 200 characters) focused on specifications and educational use cases

Guidelines for PARENTS evaluating classroom contributions:
- Remove all brand names but keep essential item context (e.g. "3D Printer Filament" not "Filament", "Wired Game Controller" not "USB Game Controller")
- Keep important descriptive words that help identify the item type and basic functionality
- Remove technical specifications like sizes, dimensions, model numbers from the name
- Put all technical specifications, measurements, and detailed specs in the description
- Focus description on specifications, measurements, and technical details parents need to know
- Explain briefly HOW this will be used in the classroom or learning context
- Avoid marketing language like "Perfect for!" or "Amazing quality!"
- Include key specs that matter for educational use (size, material, compatibility, etc.)
- Help parents understand if this is a consumable supply vs. durable equipment

Examples:
- "High-speed SUNLU PLA+ Filament 1.75mm" → Name: "3D Printer Filament", Description: "1.75mm PLA plastic filament for 3D printing projects. Used to create educational models, prototypes, and student projects."
- "Apple iPad 10.2-inch WiFi 64GB" → Name: "Tablet", Description: "10.2-inch WiFi tablet with 64GB storage for educational apps, research, and multimedia learning activities in the classroom."
- "Logitech G F310 Wired USB Gamepad" → Name: "Wired Game Controller", Description: "USB wired controller for educational gaming, programming projects, and interactive learning software."

Return your response in this exact JSON format:
{
  "name": "clear item name here",
  "description": "factual educational description here"
}
`;
        break;

      case 'enhance-manual':
        prompt = `
You are an AI assistant helping parents understand classroom supply needs. Your goal is to create clear, educational item descriptions.

The user entered this item: "${data.userInput}"${data.searchContext ? `
Search context: "${data.searchContext}" (This provides additional context about what they're looking for)` : ''}

Please generate:
1. A clear, generic item name (max 50 characters) that describes what the item is without technical specifications
2. A practical description (max 200 characters) explaining its educational purpose and key details

Guidelines for PARENT-FRIENDLY classroom supplies:
- Remove brand names but keep essential item context (e.g. "Wireless Mouse" not "Mouse", "Colored Pencils" not "Pencils")
- Keep important descriptive words that help identify the item type and basic functionality
- Remove technical specifications like sizes, dimensions, model numbers from the name
- Put all technical specifications and detailed specs in the description
- Explain HOW this item will be used for learning or classroom activities
- Include relevant specifications or details parents should know
- Focus on educational value and practical use
- Avoid marketing language - be factual and informative
- Help parents understand if this is consumable or reusable${data.searchContext ? `
- Consider the context: "${data.searchContext}" and incorporate educational relevance` : ''}

Examples:
- "iPad Pro 12.9 inch" → Name: "Tablet", Description: "12.9-inch touch-screen device for educational apps, digital drawing, research, and multimedia classroom activities."
- "Crayola colored pencils 24 pack" → Name: "Colored Pencils", Description: "24-pack of colored art supplies for drawing, coloring, and creative projects. Helps develop fine motor skills and artistic expression."
- "TI-84 Plus scientific calculator" + context: "math class" → Name: "Scientific Calculator", Description: "TI-84 Plus graphing calculator for algebra, trigonometry, and calculus. Required for high school math coursework."

Return your response in this exact JSON format:
{
  "name": "clear item name here",
  "description": "practical educational description here"
}
`;
        break;

      case 'improve-existing':
        prompt = `
You are an AI assistant helping parents understand classroom supply needs. Your goal is to improve item descriptions for educational clarity.

Current item details:
- Name: ${data.title || 'Not provided'}
- Description: ${data.description || 'Not provided'}
- Price: ${data.price || 'Not provided'}

Please improve this item by:
1. Making the name clear and educationally focused (max 50 characters) - keep essential item context but remove technical specs
2. Making the description factual and parent-friendly (max 200 characters)

Guidelines for PARENT-FRIENDLY classroom supplies:
- Remove brand names but keep essential item context (e.g. "Wireless Keyboard" not "Keyboard")
- Keep important descriptive words that help identify the item type and basic functionality
- Remove technical specifications like sizes, dimensions, model numbers from the name
- Put all specifications and technical details in the description
- Explain the educational purpose and classroom use
- Include specifications that parents need to evaluate the item
- Focus on practical details rather than marketing language
- Help parents understand the educational value
- Be factual about what this item does in a learning environment

Return your response in this exact JSON format:
{
  "name": "clear item name here",
  "description": "improved factual description here"
}
`;
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    const enhancedItem: ItemEnhancementResponse = {
      name: parsed.name || data.title || data.userInput || 'Untitled Item',
      description: parsed.description || data.description || ''
    };

    return NextResponse.json({
      success: true,
      data: enhancedItem
    });

  } catch (error: any) {
    console.error('Error enhancing item with Gemini:', error);
    
    // Return fallback data on error
    const fallbackData = {
      name: 'Untitled Item',
      description: ''
    };

    return NextResponse.json({
      success: false,
      error: error.message,
      fallback: fallbackData
    }, { status: 500 });
  }
}
