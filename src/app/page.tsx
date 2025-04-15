'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {extractTextFromImage} from '@/ai/flows/extract-text-from-image';
import {translateExtractedText} from '@/ai/flows/translate-extracted-text';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {useToast} from '@/hooks/use-toast';
import {toast} from '@/hooks/use-toast';

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('es');
  const [loading, setLoading] = useState<boolean>(false);
  const {toast} = useToast();

  const handleImageUpload = async () => {
    if (!imageUrl) {
      toast({
        title: 'Error',
        description: 'Please enter an image URL.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const extractionResult = await extractTextFromImage({photoUrl: imageUrl});
      setExtractedText(extractionResult.extractedText);
      toast({
        title: 'Text Extracted',
        description: 'Text successfully extracted from the image.',
      });
    } catch (error: any) {
      console.error('Error extracting text:', error);
      toast({
        title: 'Error',
        description: `Failed to extract text: ${error.message}`,
        variant: 'destructive',
      });
      setExtractedText('Error extracting text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (language: string) => {
    setTargetLanguage(language);
  };

  const handleTranslate = async () => {
    if (!extractedText) {
      toast({
        title: 'Error',
        description: 'No text to translate. Please upload an image and extract text first.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const translationResult = await translateExtractedText({text: extractedText, targetLanguage: targetLanguage});
      setTranslatedText(translationResult.translatedText);
      toast({
        title: 'Text Translated',
        description: 'Text translated successfully.',
      });
    } catch (error: any) {
      console.error('Translation error:', error);
      toast({
        title: 'Error',
        description: `Translation failed: ${error.message}`,
        variant: 'destructive',
      });
      setTranslatedText('Error translating text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-md space-y-4 rounded-lg shadow-md bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">LinguaLens</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Upload an image, extract text, and translate it!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="imageUrl" className="text-sm font-medium leading-none text-foreground">
              Image URL
            </label>
            <Input
              type="url"
              id="imageUrl"
              placeholder="Enter image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="rounded-md shadow-sm focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button onClick={handleImageUpload} disabled={loading} className="bg-teal text-white font-medium rounded-md hover:bg-teal/80 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Extracting...' : 'Extract Text'}
            </Button>
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="extractedText" className="text-sm font-medium leading-none text-foreground">
              Extracted Text
            </label>
            <Textarea
              id="extractedText"
              value={extractedText}
              readOnly
              placeholder="Extracted text will appear here"
              className="rounded-md shadow-sm focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="targetLanguage" className="text-sm font-medium leading-none text-foreground">
              Target Language
            </label>
            <Select onValueChange={handleLanguageChange}>
              <SelectTrigger className="bg-white rounded-md shadow-sm focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <SelectValue placeholder="Spanish (Default)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleTranslate} disabled={loading} className="bg-teal text-white font-medium rounded-md hover:bg-teal/80 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Translating...' : 'Translate Text'}
            </Button>
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="translatedText" className="text-sm font-medium leading-none text-foreground">
              Translated Text
            </label>
            <Textarea
              id="translatedText"
              value={translatedText}
              readOnly
              placeholder="Translated text will appear here"
              className="rounded-md shadow-sm focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
