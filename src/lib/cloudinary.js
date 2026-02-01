import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param {string} file - Base64 string or data URL
 * @param {string} folder - Folder path in Cloudinary (e.g., 'customers/id-front')
 * @param {string} publicId - Optional public ID for the image
 * @returns {Promise<Object>} Cloudinary upload result
 */
export async function uploadImage(file, folder, publicId = null) {
  try {
    // Validate base64 string
    if (!file || typeof file !== 'string') {
      throw new Error('Invalid image data provided');
    }

    // Check if it's a valid data URL
    if (!file.startsWith('data:image/')) {
      throw new Error('Invalid image format. Expected data URL.');
    }

    // Extract base64 part and validate
    const base64Match = file.match(/^data:image\/([a-zA-Z]*);base64,(.*)$/);
    if (!base64Match || !base64Match[2]) {
      throw new Error('Invalid base64 image data');
    }

    const base64Data = base64Match[2];
    // Estimate size (base64 is ~33% larger than binary)
    const estimatedSize = (base64Data.length * 3) / 4;
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (estimatedSize > maxSize) {
      throw new Error(`Image size (${(estimatedSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 10MB. Please compress the image.`);
    }

    const uploadOptions = {
      folder: folder,
      resource_type: 'image',
      // Make images private/authenticated
      access_mode: 'authenticated',
      // Add timeout and chunk size for large files
      timeout: 60000, // 60 seconds
      chunk_size: 6000000, // 6MB chunks
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    // Upload base64 string to Cloudinary
    const result = await cloudinary.uploader.upload(file, uploadOptions);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('offset') || error.message.includes('out of range')) {
      throw new Error('Image file is too large or corrupted. Please compress the image or use a smaller file.');
    }
    
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Generate signed URL for private image
 * @param {string} publicId - Public ID of the image
 * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns {string} Signed URL
 */
export function getSignedUrl(publicId, expiresIn = 3600) {
  try {
    return cloudinary.utils.private_download_url(publicId, {
      resource_type: 'image',
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    });
  } catch (error) {
    console.error('Cloudinary signed URL error:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
}

export default cloudinary;

