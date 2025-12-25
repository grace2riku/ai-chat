import { useRef, useCallback, memo } from 'react';
import type { ImageUploadData } from '@/types/chat';
import { convertFileToImageContent, createPreviewURL } from '@/lib/image-utils';

interface ImageUploadProps {
  onImageSelect: (imageData: ImageUploadData | null) => void;
  currentImage: ImageUploadData | null;
  disabled?: boolean;
}

function ImageUpload({ onImageSelect, currentImage, disabled = false }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (file: File | null) => {
      if (!file) {
        onImageSelect(null);
        return;
      }

      try {
        const imageContent = await convertFileToImageContent(file);
        const preview = createPreviewURL(file);

        onImageSelect({
          file,
          preview,
          imageContent,
        });
      } catch (error) {
        alert(error instanceof Error ? error.message : '画像の処理に失敗しました。');
        onImageSelect(null);
      }
    },
    [onImageSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      handleFileChange(file || null);
    },
    [handleFileChange]
  );

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveImage = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageSelect(null);
  }, [onImageSelect]);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
        aria-label="画像ファイルを選択"
      />

      {!currentImage ? (
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled}
          aria-label="画像を添付"
          className="p-2 rounded-lg border border-border bg-white
                     transition-all duration-300
                     hover:bg-surface hover:border-primary hover:shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
      ) : (
        <div className="relative group">
          <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-surface">
            <img
              src={currentImage.preview}
              alt="添付画像のプレビュー"
              className="h-12 w-12 object-cover rounded"
            />
            <span className="text-sm text-secondary max-w-[100px] truncate">
              {currentImage.file.name}
            </span>
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={disabled}
              aria-label="画像を削除"
              className="p-1 rounded hover:bg-white transition-colors
                         focus:outline-none focus:ring-2 focus:ring-primary
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-secondary hover:text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ImageUpload);
