const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://test-user-123:CXi6XO1ezt5kWNoT@cluster0.tdegjwx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function promoteUser() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db('idp-sd');
    const users = database.collection('users');
    
    // First, let's check if the user exists
    const user = await users.findOne({ _id: new ObjectId('684ed8f0bc778798b28ee02e') });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('Found user:', user.username, 'Current role:', user.role || 'user');
    
    // Update the user role to admin
    const result = await users.updateOne(
      { _id: new ObjectId('684ed8f0bc778798b28ee02e') },
      { $set: { role: 'admin' } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('User promoted to admin successfully!');
      const updatedUser = await users.findOne({ _id: new ObjectId('684ed8f0bc778798b28ee02e') });
      console.log('Updated user:', updatedUser.username, 'New role:', updatedUser.role);
    } else {
      console.log('No changes made - user may already be admin');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

promoteUser();
