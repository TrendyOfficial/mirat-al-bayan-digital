import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import DOMPurify from "dompurify";

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
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-hidden">
      <button
        onClick={onClose}
        className="fixed top-6 right-6 z-[60] p-2 rounded-full bg-background border border-border hover:bg-accent transition-colors shadow-lg"
        aria-label="Close fullscreen"
      >
        <X className="h-6 w-6" />
      </button>
      
      <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto">
        <div 
          className="bg-card border border-border shadow-2xl rounded-lg p-12 my-8 mx-auto max-h-[calc(100vh-4rem)] overflow-y-auto hover:cursor-auto"
          style={{
            width: '210mm',
            minHeight: '297mm',
          }}
        >
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-4xl font-bold mb-8 text-foreground border-b border-border pb-4 break-words">
              {title}
            </h1>
            <div 
              className="text-foreground leading-relaxed whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
            />
          </article>
        </div>
      </div>
    </div>
  );
};

export default FullscreenReader;
