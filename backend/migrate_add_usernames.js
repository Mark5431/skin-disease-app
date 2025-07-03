// Migration script to add username field to existing users
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://test-user-123:CXi6XO1ezt5kWNoT@cluster0.tdegjwx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function migrateUsers() {
  try {
    await client.connect();
    const database = client.db('idp-sd');
    const users = database.collection('users');
    
    // Find users without username
    const usersWithoutUsername = await users.find({ username: { $exists: false } }).toArray();
    
    console.log(`Found ${usersWithoutUsername.length} users without username field`);
    
    for (const user of usersWithoutUsername) {
      // Generate a username from email (before @ symbol) + random suffix if needed
      let baseUsername = user.email.split('@')[0].toLowerCase();
      // Remove any characters that aren't alphanumeric, underscore, or hyphen
      baseUsername = baseUsername.replace(/[^a-z0-9_-]/g, '');
      
      let username = baseUsername;
      let suffix = 1;
      
      // Check if username already exists, if so, add suffix
      while (await users.findOne({ username })) {
        username = `${baseUsername}${suffix}`;
        suffix++;
      }
      
      // Update user with new username
      await users.updateOne(
        { _id: user._id },
        { $set: { username } }
      );
      
      console.log(`Updated user ${user.email} with username: ${username}`);
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Run migration
migrateUsers();
