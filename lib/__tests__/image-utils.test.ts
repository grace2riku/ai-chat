import {
  validateImageFile,
  encodeImageToBase64,
  convertFileToImageContent,
  createPreviewURL,
  revokePreviewURL,
  SUPPORTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from '../image-utils';

// Mock browser APIs for URL object
let mockUrlCounter = 0;
global.URL.createObjectURL = jest.fn(() => `blob:http://localhost/mock-url-${mockUrlCounter++}`);
global.URL.revokeObjectURL = jest.fn();

describe('image-utils', () => {
  describe('Constants', () => {
    it('exports correct supported image types', () => {
      // Given: SUPPORTED_IMAGE_TYPES constant
      // Then: Should include all supported formats
      expect(SUPPORTED_IMAGE_TYPES).toEqual([
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ]);
    });

    it('exports correct maximum file size (5MB)', () => {
      // Given: MAX_FILE_SIZE constant
      // Then: Should be 5MB in bytes
      expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
      expect(MAX_FILE_SIZE).toBe(5242880);
    });
  });

  describe('validateImageFile', () => {
    describe('Valid files', () => {
      it('validates PNG file successfully', () => {
        // Given: Valid PNG file
        const file = new File(['test'], 'test.png', { type: 'image/png' });

        // When: File is validated
        const result = validateImageFile(file);

        // Then: Should be valid
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('validates JPEG file successfully', () => {
        // Given: Valid JPEG file
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        // When: File is validated
        const result = validateImageFile(file);

        // Then: Should be valid
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('validates GIF file successfully', () => {
        // Given: Valid GIF file
        const file = new File(['test'], 'test.gif', { type: 'image/gif' });

        // When: File is validated
        const result = validateImageFile(file);

        // Then: Should be valid
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('validates WebP file successfully', () => {
        // Given: Valid WebP file
        const file = new File(['test'], 'test.webp', { type: 'image/webp' });

        // When: File is validated
        const result = validateImageFile(file);

        // Then: Should be valid
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('validates file at maximum size limit', () => {
        // Given: File exactly at 5MB limit
        const fileContent = new Array(MAX_FILE_SIZE).fill('x').join('');
        const file = new File([fileContent], 'large.png', { type: 'image/png' });

        // When: File is validated
        const result = validateImageFile(file);

        // Then: Should be valid
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('validates small file (1 byte)', () => {
        // Given: Very small file
        const file = new File(['x'], 'tiny.png', { type: 'image/png' });

        // When: File is validated
        const result = validateImageFile(file);

        // Then: Should be valid
        expect(result.valid).toBe(true);
      });
    });

    describe('Invalid file types', () => {
      it('rejects unsupported BMP format', () => {
        // Given: BMP file (not supported)
        const file = new File(['test'], 'test.bmp', { type: 'image/bmp' });

        // When: File is validated
        const result = validateImageFile(file);

        // Then: Should be invalid with appropriate error
        expect(result.valid).toBe(false);
        expect(result.error).toBe('サポートされていないファイル形式です。PNG、JPEG、GIF、WebPのみ対応しています。');
      });

      it('rejects SVG format', () => {
        // Given: SVG file (not supported)
        const file = new File(['test'], 'test.svg', { type: 'image/svg+xml' });

        // When: File is validated
        const result = validateImageFile(file);

        // Then: Should be invalid
        expect(result.valid).toBe(false);
        expect(result.error).toBe('サポートされていないファイル形式です。PNG、JPEG、GIF、WebPのみ対応しています。');
      });

      it('rejects text file', () => {
        // Given: Text file
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });

        // When: File is validated
        const result = validateImageFile(file);

        // Then: Should be invalid
        expect(result.valid).toBe(false);
        expect(result.error).toBe('サポートされていないファイル形式です。PNG、JPEG、GIF、WebPのみ対応しています。');
      });

      it('rejects PDF file', () => {
        // Given: PDF file
        const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

        // When: File is validated
        const result = validateImageFile(file);

        // Then: Should be invalid
        expect(result.valid).toBe(false);
        expect(result.error).toBe('サポートされていないファイル形式です。PNG、JPEG、GIF、WebPのみ対応しています。');
      });

      it('rejects file with empty MIME type', () => {
        // Given: File with empty type
        const file = new File(['test'], 'test', { type: '' });

        // When: File is validated
        const result = validateImageFile(file);

        // Then: Should be invalid
        expect(result.valid).toBe(false);
        expect(result.error).toBe('サポートされていないファイル形式です。PNG、JPEG、GIF、WebPのみ対応しています。');
      });
    });

    describe('File size validation', () => {
      it('rejects file exceeding maximum size by 1 byte', () => {
        // Given: File just over 5MB limit
        const fileContent = new Array(MAX_FILE_SIZE + 1).fill('x').join('');
        const file = new File([fileContent], 'toolarge.png', { type: 'image/png' });

        // When: File is validated
        const result = validateImageFile(file);

        // Then: Should be invalid with size error
        expect(result.valid).toBe(false);
        expect(result.error).toBe('ファイルサイズが大きすぎます。最大5MBまでです。');
      });

      it('rejects file significantly exceeding maximum size (10MB)', () => {
        // Given: File at 10MB
        const fileContent = new Array(10 * 1024 * 1024).fill('x').join('');
        const file = new File([fileContent], 'verylarge.png', { type: 'image/png' });

        // When: File is validated
        const result = validateImageFile(file);

        // Then: Should be invalid with size error
        expect(result.valid).toBe(false);
        expect(result.error).toBe('ファイルサイズが大きすぎます。最大5MBまでです。');
      });
    });

    describe('Combined validation', () => {
      it('rejects file with both invalid type and size', () => {
        // Given: Large text file (both invalid type and size)
        const fileContent = new Array(MAX_FILE_SIZE + 1).fill('x').join('');
        const file = new File([fileContent], 'large.txt', { type: 'text/plain' });

        // When: File is validated
        const result = validateImageFile(file);

        // Then: Should be invalid (type check happens first)
        expect(result.valid).toBe(false);
        expect(result.error).toBe('サポートされていないファイル形式です。PNG、JPEG、GIF、WebPのみ対応しています。');
      });
    });
  });

  describe('encodeImageToBase64', () => {
    it('encodes image file to base64 successfully', async () => {
      // Given: PNG file
      const fileContent = 'test image content';
      const file = new File([fileContent], 'test.png', { type: 'image/png' });

      // When: File is encoded
      const result = await encodeImageToBase64(file);

      // Then: Should return base64 string (without data URL prefix)
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      // Base64 should not include the data URL prefix
      expect(result).not.toMatch(/^data:/);
    });

    it('encodes different file types correctly', async () => {
      // Given: JPEG file
      const file = new File(['jpeg content'], 'test.jpg', { type: 'image/jpeg' });

      // When: File is encoded
      const result = await encodeImageToBase64(file);

      // Then: Should return base64 string
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('encodes empty file', async () => {
      // Given: Empty file
      const file = new File([], 'empty.png', { type: 'image/png' });

      // When: File is encoded
      const result = await encodeImageToBase64(file);

      // Then: Should return base64 string (may be empty or minimal)
      expect(typeof result).toBe('string');
    });

    it('handles file read errors', async () => {
      // Given: Mock FileReader with error
      const originalFileReader = global.FileReader;
      const mockFileReader = {
        readAsDataURL: jest.fn(function(this: any) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Read error'));
            }
          }, 0);
        }),
      } as any;

      global.FileReader = jest.fn(() => mockFileReader) as any;

      const file = new File(['test'], 'test.png', { type: 'image/png' });

      // When: File encoding is attempted
      // Then: Should reject with error
      await expect(encodeImageToBase64(file)).rejects.toThrow('ファイルの読み込みに失敗しました。');

      // Cleanup
      global.FileReader = originalFileReader;
    });

    it('returns only base64 data without data URL prefix', async () => {
      // Given: PNG file
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      // When: File is encoded
      const result = await encodeImageToBase64(file);

      // Then: Result should be pure base64 (no "data:image/png;base64," prefix)
      expect(result).not.toContain('data:');
      expect(result).not.toContain(';base64,');
      // Base64 typically contains alphanumeric and +/= characters
      expect(result).toMatch(/^[A-Za-z0-9+/=]*$/);
    });
  });

  describe('convertFileToImageContent', () => {
    it('converts valid PNG file to ImageContent format', async () => {
      // Given: Valid PNG file
      const file = new File(['test image'], 'test.png', { type: 'image/png' });

      // When: File is converted
      const result = await convertFileToImageContent(file);

      // Then: Should return proper ImageContent structure
      expect(result).toHaveProperty('type', 'image');
      expect(result).toHaveProperty('source');
      expect(result.source).toHaveProperty('type', 'base64');
      expect(result.source).toHaveProperty('media_type', 'image/png');
      expect(result.source).toHaveProperty('data');
      expect(typeof result.source.data).toBe('string');
    });

    it('converts valid JPEG file with correct media type', async () => {
      // Given: Valid JPEG file
      const file = new File(['jpeg data'], 'photo.jpg', { type: 'image/jpeg' });

      // When: File is converted
      const result = await convertFileToImageContent(file);

      // Then: Should have correct JPEG media type
      expect(result.source.media_type).toBe('image/jpeg');
      expect(result.type).toBe('image');
    });

    it('converts valid GIF file with correct media type', async () => {
      // Given: Valid GIF file
      const file = new File(['gif data'], 'animation.gif', { type: 'image/gif' });

      // When: File is converted
      const result = await convertFileToImageContent(file);

      // Then: Should have correct GIF media type
      expect(result.source.media_type).toBe('image/gif');
    });

    it('converts valid WebP file with correct media type', async () => {
      // Given: Valid WebP file
      const file = new File(['webp data'], 'modern.webp', { type: 'image/webp' });

      // When: File is converted
      const result = await convertFileToImageContent(file);

      // Then: Should have correct WebP media type
      expect(result.source.media_type).toBe('image/webp');
    });

    it('throws error for invalid file type', async () => {
      // Given: Invalid file type (SVG)
      const file = new File(['svg'], 'image.svg', { type: 'image/svg+xml' });

      // When: Attempting to convert
      // Then: Should throw validation error
      await expect(convertFileToImageContent(file)).rejects.toThrow(
        'サポートされていないファイル形式です。PNG、JPEG、GIF、WebPのみ対応しています。'
      );
    });

    it('throws error for file exceeding size limit', async () => {
      // Given: File exceeding 5MB
      const largeContent = new Array(MAX_FILE_SIZE + 1).fill('x').join('');
      const file = new File([largeContent], 'huge.png', { type: 'image/png' });

      // When: Attempting to convert
      // Then: Should throw size error
      await expect(convertFileToImageContent(file)).rejects.toThrow(
        'ファイルサイズが大きすぎます。最大5MBまでです。'
      );
    });

    it('throws error for text file', async () => {
      // Given: Text file
      const file = new File(['text content'], 'document.txt', { type: 'text/plain' });

      // When: Attempting to convert
      // Then: Should throw validation error
      await expect(convertFileToImageContent(file)).rejects.toThrow(
        'サポートされていないファイル形式です'
      );
    });

    it('includes base64 data in result', async () => {
      // Given: Valid image file
      const file = new File(['image data'], 'test.png', { type: 'image/png' });

      // When: File is converted
      const result = await convertFileToImageContent(file);

      // Then: Base64 data should be present and non-empty
      expect(result.source.data).toBeTruthy();
      expect(result.source.data.length).toBeGreaterThan(0);
      // Should be valid base64
      expect(result.source.data).toMatch(/^[A-Za-z0-9+/=]*$/);
    });
  });

  describe('createPreviewURL', () => {
    it('creates blob URL for image file', () => {
      // Given: Image file
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      // When: Preview URL is created
      const url = createPreviewURL(file);

      // Then: Should return blob URL
      expect(url).toBeTruthy();
      expect(url).toMatch(/^blob:/);
    });

    it('creates different URLs for different files', () => {
      // Given: Two different files
      const file1 = new File(['test1'], 'test1.png', { type: 'image/png' });
      const file2 = new File(['test2'], 'test2.png', { type: 'image/png' });

      // When: Preview URLs are created
      const url1 = createPreviewURL(file1);
      const url2 = createPreviewURL(file2);

      // Then: URLs should be different
      expect(url1).not.toBe(url2);
    });

    it('creates URL for any file type', () => {
      // Given: Non-image file (URL.createObjectURL works for any blob)
      const file = new File(['text'], 'test.txt', { type: 'text/plain' });

      // When: Preview URL is created
      const url = createPreviewURL(file);

      // Then: Should still create a blob URL
      expect(url).toMatch(/^blob:/);
    });
  });

  describe('revokePreviewURL', () => {
    it('revokes blob URL without throwing error', () => {
      // Given: Blob URL
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const url = createPreviewURL(file);

      // When: URL is revoked
      // Then: Should not throw error
      expect(() => revokePreviewURL(url)).not.toThrow();
    });

    it('handles revoking invalid URL gracefully', () => {
      // Given: Invalid URL
      const invalidUrl = 'not-a-blob-url';

      // When: Attempting to revoke
      // Then: Should not throw error (URL.revokeObjectURL handles this)
      expect(() => revokePreviewURL(invalidUrl)).not.toThrow();
    });

    it('handles revoking already-revoked URL', () => {
      // Given: Blob URL that has been revoked
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const url = createPreviewURL(file);
      revokePreviewURL(url);

      // When: Attempting to revoke again
      // Then: Should not throw error
      expect(() => revokePreviewURL(url)).not.toThrow();
    });

    it('handles empty string URL', () => {
      // Given: Empty string
      const url = '';

      // When: Attempting to revoke
      // Then: Should not throw error
      expect(() => revokePreviewURL(url)).not.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('full workflow: validate, encode, and create preview for valid file', async () => {
      // Given: Valid image file
      const file = new File(['test image content'], 'photo.jpg', { type: 'image/jpeg' });

      // When: Full workflow is executed
      const validation = validateImageFile(file);
      expect(validation.valid).toBe(true);

      const imageContent = await convertFileToImageContent(file);
      const previewUrl = createPreviewURL(file);

      // Then: All operations should succeed
      expect(imageContent.type).toBe('image');
      expect(imageContent.source.media_type).toBe('image/jpeg');
      expect(previewUrl).toMatch(/^blob:/);

      // Cleanup
      revokePreviewURL(previewUrl);
    });

    it('full workflow: reject invalid file before encoding', async () => {
      // Given: Invalid file (too large)
      const largeContent = new Array(MAX_FILE_SIZE + 1).fill('x').join('');
      const file = new File([largeContent], 'huge.png', { type: 'image/png' });

      // When: Validation is performed
      const validation = validateImageFile(file);

      // Then: Should fail validation
      expect(validation.valid).toBe(false);
      expect(validation.error).toBeTruthy();

      // And: Conversion should throw
      await expect(convertFileToImageContent(file)).rejects.toThrow();
    });
  });
});
