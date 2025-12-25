import type { ImageContent } from '@/types/chat';

// サポートされている画像形式
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

// 最大ファイルサイズ (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * 画像ファイルのバリデーション
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // ファイルタイプのチェック
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: 'サポートされていないファイル形式です。PNG、JPEG、GIF、WebPのみ対応しています。',
    };
  }

  // ファイルサイズのチェック
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `ファイルサイズが大きすぎます。最大${MAX_FILE_SIZE / 1024 / 1024}MBまでです。`,
    };
  }

  return { valid: true };
}

/**
 * ファイルをbase64エンコード
 */
export function encodeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64String = reader.result as string;
      // data:image/png;base64,... の形式から base64部分のみを抽出
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };

    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました。'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 画像ファイルをImageContent形式に変換
 */
export async function convertFileToImageContent(file: File): Promise<ImageContent> {
  const validation = validateImageFile(file);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const base64Data = await encodeImageToBase64(file);

  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: file.type as ImageContent['source']['media_type'],
      data: base64Data,
    },
  };
}

/**
 * プレビュー用のURL生成
 */
export function createPreviewURL(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * プレビューURLのクリーンアップ
 */
export function revokePreviewURL(url: string): void {
  URL.revokeObjectURL(url);
}
