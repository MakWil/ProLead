const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');

// Configure multer for local file storage (we'll manually upload to S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// S3 configuration - will be initialized when needed
let s3 = null;

// Function to initialize S3 configuration
const initializeS3 = () => {
  if (s3) return s3; // Return existing instance if already initialized
  
  // Configure AWS SDK for Linode Object Storage
  const s3Config = {
    endpoint: process.env.LINODE_ENDPOINT,
    region: process.env.LINODE_REGION || 'us-southeast-1',
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
  };

  // Set AWS credentials explicitly
  AWS.config.update({
    accessKeyId: process.env.LINODE_ACCESS_KEY,
    secretAccessKey: process.env.LINODE_SECRET_KEY
  });

  s3 = new AWS.S3(s3Config);
  
  // Debug: Log credential status (without exposing sensitive data)
  console.log('S3 Configuration Status:');
  console.log('- LINODE_ACCESS_KEY:', process.env.LINODE_ACCESS_KEY ? '✅ Set' : '❌ Missing');
  console.log('- LINODE_SECRET_KEY:', process.env.LINODE_SECRET_KEY ? '✅ Set' : '❌ Missing');
  console.log('- LINODE_ENDPOINT:', process.env.LINODE_ENDPOINT ? '✅ Set' : '❌ Missing');
  console.log('- LINODE_BUCKET_NAME:', process.env.LINODE_BUCKET_NAME ? '✅ Set' : '❌ Missing');
  console.log('- LINODE_REGION:', process.env.LINODE_REGION ? '✅ Set' : '❌ Missing');
  
  // Check if required environment variables are set
  if (!process.env.LINODE_ACCESS_KEY || !process.env.LINODE_SECRET_KEY || !process.env.LINODE_ENDPOINT || !process.env.LINODE_BUCKET_NAME) {
    console.error('Missing required S3 environment variables. Please check your .env file.');
    console.error('Required: LINODE_ACCESS_KEY, LINODE_SECRET_KEY, LINODE_ENDPOINT, LINODE_BUCKET_NAME');
  }
  
  return s3;
};

// Function to get S3 instance (initializes if needed)
const getS3 = () => {
  if (!s3) {
    return initializeS3();
  }
  return s3;
};

// Function to upload file to S3
const uploadFileToS3 = async (file, userId) => {
  try {
    const fileExtension = path.extname(file.originalname);
    const fileName = `profile-pictures/${userId}-${Date.now()}${fileExtension}`;
    
    const params = {
      Bucket: process.env.LINODE_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    const result = await getS3().upload(params).promise();
    return result.Location; // Return the full S3 URL directly
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
};

// Function to delete file from S3
const deleteFile = async (key) => {
  try {
    const params = {
      Bucket: process.env.LINODE_BUCKET_NAME,
      Key: key
    };
    await getS3().deleteObject(params).promise();
    console.log('File deleted successfully from S3:', key);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};

// Function to extract key from S3 URL
const extractKeyFromUrl = (url) => {
  if (!url) return null;
  
  try {
    // Check if it's a full URL or just a path
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Extract key from Linode S3 URL
      // URL format: https://bucket-name.id-cgk-1.linodeobjects.com/key
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const endpoint = process.env.LINODE_ENDPOINT || 'https://id-cgk-1.linodeobjects.com';
      const endpointHostname = new URL(endpoint).hostname;
      
      if (hostname.includes(endpointHostname)) {
        // Remove bucket name from hostname if present
        const key = urlObj.pathname.substring(1); // Remove leading slash
        return key;
      }
    } else {
      // It's a relative path, just remove leading slash
      return url.startsWith('/') ? url.substring(1) : url;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    return null;
  }
};

// Function to get signed URL for private files (if needed)
const getSignedUrl = async (key, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: process.env.LINODE_BUCKET_NAME,
      Key: key,
      Expires: expiresIn
    };
    
    const url = await getS3().getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
};

// Test S3 connection
const testS3Connection = async () => {
  try {
    console.log('Testing S3 connection...');
    
    // Check credentials first
    if (!process.env.LINODE_ACCESS_KEY || !process.env.LINODE_SECRET_KEY || !process.env.LINODE_ENDPOINT || !process.env.LINODE_BUCKET_NAME) {
      throw new Error('Missing required S3 environment variables');
    }

    const s3Instance = getS3();
    
    // Test by listing buckets
    const buckets = await s3Instance.listBuckets().promise();
    console.log('✅ S3 connection successful!');
    console.log('Available buckets:', buckets.Buckets.map(b => b.Name));
    
    // Test specific bucket access
    const bucketName = process.env.LINODE_BUCKET_NAME;
    try {
      await s3Instance.headBucket({ Bucket: bucketName }).promise();
      console.log(`✅ Bucket '${bucketName}' is accessible`);
    } catch (bucketError) {
      console.warn(`⚠️  Bucket '${bucketName}' may not exist or is not accessible:`, bucketError.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ S3 connection test failed:', error.message);
    return false;
  }
};

module.exports = {
  upload,
  uploadFileToS3,
  deleteFile,
  extractKeyFromUrl,
  getSignedUrl,
  getS3,
  testS3Connection
};
