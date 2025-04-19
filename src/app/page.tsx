'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';
import { translateExtractedText } from '@/ai/flows/translate-extracted-text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";
import { Loader2, Camera } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import Markdown from '@/components/ui/markdown';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Webcam from "react-webcam";

export default function Home() {
  const [extractedText, setExtractedText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('es');
  const [extractionLoading, setExtractionLoading] = useState<boolean>(false);
  const [translationLoading, setTranslationLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(true);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);


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

      const extractionResult = await extractTextFromImage({ photoUrl: resolvedImageUrl });
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
      const translationResult = await translateExtractedText({ text: extractedText, targetLanguage: targetLanguage });
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
    if (webcamRef.current && canvasRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        dataURLtoFile(imageSrc, 'capturedImage.jpg').then(capturedImageFile => {
          setImageFile(capturedImageFile);
          updateImagePreview(capturedImageFile);
          setIsCameraActive(false);
        });
      }
    }
  };

  const dataURLtoFile = (dataurl: string, filename: string): Promise<File> => {
    return new Promise((resolve, reject) => {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      try {
        const file = new File([u8arr], filename, { type: mime });
        resolve(file);
      } catch (e) {
        reject(e);
      }
    });
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
    removeImage();
  };

  const updateImagePreview = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [useFrontCamera, setUseFrontCamera] = useState(false); // default to use the back camera
  const [cameraInfo, setCameraInfo] = useState({ hasFrontCamera: false, hasBackCamera: false });
  const [checkingCamera, setCheckingCamera] = useState(false);


  useEffect(() => {
    async function getMedia(constraints: MediaStreamConstraints | undefined) {
      let stream = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        /* use the stream */
        return true;
      } catch (err) {
        console.log('Error fetching camera with constraints: ', constraints, err)
        /* handle the error */
        return false
      }
    }

    async function checkCameras() {

      // check for front camera 
      const hasFrontCamera = await getMedia({
        video: {
          facingMode: 'user',
        },
      });
      const hasBackCamera = await getMedia({
        video: {
          facingMode: { exact: "environment" },
        },
      });
      if (hasFrontCamera && !hasBackCamera)
        setUseFrontCamera(true)
      setCameraInfo({ hasFrontCamera, hasBackCamera })
      setCheckingCamera(false);
    };

    setCheckingCamera(true);
    checkCameras();
  }, [])


  const videoConstraints = useMemo(() => {
    return {
      facingMode: cameraInfo.hasFrontCamera && useFrontCamera ? 'user' :
        cameraInfo.hasBackCamera ? { exact: "environment" } : ''
    }
  }, [cameraInfo, useFrontCamera]);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-[600px] space-y-4 rounded-lg shadow-md bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Image Translator</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Upload an image, extract text, and translate it! <br/>
            has front camera : {`${cameraInfo.hasFrontCamera}`} <br/>
            has back camera : {`${cameraInfo.hasBackCamera}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button
              onClick={toggleCamera}
              disabled={checkingCamera}
              variant="outline"
              className="bg-secondary text-foreground font-medium rounded-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkingCamera ? <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                :
                isCameraActive ? 'Close Camera' : 'Open Camera'
              }
            </Button>

            {isCameraActive && hasCameraPermission ? (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  videoConstraints={videoConstraints}
                  className="w-full aspect-video rounded-md"
                  screenshotFormat="image/jpeg"
                />

                <Button onClick={captureImage} className="bg-teal-500 text-white font-medium rounded-md hover:bg-teal/80 disabled:cursor-not-allowed disabled:opacity-50">
                  Capture Image
                </Button>

                {(cameraInfo.hasFrontCamera && !useFrontCamera) || (cameraInfo.hasBackCamera && useFrontCamera)
                  ?
                  <Button variant="outline" onClick={() => setUseFrontCamera(prev => !prev)} className="bg-secondary text-foreground font-medium rounded-md disabled:cursor-not-allowed disabled:opacity-50">
                    Rotate Camera
                  </Button>
                  :
                  <></>
                }


                <canvas ref={canvasRef} style={{ display: 'none', border: '1px green solid' }} />
              </>
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
            (cameraInfo.hasFrontCamera && useFrontCamera) || (cameraInfo.hasBackCamera && !useFrontCamera)
          )
            ?
            (
              <div className='flex flex-col gap-2'>
                <div className="flex justify-center">
                  <img
                    src={imagePreviewUrl}
                    alt="Image Preview"
                    className="max-w-full max-h-[200px] rounded-md"
                  />
                </div>
                <Button onClick={removeImage} className="bg-teal-500 text-white font-medium rounded-md hover:bg-teal/80 disabled:cursor-not-allowed disabled:opacity-50">
                  Remove Image
                </Button>
              </div>
            )
            :
            <></>
          }

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
              <Markdown text={translatedText} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
