import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FullscreenReaderProps {
  isOpen: boolean;
  onClose: () => void;
  titleEn: string | null;
  titleAr: string;
  contentEn: string | null;
  contentAr: string;
}

const FullscreenReader = ({ isOpen, onClose, titleEn, titleAr, contentEn, contentAr }: FullscreenReaderProps) => {
  const { language } = useLanguage();

  if (!isOpen) return null;

  const title = language === 'en' ? titleEn || titleAr : titleAr;
  const content = language === 'en' ? contentEn || contentAr : contentAr;

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4 overflow-auto">
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-10 p-2 rounded-full bg-background border border-border hover:bg-accent transition-colors"
        aria-label="Close fullscreen"
      >
        <X className="h-6 w-6" />
      </button>
      
      <div className="w-full max-w-4xl mx-auto my-8">
        <div 
          className="bg-card border border-border shadow-2xl rounded-lg p-12 min-h-[297mm]"
          style={{
            aspectRatio: '210/297',
            maxWidth: '210mm',
          }}
        >
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-4xl font-bold mb-8 text-foreground border-b border-border pb-4">
              {title}
            </h1>
            <div 
              className="text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </article>
        </div>
      </div>
    </div>
  );
};

export default FullscreenReader;
