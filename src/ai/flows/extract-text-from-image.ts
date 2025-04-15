'use server';
/**
 * @fileOverview Extracts text from an image using OCR.
 *
 * - extractTextFromImage - A function that handles the text extraction process.
 * - ExtractTextFromImageInput - The input type for the extractTextFromImage function.
 * - ExtractTextFromImageOutput - The return type for the extractTextFromImage function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ExtractTextFromImageInputSchema = z.object({
  photoUrl: z.string().describe('The URL of the image to extract text from.'),
});
export type ExtractTextFromImageInput = z.infer<typeof ExtractTextFromImageInputSchema>;

const ExtractTextFromImageOutputSchema = z.object({
  extractedText: z.string().describe('The extracted text from the image.'),
});
export type ExtractTextFromImageOutput = z.infer<typeof ExtractTextFromImageOutputSchema>;

export async function extractTextFromImage(input: ExtractTextFromImageInput): Promise<ExtractTextFromImageOutput> {
  return extractTextFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTextFromImagePrompt',
  input: {
    schema: z.object({
      photoUrl: z.string().describe('The URL of the image to extract text from.'),
    }),
  },
  output: {
    schema: z.object({
      extractedText: z.string().describe('The extracted text from the image.'),
    }),
  },
  prompt: `You are an OCR service. Extract the text from the image at the following URL: {{media url=photoUrl}}.\n\n Format Extracted text similar to the image text format. For table formats, use 3 tab spaces to separate a column. \n\nExtracted Text:`,
});

const extractTextFromImageFlow = ai.defineFlow<
  typeof ExtractTextFromImageInputSchema,
  typeof ExtractTextFromImageOutputSchema
>({
  name: 'extractTextFromImageFlow',
  inputSchema: ExtractTextFromImageInputSchema,
  outputSchema: ExtractTextFromImageOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
}
);
