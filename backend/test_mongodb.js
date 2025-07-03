const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
require('dotenv').config();
const app = express();
const port = 4000;
const cors = require('cors');
app.use(cors({
  origin: '*', // Allow all origins for testing purposes
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files (test_api.html)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files statically

const uri = "mongodb+srv://test-user-123:CXi6XO1ezt5kWNoT@cluster0.tdegjwx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let users;
let authTokens;
let predictions;
let images;
let systemLogs;
let llmSummaries;
let feedback;

async function connectDB() {
  await client.connect();
  const database = client.db('idp-sd');
  users = database.collection('users');
  authTokens = database.collection('auth_tokens');
  predictions = database.collection('predictions');
  images = database.collection('images');
  systemLogs = database.collection('system_logs');
  llmSummaries = database.collection('llm_summaries');
  feedback = database.collection('feedback');
  
  // Create admin user if it doesn't exist
  // await createAdminUser();
}

const upload = multer({ dest: '/tmp/' }); // Use temp dir for uploads

// Configure AWS S3 (DigitalOcean Spaces)
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET
});
const DO_SPACES_BUCKET = process.env.DO_SPACES_BUCKET;

// Endpoint to upload original image
app.post('/upload-image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileContent = fs.readFileSync(req.file.path);
    const s3Key = `uploads/${Date.now()}_${req.file.originalname}`;
    const params = {
      Bucket: DO_SPACES_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ACL: 'public-read',
      ContentType: req.file.mimetype
    };
    const s3Result = await s3.upload(params).promise();
    fs.unlinkSync(req.file.path); // Remove temp file
    // Log image upload
    const { ipAddress, userAgent } = getClientInfo(req);
    const userId = req.body.user_id || req.headers['x-user-id'] || 'anonymous';
    await logAuditEvent('IMAGE_UPLOAD', userId, {
      filename: req.file.originalname,
      filesize: req.file.size,
      mimetype: req.file.mimetype,
      uploaded_path: s3Result.Location
    }, ipAddress, userAgent);
    res.json({ url: s3Result.Location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to upload gradcam image
app.post('/upload-gradcam', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileContent = fs.readFileSync(req.file.path);
    const s3Key = `gradcam/${Date.now()}_${req.file.originalname}`;
    const params = {
      Bucket: DO_SPACES_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ACL: 'public-read',
      ContentType: req.file.mimetype
    };
    const s3Result = await s3.upload(params).promise();
    fs.unlinkSync(req.file.path); // Remove temp file
    // Log gradcam upload
    const { ipAddress, userAgent } = getClientInfo(req);
    const userId = req.body.user_id || req.headers['x-user-id'] || 'anonymous';
    const predictionId = req.body.prediction_id || null;
    await logAuditEvent('GRADCAM_UPLOAD', userId, {
      filename: req.file.originalname,
      filesize: req.file.size,
      mimetype: req.file.mimetype,
      uploaded_path: s3Result.Location,
      prediction_id: predictionId
    }, ipAddress, userAgent);

    // If prediction_id is provided, update the prediction's gradcam_uri
    let predictionUpdate = null;
    if (predictionId) {
      try {
        const { ObjectId } = require('mongodb');
        predictionUpdate = await predictions.updateOne(
          { _id: new ObjectId(predictionId) },
          { $set: { gradcam_uri: s3Result.Location } }
        );
      } catch (updateErr) {
        // Log but don't fail the upload if update fails
        console.error('Failed to update gradcam_uri:', updateErr);
      }
    }

    res.json({ url: s3Result.Location, gradcam_uri_updated: !!(predictionUpdate && predictionUpdate.modifiedCount === 1) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Username, email, and password required' });
    
    // Validate username format (alphanumeric, underscore, hyphen, 3-20 characters)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) return res.status(400).json({ error: 'Username must be 3-20 characters long and contain only letters, numbers, underscores, or hyphens' });
    
    // Check if username already exists
    const existingUsername = await users.findOne({ username: username.toLowerCase().trim() });
    if (existingUsername) return res.status(400).json({ error: 'Username already taken' });
    
    // Check if email already exists
    const existingEmail = await users.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) return res.status(400).json({ error: 'Email already registered' });
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
    
    // Validate password strength
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    
    const salt = crypto.randomBytes(16).toString('hex');
    const hashBuffer = crypto.scryptSync(password, salt, 64);
    const hash = hashBuffer.toString('hex');
    const newUser = {
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password_hash: hash,
      salt,
      firstName: firstName?.trim() || '',
      lastName: lastName?.trim() || '',
      role: 'user', // Default role for new users
      created_at: new Date(),
      last_login: null,
      profile_completed: !!(firstName && lastName)
    };
    const result = await users.insertOne(newUser);
    
    // Log successful registration
    const { ipAddress, userAgent } = getClientInfo(req);
    await logAuditEvent('USER_REGISTRATION', result.insertedId.toString(), {
      username: newUser.username,
      email: newUser.email,
      profile_completed: newUser.profile_completed
    }, ipAddress, userAgent);
    
    res.json({ 
      message: 'Registration successful', 
      userId: result.insertedId.toString(),
      username: newUser.username,
      email: newUser.email 
    });
  } catch (err) {
    // Log failed registration attempt
    const { ipAddress, userAgent } = getClientInfo(req);
    await logAuditEvent('USER_REGISTRATION_FAILED', null, {
      error_message: err.message,
      attempted_username: req.body.username,
      attempted_email: req.body.email,
      success: false
    }, ipAddress, userAgent);
    
    res.status(500).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) return res.status(400).json({ error: 'Username/email and password required' });
    
    let user;
    
    // Try to find by username first, then by email
    user = await users.findOne({ username: usernameOrEmail.toLowerCase().trim() });
    if (!user) {
      user = await users.findOne({ email: usernameOrEmail.toLowerCase().trim() });
    }
    
    if (!user) return res.status(401).json({ error: 'Login failed: user not found' });
    
    const loginHash = crypto.scryptSync(password, user.salt, 64).toString('hex');
    if (loginHash === user.password_hash) {
      // Generate a random token
      const token = crypto.randomBytes(32).toString('hex');
      const token_hash = crypto.createHash('sha256').update(token).digest('hex');
      const expiry = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours from now
      const permissions = ['user'];
      const issued_at = new Date();
      
      // Update last login
      await users.updateOne(
        { _id: user._id },
        { $set: { last_login: new Date() } }
      );
      
      await authTokens.insertOne({
        user_id: user._id,
        token_hash,
        expiry,
        permissions,
        issued_at
      });
      
      // Log successful login
      const { ipAddress, userAgent } = getClientInfo(req);
      await logAuditEvent('USER_LOGIN_SUCCESS', user._id.toString(), {
        username: user.username,
        email: user.email,
        session_id: token_hash
      }, ipAddress, userAgent);
      
      res.json({ 
        message: 'Login successful', 
        user_id: user._id.toString(),
        username: user.username,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || 'user',
        token, 
        expiry 
      });
    } else {
      // Log failed login attempt
      const { ipAddress, userAgent } = getClientInfo(req);
      await logAuditEvent('USER_LOGIN_FAILED', user ? user._id.toString() : null, {
        attempted_login: usernameOrEmail,
        error_message: 'Invalid password',
        success: false
      }, ipAddress, userAgent);
      
      res.status(401).json({ error: 'Login failed: password mismatch' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/check-session', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    const token_hash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenDoc = await authTokens.findOne({ token_hash });
    if (!tokenDoc) return res.status(401).json({ error: 'Invalid token' });
    if (tokenDoc.expiry < new Date()) return res.status(401).json({ error: 'Token expired' });
    
    // Get user details
    const user = await users.findOne({ _id: tokenDoc.user_id });
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    res.json({ 
      message: 'Session valid', 
      user_id: tokenDoc.user_id.toString(),
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'user',
      permissions: tokenDoc.permissions 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user profile by user ID
app.post('/get-user-profile', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'User ID required' });
    
    const { ObjectId } = require('mongodb');
    const user = await users.findOne({ _id: new ObjectId(user_id) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Return user data without sensitive information
    res.json({
      user_id: user._id.toString(),
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      created_at: user.created_at,
      profile_completed: user.profile_completed || false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add an endpoint to store prediction and image info
app.post('/store-prediction', async (req, res) => {
  try {
    const {
      user_id,
      image_uri,
      filename,
      predicted_class,
      confidence_scores,
      confidence_score, // new: numeric confidence score
      model_version,
      gradcam_uri,
      notes // new: user notes
    } = req.body;
    // Allow gradcam_uri to be empty string for initial store
    if (!user_id || !image_uri || !filename || !predicted_class || confidence_scores === undefined || !model_version || gradcam_uri === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Store image document
    const imageDoc = {
      user_id,
      image_uri,
      upload_timestamp: new Date(),
      filename
    };
    const imageResult = await images.insertOne(imageDoc);
    const image_id = imageResult.insertedId;
    // Store prediction document
    const predictionDoc = {
      image_id,
      predicted_class,
      confidence_scores,
      confidence_score: typeof confidence_score === 'number' ? confidence_score : undefined,
      model_version,
      inference_timestamp: new Date(),
      gradcam_uri
    };
    // Only add notes if provided (non-empty string)
    if (typeof notes === 'string' && notes.trim().length > 0) {
      predictionDoc.notes = notes.trim();
    }
    const predictionResult = await predictions.insertOne(predictionDoc);
    
    // Log the prediction event
    const { ipAddress, userAgent } = getClientInfo(req);
    await logAuditEvent('PREDICTION_MADE', user_id, {
      image_id: image_id.toString(),
      prediction_id: predictionResult.insertedId.toString(),
      filename: filename,
      predicted_class: predicted_class,
      confidence_scores: confidence_scores,
      model_version: model_version,
      has_gradcam: !!gradcam_uri
    }, ipAddress, userAgent);
    
    res.json({ message: 'Stored prediction and image', image_id, prediction_id: predictionResult.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's prediction history
app.post('/get-user-predictions', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'User ID required' });
    
    // Get all images for this user
    const userImages = await images.find({ user_id }).sort({ upload_timestamp: -1 }).toArray();
    
    // Get predictions for each image
    const predictionsWithImages = [];
    for (const image of userImages) {
      const prediction = await predictions.findOne({ image_id: image._id });
      if (prediction) {
        predictionsWithImages.push({
          image_id: image._id.toString(),
          prediction_id: prediction._id.toString(),
          filename: image.filename,
          image_uri: image.image_uri,
          upload_timestamp: image.upload_timestamp,
          predicted_class: prediction.predicted_class,
          confidence_scores: prediction.confidence_scores,
          model_version: prediction.model_version,
          inference_timestamp: prediction.inference_timestamp,
          gradcam_uri: prediction.gradcam_uri
        });
      }
    }
    
    // Log access to prediction history
    const { ipAddress, userAgent } = getClientInfo(req);
    await logAuditEvent('PREDICTION_HISTORY_ACCESSED', user_id, {
      predictions_count: predictionsWithImages.length
    }, ipAddress, userAgent);
    
    res.json({ predictions: predictionsWithImages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add endpoint to update gradcam_uri in prediction document
app.post('/update-gradcam-uri', async (req, res) => {
  try {
    const { prediction_id, gradcam_uri } = req.body;
    if (!prediction_id || !gradcam_uri) {
      return res.status(400).json({ error: 'Missing prediction_id or gradcam_uri' });
    }
    const { ObjectId } = require('mongodb');
    const result = await predictions.updateOne(
      { _id: new ObjectId(prediction_id) },
      { $set: { gradcam_uri } }
    );
    if (result.modifiedCount === 1) {
      res.json({ message: 'gradcam_uri updated' });
    } else {
      res.status(404).json({ error: 'Prediction not found or not updated' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recent predictions for a user (RESTful GET endpoint)
app.get('/api/predictions/recent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID required' 
      });
    }
    
    console.log(`Fetching recent predictions for user: ${userId}, limit: ${limit}`);
    
    // Get recent images for this user with limit
    const userImages = await images.find({ user_id: userId })
      .sort({ upload_timestamp: -1 })
      .limit(limit)
      .toArray();
    
    console.log(`Found ${userImages.length} recent images for user ${userId}`);
    
    // Get predictions for each image
    const predictionsWithImages = [];
    for (const image of userImages) {
      const prediction = await predictions.findOne({ image_id: image._id });
      if (prediction) {
        predictionsWithImages.push({
          image_id: image._id.toString(),
          prediction_id: prediction._id.toString(),
          filename: image.filename,
          file_path: image.image_uri.replace('http://localhost:4000', ''), // Convert full URL to relative path
          upload_timestamp: image.upload_timestamp,
          predicted_class: prediction.predicted_class,
          confidence_scores: prediction.confidence_scores,
          model_version: prediction.model_version,
          inference_timestamp: prediction.inference_timestamp,
          gradcam_uri: prediction.gradcam_uri
        });
      }
    }
    
    console.log(`Returning ${predictionsWithImages.length} predictions with images`);
    
    res.json({ 
      success: true, 
      predictions: predictionsWithImages,
      total: predictionsWithImages.length 
    });
  } catch (err) {
    console.error('Error fetching recent predictions:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Helper functions for LLM summaries
function calculateRiskLevel(predictedClass, confidenceScores) {
  try {
    // Get the highest confidence score
    const maxConfidence = Object.values(confidenceScores || {}).reduce((max, score) => Math.max(max, score), 0);
    
    // Risk assessment based on prediction type and confidence
    const isHighRiskCondition = predictedClass && (
      predictedClass.toLowerCase().includes('mel') || // melanoma
      predictedClass.toLowerCase().includes('malignant') ||
      predictedClass.toLowerCase().includes('bcc') || // basal cell carcinoma
      predictedClass.toLowerCase().includes('akiec') // actinic keratoses
    );
    
    if (isHighRiskCondition) {
      if (maxConfidence > 80) return 'High';
      if (maxConfidence > 60) return 'Medium-High';
      return 'Medium';
    } else {
      if (maxConfidence > 90) return 'Low';
      if (maxConfidence > 70) return 'Low-Medium';
      return 'Medium';
    }
  } catch (error) {
    console.error('Error calculating risk level:', error);
    return 'Unknown';
  }
}

function extractMedicalTerms(predictedClass) {
  try {
    if (!predictedClass) return [];
    
    const medicalTermsMap = {
      'mel': ['Melanoma', 'Malignant melanoma', 'Skin cancer'],
      'nv': ['Melanocytic nevi', 'Mole', 'Nevus', 'Benign lesion'],
      'bcc': ['Basal cell carcinoma', 'BCC', 'Skin cancer'],
      'akiec': ['Actinic keratoses', 'Solar keratosis', 'Pre-cancerous lesion'],
      'bkl': ['Benign keratosis', 'Seborrheic keratosis', 'Benign lesion'],
      'df': ['Dermatofibroma', 'Fibrous histiocytoma', 'Benign tumor'],
      'vasc': ['Vascular lesion', 'Hemangioma', 'Blood vessel lesion']
    };
    
    const lowerClass = predictedClass.toLowerCase();
    for (const [key, terms] of Object.entries(medicalTermsMap)) {
      if (lowerClass.includes(key)) {
        return terms;
      }
    }
    
    return [predictedClass]; // fallback to original class name
  } catch (error) {
    console.error('Error extracting medical terms:', error);
    return [];
  }
}

// Get LLM summaries for a user (RESTful GET endpoint)
app.get('/api/llm-summaries', async (req, res) => {
  try {
    const { userId, limit = 10, fromDate } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID required' 
      });
    }
    
    console.log(`Fetching LLM summaries for user: ${userId}, limit: ${limit}, fromDate: ${fromDate}`);
    
    // Build query for time range
    let timeQuery = { user_id: userId };
    if (fromDate) {
      timeQuery.upload_timestamp = { $gte: new Date(fromDate) };
    }
    
    // Get recent images and predictions for this user with time filter
    const userImages = await images.find(timeQuery)
      .sort({ upload_timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();
    
    console.log(`Found ${userImages.length} images for user ${userId} in specified time range`);
    
    // Get predictions for each image and build summary data
    const summaries = [];
    for (const image of userImages) {
      const prediction = await predictions.findOne({ image_id: image._id });
      if (prediction) {
        // Create a summary document compatible with the frontend expectations
        const summary = {
          _id: prediction._id.toString(),
          user_id: userId,
          image_id: image._id.toString(),
          filename: image.filename,
          upload_timestamp: image.upload_timestamp,
          predicted_class: prediction.predicted_class,
          confidence_scores: prediction.confidence_scores,
          model_version: prediction.model_version,
          inference_timestamp: prediction.inference_timestamp,
          image_uri: image.image_uri,
          gradcam_uri: prediction.gradcam_uri,
          // Additional fields for LLM context
          analysis_type: 'skin_lesion_classification',
          risk_level: calculateRiskLevel(prediction.predicted_class, prediction.confidence_scores),
          medical_terminology: extractMedicalTerms(prediction.predicted_class)
        };
        summaries.push(summary);
      }
    }
    
    console.log(`Returning ${summaries.length} LLM summaries for user ${userId}`);
    
    res.json({ 
      success: true, 
      summaries: summaries,
      totalCount: summaries.length,
      timeRange: fromDate ? `since ${fromDate}` : 'all time',
      userId: userId
    });
  } catch (err) {
    console.error('Error fetching LLM summaries:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// POST endpoint to store LLM-generated summaries
app.post('/api/llm-summaries', async (req, res) => {
  try {
    const { userId, uploadId, originalResults, llmSummary, generatedAt, modelUsed, version } = req.body;
    
    if (!userId || !originalResults || !llmSummary) {
      return res.status(400).json({ 
        success: false, 
        error: 'Required fields missing: userId, originalResults, llmSummary' 
      });
    }
    
    console.log(`Storing LLM summary for user: ${userId}, uploadId: ${uploadId}`);
    
    // Create the summary document
    const summaryDocument = {
      user_id: userId,
      upload_id: uploadId || null,
      original_ml_results: originalResults,
      llm_summary: llmSummary,
      generated_at: generatedAt || new Date().toISOString(),
      model_used: modelUsed || 'qwen-turbo',
      version: version || '1.0',
      created_timestamp: new Date(),
      // Additional metadata for querying
      predicted_class: originalResults.predicted_class,
      confidence_score: originalResults.confidence_scores,
      risk_level: llmSummary.interpretation?.risk_level || 'unknown'
    };
    
    // Store in MongoDB
    const result = await llmSummaries.insertOne(summaryDocument);
    
    if (result.insertedId) {
      console.log(`✅ LLM summary stored with ID: ${result.insertedId}`);
      
      res.json({ 
        success: true,
        summaryId: result.insertedId.toString(),
        message: 'LLM summary stored successfully'
      });
    } else {
      throw new Error('Failed to insert summary document');
    }
    
  } catch (err) {
    console.error('Error storing LLM summary:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// GET endpoint to retrieve a specific LLM summary
app.get('/api/llm-summaries/:summaryId', async (req, res) => {
  try {
    const { summaryId } = req.params;
    
    if (!summaryId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Summary ID required' 
      });
    }
    
    console.log(`Fetching LLM summary: ${summaryId}`);
    
    const { ObjectId } = require('mongodb');
    const summary = await llmSummaries.findOne({ _id: new ObjectId(summaryId) });
    
    if (!summary) {
      return res.status(404).json({ 
        success: false, 
        error: 'Summary not found' 
      });
    }
    
    res.json({ 
      success: true, 
      summary: summary
    });
    
  } catch (err) {
    console.error('Error fetching LLM summary:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// GET endpoint to retrieve LLM summaries for a specific user
app.get('/api/llm-summaries/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, sortBy = 'created_timestamp' } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID required' 
      });
    }
    
    console.log(`Fetching LLM summaries for user: ${userId}, limit: ${limit}`);
    
    // Get LLM summaries from the llm_summaries collection
    const summaries = await llmSummaries.find({ user_id: userId })
      .sort({ [sortBy]: -1 }) // Most recent first
      .limit(parseInt(limit))
      .toArray();
    
    console.log(`Found ${summaries.length} LLM summaries for user ${userId}`);
    
    // Format summaries for frontend consumption
    const formattedSummaries = summaries.map(summary => ({
      _id: summary._id.toString(),
      userId: summary.user_id,
      uploadId: summary.upload_id,
      originalResults: summary.original_ml_results,
      llmSummary: summary.llm_summary,
      generatedAt: summary.generated_at,
      modelUsed: summary.model_used,
      version: summary.version,
      createdTimestamp: summary.created_timestamp,
      predictedClass: summary.predicted_class,
      confidenceScore: summary.confidence_score,
      riskLevel: summary.risk_level
    }));
    
    res.json({ 
      success: true, 
      summaries: formattedSummaries,
      totalCount: formattedSummaries.length,
      userId: userId
    });
    
  } catch (err) {
    console.error('Error fetching user LLM summaries:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Admin endpoint to view audit logs
app.post('/admin/audit-logs', requireAdminAuth, async (req, res) => {
  try {
    const { user_id, limit = 100, action_filter, start_date, end_date } = req.body;
    
    // Admin authentication is now handled by middleware
    
    let query = {};
    
    // Filter by user_id if provided
    if (user_id) {
      query.user_id = user_id;
    }
    
    // Filter by action type if provided
    if (action_filter) {
      query.action = action_filter;
    }
    
    // Filter by date range if provided
    if (start_date || end_date) {
      query.timestamp = {};
      if (start_date) query.timestamp.$gte = new Date(start_date);
      if (end_date) query.timestamp.$lte = new Date(end_date);
    }
    
    const auditLogs = await systemLogs
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();
    
    // Log the audit log access (user info available from middleware)
    const { ipAddress, userAgent } = getClientInfo(req);
    await logAuditEvent('AUDIT_LOGS_ACCESSED', req.user._id.toString(), {
      query_filters: query,
      results_count: auditLogs.length,
      accessed_by: req.user.username
    }, ipAddress, userAgent);
    
    res.json({ 
      logs: auditLogs,
      total_count: auditLogs.length,
      query_filters: query,
      accessed_by: req.user.username
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get audit log statistics
app.get('/admin/audit-stats', requireAdminAuth, async (req, res) => {
  try {
    // Admin authentication is now handled by middleware
    
    const stats = await systemLogs.aggregate([
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
          last_occurrence: { $max: "$timestamp" }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();
    
    const totalLogs = await systemLogs.countDocuments();
    const last24Hours = await systemLogs.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    // Log admin stats access
    const { ipAddress, userAgent } = getClientInfo(req);
    await logAuditEvent('AUDIT_STATS_ACCESSED', req.user._id.toString(), {
      accessed_by: req.user.username,
      total_logs: totalLogs,
      stats_count: stats.length
    }, ipAddress, userAgent);
    
    res.json({
      total_logs: totalLogs,
      logs_last_24h: last24Hours,
      action_breakdown: stats,
      accessed_by: req.user.username
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to log user logout
app.post('/log-logout', async (req, res) => {
  try {
    const { user_id, username } = req.body;
    if (!user_id) return res.status(400).json({ error: 'User ID required' });
    
    // Log logout event
    const { ipAddress, userAgent } = getClientInfo(req);
    await logAuditEvent('USER_LOGOUT', user_id, {
      username: username || 'unknown'
    }, ipAddress, userAgent);
    
    res.json({ message: 'Logout logged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin authentication middleware
async function requireAdminAuth(req, res, next) {
  try {
    let authToken;
    
    // Get token from different sources
    if (req.body && (req.body.admin_token || req.body.token)) {
      authToken = req.body.admin_token || req.body.token;
    } else if (req.headers.authorization) {
      authToken = req.headers.authorization.replace('Bearer ', '');
    }
    
    if (!authToken) {
      return res.status(401).json({ error: 'Authentication token required' });
    }
    
    const token_hash = crypto.createHash('sha256').update(authToken).digest('hex');
    const tokenDoc = await authTokens.findOne({ token_hash });
    
    if (!tokenDoc) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    
    if (tokenDoc.expiry < new Date()) {
      return res.status(401).json({ error: 'Authentication token expired' });
    }
    
    // Get user details
    const user = await users.findOne({ _id: tokenDoc.user_id });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Check if user has admin role
    if (user.role !== 'admin') {
      // Log unauthorized admin access attempt
      const { ipAddress, userAgent } = getClientInfo(req);
      await logAuditEvent('ADMIN_ACCESS_DENIED', user._id.toString(), {
        attempted_endpoint: req.path,
        user_role: user.role || 'user',
        reason: 'Insufficient privileges'
      }, ipAddress, userAgent);
      
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    
    // Log successful admin access
    const { ipAddress, userAgent } = getClientInfo(req);
    await logAuditEvent('ADMIN_ACCESS_GRANTED', user._id.toString(), {
      endpoint: req.path,
      user_role: user.role
    }, ipAddress, userAgent);
    
    // Add user info to request for use in endpoint
    req.user = user;
    req.tokenDoc = tokenDoc;
    next();
    
  } catch (err) {
    console.error('Admin auth error:', err);
    res.status(500).json({ error: 'Authentication error' });
  }
}

// Function to create admin user (run once during setup)
async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await users.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username);
      return;
    }
    
    // Create default admin user
    const adminPassword = 'Admin123!'; // Change this in production!
    const salt = crypto.randomBytes(16).toString('hex');
    const hashBuffer = crypto.scryptSync(adminPassword, salt, 64);
    const hash = hashBuffer.toString('hex');
    
    const adminUser = {
      username: 'admin',
      email: 'admin@example.com',
      password_hash: hash,
      salt,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      created_at: new Date(),
      last_login: null,
      profile_completed: true
    };
    
    const result = await users.insertOne(adminUser);
    console.log('Admin user created successfully:', result.insertedId.toString());
    console.log('Default admin credentials - Username: admin, Password:', adminPassword);
    console.log('IMPORTANT: Change the admin password immediately after first login!');
    
    // Log admin user creation
    await logAuditEvent('ADMIN_USER_CREATED', result.insertedId.toString(), {
      username: adminUser.username,
      email: adminUser.email
    }, 'system', 'system');
    
  } catch (err) {
    console.error('Error creating admin user:', err);
  }
}

// Audit logging utility function
async function logAuditEvent(action, userId, details = {}, ipAddress = null, userAgent = null) {
  try {
    // Parse user agent for browser info
    let browserInfo = 'Unknown';
    if (userAgent) {
      if (userAgent.includes('Chrome')) browserInfo = 'Chrome';
      else if (userAgent.includes('Firefox')) browserInfo = 'Firefox';
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browserInfo = 'Safari';
      else if (userAgent.includes('Edge')) browserInfo = 'Edge';
      else if (userAgent.includes('Opera')) browserInfo = 'Opera';
    }
    
    const logEntry = {
      timestamp: new Date(),
      action: action, // e.g., 'USER_LOGIN', 'IMAGE_UPLOAD', 'PREDICTION_MADE', etc.
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      browser: browserInfo,
      details: details, // Additional context-specific data
      session_id: details.session_id || null,
      success: details.success !== undefined ? details.success : true,
      error_message: details.error_message || null,
      server_timestamp: new Date().toISOString(),
      environment: 'development' // You can change this for production
    };
    
    await systemLogs.insertOne(logEntry);
    console.log(`Audit log created: ${action} for user ${userId || 'anonymous'} from ${ipAddress}`);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to prevent breaking the main operation
  }
}

// System action logging utility function (wrapper around logAuditEvent)
async function logSystemAction(userId, action, details = {}) {
  try {
    // Convert snake_case to uppercase for consistency with audit events
    const auditAction = action.toUpperCase();
    await logAuditEvent(auditAction, userId, details);
  } catch (error) {
    console.error('Failed to log system action:', error);
    // Don't throw error to prevent breaking the main operation
  }
}

// Helper function to get client IP and User-Agent from request
function getClientInfo(req) {
  // Try multiple methods to get the real IP address
  let ipAddress = req.headers['x-forwarded-for'] || 
                  req.headers['x-real-ip'] ||
                  req.connection.remoteAddress || 
                  req.socket.remoteAddress ||
                  (req.connection.socket ? req.connection.socket.remoteAddress : null);
                  
  // Handle comma-separated IPs from proxies (take the first one)
  if (ipAddress && ipAddress.includes(',')) {
    ipAddress = ipAddress.split(',')[0].trim();
  }
  
  // Convert IPv6 localhost to IPv4 for readability
  if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
    ipAddress = '127.0.0.1 (localhost)';
  }
  
  // Add context for common addresses
  if (ipAddress && ipAddress.startsWith('127.')) {
    ipAddress = `${ipAddress} (localhost)`;
  } else if (ipAddress && ipAddress.startsWith('192.168.')) {
    ipAddress = `${ipAddress} (local network)`;
  } else if (ipAddress && ipAddress.startsWith('10.')) {
    ipAddress = `${ipAddress} (private network)`;
  }
  
  const userAgent = req.headers['user-agent'] || null;
  return { ipAddress, userAgent };
}

// Endpoint to generate Grad-CAM on demand for a prediction
app.post('/generate-gradcam', async (req, res) => {
  try {
    const { prediction_id } = req.body;
    if (!prediction_id) {
      return res.status(400).json({ error: 'Missing prediction_id' });
    }
    // Find prediction and image
    const { ObjectId } = require('mongodb');
    const prediction = await predictions.findOne({ _id: new ObjectId(prediction_id) });
    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }
    const image = await images.findOne({ _id: prediction.image_id });
    if (!image || !image.image_uri) {
      return res.status(404).json({ error: 'Original image not found' });
    }
    // Download the image from Spaces
    const axios = require('axios');
    const response = await axios.get(image.image_uri, { responseType: 'arraybuffer' });
    const tempPath = path.join(__dirname, 'tmp_gradcam.jpg');
    fs.writeFileSync(tempPath, response.data);
    // Call FastAPI to generate Grad-CAM (assume endpoint exists)
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(tempPath));
    const fastapiBase = process.env.FASTAPI_URL || 'http://localhost:5000';
    const fastapiUrl = `${fastapiBase}/gradcam`;
    const gradcamRes = await axios.post(fastapiUrl, form, { headers: form.getHeaders(), responseType: 'arraybuffer' });
    // Save Grad-CAM image to Spaces
    const s3Key = `gradcam/${Date.now()}_${prediction_id}.jpg`;
    const s3Params = {
      Bucket: DO_SPACES_BUCKET,
      Key: s3Key,
      Body: gradcamRes.data,
      ACL: 'public-read',
      ContentType: 'image/jpeg'
    };
    const s3Result = await s3.upload(s3Params).promise();
    fs.unlinkSync(tempPath);
    // Update prediction with gradcam_uri
    await predictions.updateOne(
      { _id: new ObjectId(prediction_id) },
      { $set: { gradcam_uri: s3Result.Location } }
    );
    res.json({ gradcam_url: s3Result.Location });
  } catch (err) {
    console.error('[generate-gradcam] Full error:', err);
    res.status(500).json({ error: err && (err.message || JSON.stringify(err)) });
  }
});

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
  });
});

process.on('SIGINT', async () => {
  await client.close();
  process.exit();
});

// Create admin user on startup (uncomment after initial setup)
// createAdminUser();

// Admin endpoint to promote user to admin role
app.post('/admin/promote-user', requireAdminAuth, async (req, res) => {
  try {
    const { user_id, target_username } = req.body;
    
    if (!target_username) {
      return res.status(400).json({ error: 'Target username required' });
    }
    
    // Find the target user
    const targetUser = await users.findOne({ username: target_username.toLowerCase().trim() });
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }
    
    if (targetUser.role === 'admin') {
      return res.status(400).json({ error: 'User is already an admin' });
    }
    
    // Update user role to admin
    await users.updateOne(
      { _id: targetUser._id },
      { $set: { role: 'admin' } }
    );
    
    // Log the role promotion
    const { ipAddress, userAgent } = getClientInfo(req);
    await logAuditEvent('USER_PROMOTED_TO_ADMIN', targetUser._id.toString(), {
      promoted_by: req.user.username,
      promoted_by_id: req.user._id.toString(),
      target_username: targetUser.username,
      target_email: targetUser.email
    }, ipAddress, userAgent);
    
    res.json({ 
      message: `User ${targetUser.username} promoted to admin successfully`,
      promoted_user: {
        username: targetUser.username,
        email: targetUser.email,
        role: 'admin'
      },
      promoted_by: req.user.username
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint to revoke admin role (demote to user)
app.post('/admin/demote-user', requireAdminAuth, async (req, res) => {
  try {
    const { target_username } = req.body;
    
    if (!target_username) {
      return res.status(400).json({ error: 'Target username required' });
    }
    
    // Find the target user
    const targetUser = await users.findOne({ username: target_username.toLowerCase().trim() });
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }
    
    if (targetUser.role !== 'admin') {
      return res.status(400).json({ error: 'User is not an admin' });
    }
    
    // Prevent self-demotion
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot demote yourself' });
    }
    
    // Update user role to user
    await users.updateOne(
      { _id: targetUser._id },
      { $set: { role: 'user' } }
    );
    
    // Log the role demotion
    const { ipAddress, userAgent } = getClientInfo(req);
    await logAuditEvent('USER_DEMOTED_FROM_ADMIN', targetUser._id.toString(), {
      demoted_by: req.user.username,
      demoted_by_id: req.user._id.toString(),
      target_username: targetUser.username,
      target_email: targetUser.email
    }, ipAddress, userAgent);
    
    res.json({ 
      message: `User ${targetUser.username} demoted to regular user successfully`,
      demoted_user: {
        username: targetUser.username,
        email: targetUser.email,
        role: 'user'
      },
      demoted_by: req.user.username
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint to list all users with their roles
app.post('/admin/list-users', requireAdminAuth, async (req, res) => {
  try {
    const { limit = 50, skip = 0, role_filter } = req.body;
    
    let query = {};
    if (role_filter) {
      query.role = role_filter;
    }
    
    const usersList = await users
      .find(query, {
        projection: {
          password_hash: 0,
          salt: 0
        }
      })
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .toArray();
    
    const totalUsers = await users.countDocuments(query);
    
    // Log admin user list access
    const { ipAddress, userAgent } = getClientInfo(req);
    await logAuditEvent('ADMIN_USER_LIST_ACCESSED', req.user._id.toString(), {
      accessed_by: req.user.username,
      filter_applied: query,
      results_count: usersList.length,
      total_users: totalUsers
    }, ipAddress, userAgent);
    
    res.json({
      users: usersList,
      total_count: totalUsers,
      current_page: Math.floor(skip / limit) + 1,
      total_pages: Math.ceil(totalUsers / limit),
      accessed_by: req.user.username
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ FEEDBACK ENDPOINTS ============

// POST endpoint to submit feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const { summary_id, user_id, image_id, feedback_type, usefulness_score, user_comment, timestamp } = req.body;
    
    if (!summary_id || !user_id || !feedback_type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Required fields missing: summary_id, user_id, feedback_type' 
      });
    }
    
    console.log(`📝 Storing feedback for summary: ${summary_id}, user: ${user_id}`);
    
    // Create the feedback document
    const feedbackDocument = {
      summary_id: summary_id,
      user_id: user_id,
      image_id: image_id || null,
      feedback_type: feedback_type, // 'helpful', 'not_helpful', 'inaccurate', 'suggestion'
      usefulness_score: usefulness_score || null, // 1-5 rating
      user_comment: user_comment || '',
      timestamp: timestamp || new Date().toISOString(),
      created_at: new Date(),
      // Additional metadata
      context: {
        platform: 'web_app',
        feature: 'llm_summaries'
      }
    };
    
    // Store in MongoDB
    const result = await feedback.insertOne(feedbackDocument);
    
    if (result.insertedId) {
      console.log(`✅ Feedback stored with ID: ${result.insertedId}`);
      
      // Log this action for analytics
      await logSystemAction(user_id, 'feedback_submitted', {
        feedback_id: result.insertedId.toString(),
        feedback_type: feedback_type,
        usefulness_score: usefulness_score
      });
      
      res.json({ 
        success: true,
        feedbackId: result.insertedId.toString(),
        message: 'Feedback submitted successfully'
      });
    } else {
      throw new Error('Failed to insert feedback document');
    }
    
  } catch (err) {
    console.error('Error storing feedback:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// GET endpoint to retrieve feedback
app.get('/api/feedback', async (req, res) => {
  try {
    const { user_id, summary_id, feedback_type, limit = 50 } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID required' 
      });
    }
    
    console.log(`📊 Fetching feedback for user: ${user_id}`);
    
    // Build query
    let query = { user_id: user_id };
    if (summary_id) query.summary_id = summary_id;
    if (feedback_type) query.feedback_type = feedback_type;
    
    // Get feedback entries
    const feedbackEntries = await feedback.find(query)
      .sort({ created_at: -1 }) // Most recent first
      .limit(parseInt(limit))
      .toArray();
    
    console.log(`Found ${feedbackEntries.length} feedback entries for user ${user_id}`);
    
    // Format feedback for frontend consumption
    const formattedFeedback = feedbackEntries.map(entry => ({
      _id: entry._id.toString(),
      summaryId: entry.summary_id,
      userId: entry.user_id,
      imageId: entry.image_id,
      feedbackType: entry.feedback_type,
      usefulnessScore: entry.usefulness_score,
      userComment: entry.user_comment,
      timestamp: entry.timestamp,
      createdAt: entry.created_at
    }));
    
    res.json({ 
      success: true, 
      feedback: formattedFeedback,
      totalCount: formattedFeedback.length,
      userId: user_id
    });
    
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// GET endpoint for feedback analytics (admin only)
app.get('/api/feedback/analytics', async (req, res) => {
  try {
    const { admin_token } = req.query;
    
    // Verify admin access
    const adminUser = await verifyAdminToken(admin_token);
    if (!adminUser) {
      return res.status(401).json({ 
        success: false, 
        error: 'Admin access required' 
      });
    }
    
    console.log('📈 Generating feedback analytics');
    
    // Aggregate feedback statistics
    const feedbackStats = await feedback.aggregate([
      {
        $group: {
          _id: '$feedback_type',
          count: { $sum: 1 },
          avgUsefulness: { $avg: '$usefulness_score' }
        }
      }
    ]).toArray();
    
    const totalFeedback = await feedback.countDocuments();
    const recentFeedback = await feedback.countDocuments({
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });
    
    // Calculate usefulness distribution
    const usefulnessDistribution = await feedback.aggregate([
      {
        $match: { usefulness_score: { $exists: true, $ne: null } }
      },
      {
        $group: {
          _id: '$usefulness_score',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();
    
    res.json({ 
      success: true, 
      analytics: {
        totalFeedback,
        recentFeedback,
        feedbackByType: feedbackStats,
        usefulnessDistribution,
        averageUsefulness: feedbackStats.reduce((sum, item) => sum + (item.avgUsefulness || 0), 0) / feedbackStats.length || 0
      }
    });
    
  } catch (err) {
    console.error('Error generating feedback analytics:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});
