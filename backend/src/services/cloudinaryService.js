const cloudinary = require('cloudinary').v2;

const IMAGE_TYPES = {
  film: {
    account: 'films',
    folder: 'afroflix-tv/films',
  },
  actor: {
    account: 'media',
    folder: 'afroflix/actors',
  },
  article: {
    account: 'media',
    folder: 'afroflix/articles',
  },
  misc: {
    account: 'media',
    folder: 'afroflix/misc',
  },
};

const getConfig = (account) => {
  const prefix = account === 'films' ? 'CLOUDINARY_FILMS' : 'CLOUDINARY_MEDIA';
  const cloudName = process.env[`${prefix}_CLOUD_NAME`];
  const apiKey = process.env[`${prefix}_API_KEY`];
  const apiSecret = process.env[`${prefix}_API_SECRET`];

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(`Configuration Cloudinary manquante pour ${account}.`);
  }

  return {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  };
};

const uploadImageBuffer = ({ buffer, originalname, type = 'misc' }) => {
  const imageType = IMAGE_TYPES[type] || IMAGE_TYPES.misc;
  const config = getConfig(imageType.account);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        ...config,
        folder: imageType.folder,
        overwrite: false,
        resource_type: 'image',
        use_filename: Boolean(originalname),
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve({
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    stream.end(buffer);
  });
};

const getManagedPublicIdFromUrl = (url) => {
  if (!url) return null;

  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    return null;
  }

  const cloudNames = [
    process.env.CLOUDINARY_FILMS_CLOUD_NAME,
    process.env.CLOUDINARY_MEDIA_CLOUD_NAME,
  ].filter(Boolean);

  const matchedCloudName = cloudNames.find((cloudName) => (
    parsed.hostname === 'res.cloudinary.com' && parsed.pathname.startsWith(`/${cloudName}/image/upload/`)
  ));

  if (!matchedCloudName) return null;

  const afterUpload = parsed.pathname.replace(`/${matchedCloudName}/image/upload/`, '');
  const withoutVersion = afterUpload.replace(/^v\d+\//, '');
  const publicId = withoutVersion.replace(/\.[a-z0-9]+$/i, '');

  if (!publicId || !Object.values(IMAGE_TYPES).some(({ folder }) => publicId.startsWith(`${folder}/`))) {
    return null;
  }

  return {
    publicId,
    account: matchedCloudName === process.env.CLOUDINARY_FILMS_CLOUD_NAME ? 'films' : 'media',
  };
};

const deleteManagedImage = async (url) => {
  const image = getManagedPublicIdFromUrl(url);
  if (!image) return;

  try {
    await cloudinary.uploader.destroy(image.publicId, {
      ...getConfig(image.account),
      resource_type: 'image',
    });
  } catch (err) {
    console.warn('Cloudinary image deletion failed:', err.message);
  }
};

const deleteReplacedManagedImage = async (previousUrl, nextUrl) => {
  if (!previousUrl || !nextUrl || previousUrl === nextUrl) return;
  await deleteManagedImage(previousUrl);
};

module.exports = {
  deleteManagedImage,
  deleteReplacedManagedImage,
  uploadImageBuffer,
};
