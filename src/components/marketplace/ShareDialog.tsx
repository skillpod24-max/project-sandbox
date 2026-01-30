import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, ExternalLink } from "lucide-react";
import FacebookIcon from "@/assets/social/facebook.svg?react";
import InstagramIcon from "@/assets/social/instagram.svg?react";
import WhatsAppIcon from "@/assets/social/whatsapp.svg?react";
import YouTubeIcon from "@/assets/social/youtube.svg?react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url: string;
  description?: string;
}

const ShareDialog = ({ open, onOpenChange, title, url, description }: ShareDialogProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description || title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied!" });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const shareLinks = [
    {
      name: "WhatsApp",
      icon: WhatsAppIcon,
      color: "bg-[#25D366] hover:bg-[#20BD5A]",
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: "Facebook",
      icon: FacebookIcon,
      color: "bg-[#1877F2] hover:bg-[#166FE5]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "Telegram",
      icon: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
      color: "bg-[#0088cc] hover:bg-[#007AB8]",
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: "Instagram",
      icon: InstagramIcon,
      color: "bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#dc2743] hover:opacity-90",
      url: `https://www.instagram.com/`,
      note: "Copy link to share on Instagram"
    },
    {
      name: "Gmail",
      icon: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
        </svg>
      ),
      color: "bg-[#EA4335] hover:bg-[#D93025]",
      url: `mailto:?subject=${encodedTitle}&body=Check%20out%20this%20vehicle%3A%20${encodedUrl}`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Vehicle</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Copy Link */}
          <div className="flex items-center gap-2">
            <Input
              value={url}
              readOnly
              className="flex-1 text-sm bg-slate-50"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-5 gap-3">
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={link.note ? handleCopy : undefined}
                className={`flex flex-col items-center justify-center p-3 rounded-xl text-white transition-all ${link.color}`}
              >
                <link.icon className="h-6 w-6" />
                <span className="text-[10px] mt-1 font-medium">{link.name}</span>
              </a>
            ))}
          </div>

          {/* Native Share (Mobile) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={async () => {
                try {
                  await navigator.share({ title, url, text: description });
                } catch (err) {
                  console.log('Share cancelled');
                }
              }}
            >
              <ExternalLink className="h-4 w-4" />
              More Options
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
