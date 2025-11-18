import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Link as LinkIcon } from "lucide-react";

interface HeroImageUploadProps {
  currentImage: string;
  onImageUpdate: (url: string) => void;
  language: string;
}

export function HeroImageUpload({ currentImage, onImageUpdate, language }: HeroImageUploadProps) {
  const isArabic = language === "ar";
  const [imageUrl, setImageUrl] = useState(currentImage);
  const [isLoading, setIsLoading] = useState(false);

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) {
      toast.error(isArabic ? "الرجاء إدخال رابط الصورة" : "Please enter image URL");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase
      .from("settings")
      .upsert({
        key: "hero_image",
        value: { url: imageUrl, type: "url" },
      });

    if (error) {
      toast.error(isArabic ? "فشل تحديث الصورة" : "Failed to update image");
    } else {
      toast.success(isArabic ? "تم تحديث الصورة" : "Image updated successfully");
      onImageUpdate(imageUrl);
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(isArabic ? "الرجاء اختيار صورة" : "Please select an image file");
      return;
    }

    setIsLoading(true);
    
    // For now, we'll use URL method. In production, you'd upload to storage
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const { error } = await supabase
        .from("settings")
        .upsert({
          key: "hero_image",
          value: { url: base64, type: "upload" },
        });

      if (error) {
        toast.error(isArabic ? "فشل رفع الصورة" : "Failed to upload image");
      } else {
        toast.success(isArabic ? "تم رفع الصورة" : "Image uploaded successfully");
        onImageUpdate(base64);
      }
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isArabic ? "صورة الصفحة الرئيسية" : "Hero Image"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="url">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">
              <LinkIcon className="h-4 w-4 mr-2" />
              {isArabic ? "رابط" : "URL"}
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              {isArabic ? "رفع" : "Upload"}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="url" className="space-y-4">
            <div>
              <Label htmlFor="imageUrl">
                {isArabic ? "رابط الصورة" : "Image URL"}
              </Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            <Button onClick={handleUrlSubmit} disabled={isLoading}>
              {isLoading
                ? isArabic
                  ? "جاري التحديث..."
                  : "Updating..."
                : isArabic
                ? "تحديث الصورة"
                : "Update Image"}
            </Button>
          </TabsContent>
          <TabsContent value="upload" className="space-y-4">
            <div>
              <Label htmlFor="imageFile">
                {isArabic ? "اختر صورة" : "Choose Image"}
              </Label>
              <Input
                id="imageFile"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
            </div>
          </TabsContent>
        </Tabs>

        {currentImage && (
          <div className="mt-4">
            <Label>{isArabic ? "الصورة الحالية" : "Current Image"}</Label>
            <img
              src={currentImage}
              alt="Hero"
              className="mt-2 w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
