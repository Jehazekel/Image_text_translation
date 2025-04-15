// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use server';

/**
 * @fileOverview Translates extracted text from an image into a user-selected language.
 *
 * - translateExtractedText - A function that translates the extracted text.
 * - TranslateExtractedTextInput - The input type for the translateExtractedText function.
 * - TranslateExtractedTextOutput - The return type for the translateExtractedText function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const TranslateExtractedTextInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  targetLanguage: z.string().default('es').describe('The target language code (e.g., es for Spanish).'),
});
export type TranslateExtractedTextInput = z.infer<typeof TranslateExtractedTextInputSchema>;

const TranslateExtractedTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateExtractedTextOutput = z.infer<typeof TranslateExtractedTextOutputSchema>;

export async function translateExtractedText(input: TranslateExtractedTextInput): Promise<TranslateExtractedTextOutput> {
  return translateExtractedTextFlow(input);
}

const translateTextPrompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {
    schema: z.object({
      text: z.string().describe('The text to translate.'),
      targetLanguage: z.string().describe('The target language code.'),
    }),
  },
  output: {
    schema: z.object({
      translatedText: z.string().describe('The translated text.'),
    }),
  },
  prompt: `Translate the following text to {{targetLanguage}}:

  {{text}}`,
});

const translateExtractedTextFlow = ai.defineFlow<
  typeof TranslateExtractedTextInputSchema,
  typeof TranslateExtractedTextOutputSchema
>({
  name: 'translateExtractedTextFlow',
  inputSchema: TranslateExtractedTextInputSchema,
  outputSchema: TranslateExtractedTextOutputSchema,
},
async input => {
  const {output} = await translateTextPrompt(input);
  return output!;
}
);
