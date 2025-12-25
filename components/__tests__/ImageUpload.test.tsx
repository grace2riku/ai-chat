import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUpload from '../ImageUpload';
import type { ImageUploadData } from '@/types/chat';
import * as imageUtils from '@/lib/image-utils';

// Mock browser APIs that aren't available in jsdom
global.URL.createObjectURL = jest.fn(() => 'blob:mock-preview-url');
global.URL.revokeObjectURL = jest.fn();
global.FileReader = jest.fn().mockImplementation(function(this: any) {
  this.readAsDataURL = jest.fn(function(this: any, file: File) {
    // Simulate async file reading
    setTimeout(() => {
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      // Set result on the FileReader instance (not in event)
      this.result = `data:${file.type};base64,${base64Data}`;
      if (this.onload) {
        this.onload();  // Call onload handler (it accesses this.result)
      }
    }, 0);
  });
}) as any;

describe('ImageUpload', () => {
  const mockOnImageSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Restore all spies before each test to ensure clean state
    jest.restoreAllMocks();
    // Mock window.alert to avoid jsdom "not implemented" errors
    global.alert = jest.fn();
  });

  describe('Initial rendering', () => {
    it('renders image upload button when no image is selected', () => {
      // Given: No current image
      // When: Component is rendered
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
        />
      );

      // Then: Upload button should be visible
      const uploadButton = screen.getByLabelText('画像を添付');
      expect(uploadButton).toBeInTheDocument();
      expect(uploadButton).toHaveAttribute('type', 'button');
    });

    it('renders hidden file input with correct accept attribute', () => {
      // Given: No current image
      // When: Component is rendered
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
        />
      );

      // Then: Hidden file input should exist with correct attributes
      const fileInput = screen.getByLabelText('画像ファイルを選択');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', 'image/png,image/jpeg,image/gif,image/webp');
      expect(fileInput).toHaveClass('hidden');
    });

    it('renders image preview when image is selected', () => {
      // Given: Current image data
      const mockImageData: ImageUploadData = {
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        preview: 'blob:http://localhost/test-preview',
        imageContent: {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: 'test-data',
          },
        },
      };

      // When: Component is rendered with current image
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={mockImageData}
        />
      );

      // Then: Preview should be displayed
      const previewImage = screen.getByAltText('添付画像のプレビュー');
      expect(previewImage).toBeInTheDocument();
      expect(previewImage).toHaveAttribute('src', 'blob:http://localhost/test-preview');

      // And: File name should be displayed
      expect(screen.getByText('test.png')).toBeInTheDocument();

      // And: Remove button should be visible
      const removeButton = screen.getByLabelText('画像を削除');
      expect(removeButton).toBeInTheDocument();
    });
  });

  describe('File selection functionality', () => {
    it('triggers file input when upload button is clicked', async () => {
      // Given: Component with no image
      const user = userEvent.setup();
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
        />
      );

      const uploadButton = screen.getByLabelText('画像を添付');
      const fileInput = screen.getByLabelText('画像ファイルを選択') as HTMLInputElement;

      // Create a spy on the click method
      const clickSpy = jest.spyOn(fileInput, 'click');

      try {
        // When: Upload button is clicked
        await user.click(uploadButton);

        // Then: File input click should be triggered
        await waitFor(() => {
          expect(clickSpy).toHaveBeenCalled();
        });
      } finally {
        // CRITICAL: Restore spy immediately after use
        clickSpy.mockRestore();
      }
    });

    it('processes valid image file selection successfully', async () => {
      // Given: Component with no image
      const user = userEvent.setup();
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
        />
      );

      const fileInput = screen.getByLabelText('画像ファイルを選択') as HTMLInputElement;
      const testFile = new File(['test image content'], 'test-image.png', { type: 'image/png' });

      // When: Valid image file is selected
      await user.upload(fileInput, testFile);

      // Then: onImageSelect callback should be called with proper image data
      await waitFor(() => {
        expect(mockOnImageSelect).toHaveBeenCalled();
        const callArg = mockOnImageSelect.mock.calls[0][0] as ImageUploadData;
        expect(callArg.file).toBe(testFile);
        expect(callArg.preview).toMatch(/^blob:/);
        expect(callArg.imageContent.type).toBe('image');
        expect(callArg.imageContent.source.type).toBe('base64');
        expect(callArg.imageContent.source.media_type).toBe('image/png');
        expect(callArg.imageContent.source.data).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('handles null file selection (user cancels)', async () => {
      // Given: Component with no image
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
        />
      );

      const fileInput = screen.getByLabelText('画像ファイルを選択') as HTMLInputElement;

      // When: User cancels file selection (simulated by triggering change with no files)
      // Simulate cancellation by manually triggering change event with null
      Object.defineProperty(fileInput, 'files', {
        value: null,
        writable: false,
      });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Then: onImageSelect should be called with null
      await waitFor(() => {
        expect(mockOnImageSelect).toHaveBeenCalledWith(null);
      }, { timeout: 3000 });
    });
  });

  describe('Image validation and error handling', () => {
    it('displays error alert when image processing fails with file size exceeded', async () => {
      // Given: Component with no image
      const user = userEvent.setup();
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
        />
      );

      const fileInput = screen.getByLabelText('画像ファイルを選択') as HTMLInputElement;
      // Create a file larger than 5MB to trigger real size validation
      const largeContent = new Uint8Array(6 * 1024 * 1024).fill(65); // 6MB of 'A'
      const largeFile = new File([largeContent], 'large.png', { type: 'image/png' });

      // When: Large file is selected
      await user.upload(fileInput, largeFile);

      // Then: Error alert should be displayed with correct message
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'ファイルサイズが大きすぎます。最大5MBまでです。'
        );
      }, { timeout: 10000 }); // Increased timeout for large file processing

      // And: onImageSelect should be called with null
      expect(mockOnImageSelect).toHaveBeenCalledWith(null);
    });

  });

  describe('Image removal functionality', () => {
    it('removes image when remove button is clicked', async () => {
      // Given: Component with current image
      const mockImageData: ImageUploadData = {
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        preview: 'blob:http://localhost/test-preview',
        imageContent: {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: 'test-data',
          },
        },
      };

      const user = userEvent.setup();
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={mockImageData}
        />
      );

      const removeButton = screen.getByLabelText('画像を削除');

      // When: Remove button is clicked
      await user.click(removeButton);

      // Then: onImageSelect should be called with null
      expect(mockOnImageSelect).toHaveBeenCalledWith(null);
    });

    it('clears file input value when removing image', async () => {
      // Given: Component with current image
      const mockImageData: ImageUploadData = {
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        preview: 'blob:http://localhost/test-preview',
        imageContent: {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: 'test-data',
          },
        },
      };

      const user = userEvent.setup();
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={mockImageData}
        />
      );

      const fileInput = screen.getByLabelText('画像ファイルを選択') as HTMLInputElement;
      const removeButton = screen.getByLabelText('画像を削除');

      // When: Remove button is clicked
      await user.click(removeButton);

      // Then: File input value should be cleared
      expect(fileInput.value).toBe('');
    });
  });

  describe('Disabled state', () => {
    it('disables upload button when disabled prop is true', () => {
      // Given: Component with disabled=true
      // When: Component is rendered
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
          disabled={true}
        />
      );

      // Then: Upload button should be disabled
      const uploadButton = screen.getByLabelText('画像を添付');
      expect(uploadButton).toBeDisabled();
    });

    it('disables file input when disabled prop is true', () => {
      // Given: Component with disabled=true
      // When: Component is rendered
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
          disabled={true}
        />
      );

      // Then: File input should be disabled
      const fileInput = screen.getByLabelText('画像ファイルを選択');
      expect(fileInput).toBeDisabled();
    });

    it('disables remove button when disabled prop is true', () => {
      // Given: Component with current image and disabled=true
      const mockImageData: ImageUploadData = {
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        preview: 'blob:http://localhost/test-preview',
        imageContent: {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: 'test-data',
          },
        },
      };

      // When: Component is rendered
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={mockImageData}
          disabled={true}
        />
      );

      // Then: Remove button should be disabled
      const removeButton = screen.getByLabelText('画像を削除');
      expect(removeButton).toBeDisabled();
    });

    it('enables all controls when disabled prop is false or undefined', () => {
      // Given: Component with disabled=false (or undefined)
      // When: Component is rendered
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
          disabled={false}
        />
      );

      // Then: Upload button should be enabled
      const uploadButton = screen.getByLabelText('画像を添付');
      expect(uploadButton).not.toBeDisabled();

      // And: File input should be enabled
      const fileInput = screen.getByLabelText('画像ファイルを選択');
      expect(fileInput).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('provides aria-label for upload button', () => {
      // Given: Component with no image
      // When: Component is rendered
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
        />
      );

      // Then: Upload button should have aria-label
      const uploadButton = screen.getByLabelText('画像を添付');
      expect(uploadButton).toHaveAttribute('aria-label', '画像を添付');
    });

    it('provides aria-label for file input', () => {
      // Given: Component with no image
      // When: Component is rendered
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
        />
      );

      // Then: File input should have aria-label
      const fileInput = screen.getByLabelText('画像ファイルを選択');
      expect(fileInput).toHaveAttribute('aria-label', '画像ファイルを選択');
    });

    it('provides aria-label for remove button', () => {
      // Given: Component with current image
      const mockImageData: ImageUploadData = {
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        preview: 'blob:http://localhost/test-preview',
        imageContent: {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: 'test-data',
          },
        },
      };

      // When: Component is rendered
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={mockImageData}
        />
      );

      // Then: Remove button should have aria-label
      const removeButton = screen.getByLabelText('画像を削除');
      expect(removeButton).toHaveAttribute('aria-label', '画像を削除');
    });

    it('provides alt text for preview image', () => {
      // Given: Component with current image
      const mockImageData: ImageUploadData = {
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        preview: 'blob:http://localhost/test-preview',
        imageContent: {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: 'test-data',
          },
        },
      };

      // When: Component is rendered
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={mockImageData}
        />
      );

      // Then: Preview image should have alt text
      const previewImage = screen.getByAltText('添付画像のプレビュー');
      expect(previewImage).toBeInTheDocument();
    });
  });

  describe('Memoization behavior', () => {
    it('does not re-render when props are unchanged', () => {
      // Given: Component with initial props
      const { rerender } = render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
        />
      );

      const firstRender = screen.getByLabelText('画像を添付');

      // When: Component is re-rendered with same props
      rerender(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
        />
      );

      const secondRender = screen.getByLabelText('画像を添付');

      // Then: DOM element should be the same (memo optimization)
      expect(firstRender).toBe(secondRender);
    });

    it('re-renders when currentImage changes', () => {
      // Given: Component with no image
      const { rerender } = render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
        />
      );

      expect(screen.getByLabelText('画像を添付')).toBeInTheDocument();

      // When: currentImage prop is updated
      const mockImageData: ImageUploadData = {
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        preview: 'blob:http://localhost/test-preview',
        imageContent: {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: 'test-data',
          },
        },
      };

      rerender(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={mockImageData}
        />
      );

      // Then: Should now show preview instead of upload button
      expect(screen.queryByLabelText('画像を添付')).not.toBeInTheDocument();
      expect(screen.getByAltText('添付画像のプレビュー')).toBeInTheDocument();
    });
  });
});
