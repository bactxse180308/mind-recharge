import { X } from "lucide-react";

interface ImageLightboxProps {
  imageUrl?: string;
  alt: string;
  open: boolean;
  onClose: () => void;
}

const ImageLightbox = ({ imageUrl, alt, open, onClose }: ImageLightboxProps) => {
  if (!open || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 px-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        aria-label="Dong xem anh"
      >
        <X size={20} />
      </button>

      <img
        src={imageUrl}
        alt={alt}
        className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
};

export default ImageLightbox;
