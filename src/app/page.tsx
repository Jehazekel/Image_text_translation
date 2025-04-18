'use client';

import {useState, useRef, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {extractTextFromImage} from '@/ai/flows/extract-text-from-image';
import {translateExtractedText} from '@/ai/flows/translate-extracted-text';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {useToast} from '@/hooks/use-toast';
import {Input} from "@/components/ui/input";
import {Loader2, Camera} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import Markdown from '@/components/ui/markdown';
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";

export default function Home() {
  const [extractedText, setExtractedText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('es');
  const [extractionLoading, setExtractionLoading] = useState<boolean>(false);
  const [translationLoading, setTranslationLoading] = useState<boolean>(false);
  const {toast} = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
  }, []);


  const handleExtractText = async () => {
    if (!imageFile) {
      toast({
        title: 'Error',
        description: 'Please upload an image first.',
        variant: 'destructive',
      });
      return;
    }

    setExtractionLoading(true);
    try {
      const resolvedImageUrl = await fileToDataUrl(imageFile) as string;

      const extractionResult = await extractTextFromImage({photoUrl: resolvedImageUrl});
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
      setExtractionLoading(false);
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

    setTranslationLoading(true);
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
      setTranslationLoading(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      updateImagePreview(file);
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file.'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedImageFile = new File([blob], 'capturedImage.jpg', {type: 'image/jpeg'});
            setImageFile(capturedImageFile);
            updateImagePreview(capturedImageFile);
            setIsCameraActive(false);
          }
        }, 'image/jpeg');
      }
    }
  };

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  const updateImagePreview = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };


  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-[600px] space-y-4 rounded-lg shadow-md bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Image Translator</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Upload an image, extract text, and translate it!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button
              onClick={toggleCamera}
              variant="outline"
              className="bg-secondary text-foreground font-medium rounded-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCameraActive ? 'Close Camera' : 'Open Camera'}
              <Camera size={48}  className="ml-2 h-4 w-4" />
            </Button>

            {isCameraActive && hasCameraPermission ? (
              <>
                <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted style={{ border : '1px green solid'}}/>
                <Button onClick={captureImage} className="bg-teal-500 text-white font-medium rounded-md hover:bg-teal/80 disabled:cursor-not-allowed disabled:opacity-50">
                  Capture Image
                </Button>
                <canvas ref={canvasRef} style={{display: 'none' , border : '1px green solid'}} />
              </>
            ) : isCameraActive && !(hasCameraPermission) ? (
              <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access to use this feature.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <label htmlFor="imageFile" className="text-sm font-medium leading-none text-foreground">
                  Upload Image
                </label>
                <Input
                  type="file"
                  id="imageFile"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="rounded-md shadow-sm focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />

              </>
            )}
          </div>

          {imagePreviewUrl && (
            <div className="flex justify-center">
              <img
                src={imagePreviewUrl}
                alt="Image Preview"
                className="max-w-full max-h-[200px] rounded-md"
              />
            </div>
          )}

          <Button onClick={handleExtractText} disabled={extractionLoading} className="bg-teal-500 text-white font-medium rounded-md hover:bg-teal/80 disabled:cursor-not-allowed disabled:opacity-50">
            {extractionLoading ? (
              <>
                Extracting...
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              'Extract Text'
            )}
          </Button>

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

            <Button onClick={handleTranslate} disabled={translationLoading} className="bg-teal-500 text-white font-medium rounded-md hover:bg-teal/80 disabled:cursor-not-allowed disabled:opacity-50">
              {translationLoading ? 'Translating...' : 'Translate Text'}
            </Button>
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="markdownOutput" className="text-sm font-medium leading-none text-foreground">
              Translated Text
            </label>
            <div className="border max-h-[250px] overflow-y-auto rounded-md p-4 bg-secondary">
              <Markdown text={translatedText}/>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
