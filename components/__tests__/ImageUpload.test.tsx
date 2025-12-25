import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUpload from '../ImageUpload';
import type { ImageUploadData } from '@/types/chat';
import * as imageUtils from '@/lib/image-utils';

// Mock the image-utils module
jest.mock('@/lib/image-utils');

describe('ImageUpload', () => {
  const mockOnImageSelect = jest.fn();
  const mockConvertFileToImageContent = imageUtils.convertFileToImageContent as jest.MockedFunction<typeof imageUtils.convertFileToImageContent>;
  const mockCreatePreviewURL = imageUtils.createPreviewURL as jest.MockedFunction<typeof imageUtils.createPreviewURL>;

  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトのモック実装
    mockCreatePreviewURL.mockReturnValue('blob:http://localhost/mock-preview');
    mockConvertFileToImageContent.mockResolvedValue({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: 'mock-base64-data',
      },
    });
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

      // When: Upload button is clicked
      await user.click(uploadButton);

      // Then: File input click should be triggered
      await waitFor(() => {
        expect(clickSpy).toHaveBeenCalled();
      });
      clickSpy.mockRestore();
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

      // Then: Image processing functions should be called
      await waitFor(() => {
        expect(mockConvertFileToImageContent).toHaveBeenCalledWith(testFile);
        expect(mockCreatePreviewURL).toHaveBeenCalledWith(testFile);
      }, { timeout: 3000 });

      // And: onImageSelect callback should be called with correct data
      await waitFor(() => {
        expect(mockOnImageSelect).toHaveBeenCalledWith({
          file: testFile,
          preview: 'blob:http://localhost/mock-preview',
          imageContent: {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: 'mock-base64-data',
            },
          },
        });
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
    it('displays error alert when image processing fails with unsupported format', async () => {
      // Given: convertFileToImageContent throws error
      const errorMessage = 'サポートされていないファイル形式です。PNG、JPEG、GIF、WebPのみ対応しています。';
      mockConvertFileToImageContent.mockRejectedValueOnce(new Error(errorMessage));

      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      const user = userEvent.setup();
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
        />
      );

      const fileInput = screen.getByLabelText('画像ファイルを選択') as HTMLInputElement;
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      // When: Invalid file is selected
      await user.upload(fileInput, invalidFile);

      // Then: Error alert should be displayed
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(errorMessage);
      }, { timeout: 3000 });

      // And: onImageSelect should be called with null (resetting state)
      expect(mockOnImageSelect).toHaveBeenCalledWith(null);

      alertSpy.mockRestore();
    });

    it('displays error alert when image processing fails with file size exceeded', async () => {
      // Given: convertFileToImageContent throws error
      const errorMessage = 'ファイルサイズが大きすぎます。最大5MBまでです。';
      mockConvertFileToImageContent.mockRejectedValueOnce(new Error(errorMessage));

      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      const user = userEvent.setup();
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
        />
      );

      const fileInput = screen.getByLabelText('画像ファイルを選択') as HTMLInputElement;
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' });

      // When: Large file is selected
      await user.upload(fileInput, largeFile);

      // Then: Error alert should be displayed
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(errorMessage);
      });

      // And: onImageSelect should be called with null
      expect(mockOnImageSelect).toHaveBeenCalledWith(null);

      alertSpy.mockRestore();
    });

    it('displays generic error message for non-Error exceptions', async () => {
      // Given: convertFileToImageContent throws non-Error object
      mockConvertFileToImageContent.mockRejectedValueOnce('String error');

      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      const user = userEvent.setup();
      render(
        <ImageUpload
          onImageSelect={mockOnImageSelect}
          currentImage={null}
        />
      );

      const fileInput = screen.getByLabelText('画像ファイルを選択') as HTMLInputElement;
      // Use a small file to avoid triggering size validation
      const testFile = new File(['small test content'], 'test.png', { type: 'image/png' });

      // When: File is selected and non-Error is thrown
      await user.upload(fileInput, testFile);

      // Then: Generic error message should be displayed
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('画像の処理に失敗しました。');
      }, { timeout: 3000 });

      alertSpy.mockRestore();
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
