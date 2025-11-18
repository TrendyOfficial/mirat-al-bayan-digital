import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HeroImageManagerProps {
  onImagesUpdated: () => void;
}

export function HeroImageManager({ onImagesUpdated }: HeroImageManagerProps) {
  const [leftUrl, setLeftUrl] = useState("");
  const [middleUrl, setMiddleUrl] = useState("");
  const [rightUrl, setRightUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUrlSubmit = async (position: 'left' | 'middle' | 'right', url: string) => {
    if (!url) return;

    setUploading(true);
    try {
      const key = position === 'middle' ? 'hero_image' : `hero_image_${position}`;
      const { error } = await supabase
        .from("settings")
        .upsert(
          { key, value: { url } },
          { onConflict: "key" }
        );

      if (error) throw error;

      toast.success(`${position} image updated successfully!`);
      onImagesUpdated();
      
      if (position === 'left') setLeftUrl("");
      if (position === 'middle') setMiddleUrl("");
      if (position === 'right') setRightUrl("");
    } catch (error) {
      console.error("Error updating image:", error);
      toast.error("Failed to update image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (position: 'left' | 'middle' | 'right') => {
    setUploading(true);
    try {
      const key = position === 'middle' ? 'hero_image' : `hero_image_${position}`;
      const { error } = await supabase
        .from("settings")
        .delete()
        .eq("key", key);

      if (error) throw error;

      toast.success(`${position} image removed successfully!`);
      onImagesUpdated();
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error("Failed to remove image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">Manage Hero Images</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Add up to 3 images: left (small), middle (large), and right (small)
      </p>

      <Tabs defaultValue="left" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="left">Left Image</TabsTrigger>
          <TabsTrigger value="middle">Middle Image</TabsTrigger>
          <TabsTrigger value="right">Right Image</TabsTrigger>
        </TabsList>

        <TabsContent value="left" className="space-y-4">
          <div>
            <Label htmlFor="left-url">Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="left-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={leftUrl}
                onChange={(e) => setLeftUrl(e.target.value)}
              />
              <Button
                onClick={() => handleUrlSubmit('left', leftUrl)}
                disabled={!leftUrl || uploading}
              >
                Update
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRemove('left')}
                disabled={uploading}
              >
                Remove
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="middle" className="space-y-4">
          <div>
            <Label htmlFor="middle-url">Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="middle-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={middleUrl}
                onChange={(e) => setMiddleUrl(e.target.value)}
              />
              <Button
                onClick={() => handleUrlSubmit('middle', middleUrl)}
                disabled={!middleUrl || uploading}
              >
                Update
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRemove('middle')}
                disabled={uploading}
              >
                Remove
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="right" className="space-y-4">
          <div>
            <Label htmlFor="right-url">Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="right-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={rightUrl}
                onChange={(e) => setRightUrl(e.target.value)}
              />
              <Button
                onClick={() => handleUrlSubmit('right', rightUrl)}
                disabled={!rightUrl || uploading}
              >
                Update
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRemove('right')}
                disabled={uploading}
              >
                Remove
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}