import { GoogleGenAI, Type } from "@google/genai";
import { MealItem } from '../types';

// Initialize with environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for structured output
const mealItemSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Name of the food item in Portuguese" },
      quantity: { type: Type.NUMBER, description: "Estimated quantity" },
      unit: { type: Type.STRING, description: "Unit of measurement (g, ml, un, colher, etc.)" },
      macros: {
        type: Type.OBJECT,
        properties: {
          kcal: { type: Type.NUMBER },
          p: { type: Type.NUMBER, description: "Protein in grams" },
          c: { type: Type.NUMBER, description: "Carbs in grams" },
          f: { type: Type.NUMBER, description: "Fat in grams" },
        },
        required: ["kcal", "p", "c", "f"],
      },
    },
    required: ["name", "quantity", "unit", "macros"],
  },
};

/**
 * Sanity Check: Validates and fixes inconsistencies between Macros and Total Calories.
 * Physics rule: 1g Protein = 4kcal, 1g Carb = 4kcal, 1g Fat = 9kcal.
 */
const validateAndFixMacros = (items: MealItem[]): MealItem[] => {
  return items.map(item => {
    const { p, c, f, kcal } = item.macros;
    // Calculate expected calories based on standard Atwater factors
    const calculatedKcal = (p * 4) + (c * 4) + (f * 9);

    // If there is a significant discrepancy (> 20%) or if kcal is missing/zero but macros exist
    // We trust the macros and recalculate the kcal
    if (Math.abs(calculatedKcal - kcal) > (Math.max(kcal, 50) * 0.2) || (kcal === 0 && calculatedKcal > 0)) {
       return {
         ...item,
         macros: {
           ...item.macros,
           kcal: Math.round(calculatedKcal)
         }
       };
    }
    
    return item;
  });
};

/**
 * Analyzes text input to extract nutrition data.
 * Uses Flash model for speed.
 */
export const analyzeFoodText = async (text: string): Promise<MealItem[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analise o seguinte texto sobre uma refeição. IMPORTANTE: Se houver pratos compostos, separe-os em ingredientes individuais (ex: "Pão com manteiga" deve virar dois itens: "Pão Francês" e "Manteiga"). Estime as calorias e macronutrientes com base na tabela TACO. Retorne APENAS o JSON. Texto: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: mealItemSchema,
      },
    });

    const jsonStr = response.text || "[]";
    const items = JSON.parse(jsonStr) as MealItem[];
    return validateAndFixMacros(items);
  } catch (error) {
    console.error("Gemini Text Analysis Error:", error);
    throw new Error("Falha ao analisar o texto da refeição.");
  }
};

/**
 * Analyzes an image to identify food and estimate nutrition.
 * Uses Pro model for better reasoning on images.
 */
export const analyzeFoodImage = async (base64Image: string): Promise<MealItem[]> => {
  try {
    // Clean base64 string if it contains metadata header
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "Identifique os alimentos neste prato. IMPORTANTE: Separe os ingredientes visíveis individualmente (ex: se for café com leite, crie um item para Café e outro para Leite; se for pão com ovo, separe Pão e Ovo). Estime as quantidades visuais e forneça as informações nutricionais. Seja preciso. Retorne em JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: mealItemSchema,
      },
    });

    const jsonStr = response.text || "[]";
    const items = JSON.parse(jsonStr) as MealItem[];
    return validateAndFixMacros(items);
  } catch (error) {
    console.error("Gemini Image Analysis Error:", error);
    throw new Error("Falha ao analisar a imagem da refeição.");
  }
};