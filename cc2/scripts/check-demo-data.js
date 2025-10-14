const { MongoClient } = require('mongodb');

async function checkDemoData() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    const client = new MongoClient('mongodb+srv://cc:123%40abc@campusconnect.jligiuz.mongodb.net/?retryWrites=true&w=majority&appName=campusconnect');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db('campusconnect');
    
    console.log('\n📊 Demo Data Status:');
    console.log('Jobs count:', await db.collection('jobs').countDocuments());
    console.log('Events count:', await db.collection('events').countDocuments());
    console.log('Quizzes count:', await db.collection('quizzes').countDocuments());
    console.log('Posts count:', await db.collection('posts').countDocuments());
    console.log('Resources count:', await db.collection('resources').countDocuments());
    
    // Show sample data
    const jobs = await db.collection('jobs').find({}).limit(2).toArray();
    console.log('\n📋 Sample Jobs:');
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} at ${job.company}`);
    });
    
    const events = await db.collection('events').find({}).limit(2).toArray();
    console.log('\n🎉 Sample Events:');
    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} - ${event.date}`);
    });
    
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB Atlas');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDemoData();