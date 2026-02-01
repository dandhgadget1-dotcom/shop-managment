import { NextResponse } from 'next/server';
import { uploadImage, deleteImage } from '@/lib/cloudinary';

/**
 * POST /api/upload - Upload image to Cloudinary
 * Body: { image: base64 string, folder: string, publicId?: string }
 */
export async function POST(request) {
  try {
    const { image, folder, publicId } = await request.json();

    if (!image) {
      return NextResponse.json(
        { message: 'Image is required' },
        { status: 400 }
      );
    }

    if (!folder) {
      return NextResponse.json(
        { message: 'Folder is required' },
        { status: 400 }
      );
    }

    // Upload image to Cloudinary
    const result = await uploadImage(image, folder, publicId);

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload - Delete image from Cloudinary
 * Body: { publicId: string }
 */
export async function DELETE(request) {
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { message: 'Public ID is required' },
        { status: 400 }
      );
    }

    // Delete image from Cloudinary
    const result = await deleteImage(publicId);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
}

