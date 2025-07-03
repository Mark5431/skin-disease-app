// Sample data insertion script for testing LLM summaries integration
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

const sampleData = {
  users: [
    {
      _id: 'test_user_123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
      created_at: new Date()
    }
  ],
  images: [
    {
      _id: new require('mongodb').ObjectId(),
      user_id: 'test_user_123',
      filename: 'sample_lesion_1.jpg',
      image_uri: 'http://localhost:4000/uploads/sample_lesion_1.jpg',
      upload_timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    },
    {
      _id: new require('mongodb').ObjectId(),
      user_id: 'test_user_123',
      filename: 'sample_lesion_2.jpg',
      image_uri: 'http://localhost:4000/uploads/sample_lesion_2.jpg',
      upload_timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    },
    {
      _id: new require('mongodb').ObjectId(),
      user_id: 'test_user_123',
      filename: 'sample_lesion_3.jpg',
      image_uri: 'http://localhost:4000/uploads/sample_lesion_3.jpg',
      upload_timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    }
  ],
  predictions: []
};

// Generate predictions for each image
sampleData.images.forEach((image, index) => {
  const predictions = [
    { predicted_class: 'Benign nevus', confidence_scores: 85.5 },
    { predicted_class: 'Seborrheic keratosis', confidence_scores: 92.3 },
    { predicted_class: 'Melanoma', confidence_scores: 67.8 }
  ];
  
  const prediction = predictions[index];
  sampleData.predictions.push({
    _id: new require('mongodb').ObjectId(),
    image_id: image._id,
    predicted_class: prediction.predicted_class,
    confidence_scores: prediction.confidence_scores,
    model_version: 'v1.2.3',
    inference_timestamp: new Date(image.upload_timestamp.getTime() + 60000) // 1 minute after upload
  });
});

async function insertSampleData() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const database = client.db('idp-sd');
    
    // Insert sample data
    console.log('Inserting sample users...');
    await database.collection('users').insertMany(sampleData.users);
    
    console.log('Inserting sample images...');
    await database.collection('images').insertMany(sampleData.images);
    
    console.log('Inserting sample predictions...');
    await database.collection('predictions').insertMany(sampleData.predictions);
    
    console.log('✅ Sample data inserted successfully!');
    console.log('You can now test the LLM summaries API with userId: test_user_123');
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  insertSampleData();
}

module.exports = { insertSampleData, sampleData };
