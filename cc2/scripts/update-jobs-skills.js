const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb+srv://cc:123%40abc@campusconnect.jligiuz.mongodb.net/?retryWrites=true&w=majority&appName=campusconnect";

async function updateJobsWithSkills() {
  let client;

  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('campusconnect');

    // Update jobs with skills based on title
    const updates = [
      {
        filter: { title: "Frontend Developer" },
        update: { 
          $set: { 
            skills: ["React", "JavaScript", "TypeScript", "CSS", "HTML", "Git"] 
          } 
        }
      },
      {
        filter: { title: "Data Science Intern" },
        update: { 
          $set: { 
            skills: ["Python", "Machine Learning", "Statistics", "Pandas", "NumPy", "Jupyter"] 
          } 
        }
      },
      {
        filter: { title: "UX Designer" },
        update: { 
          $set: { 
            skills: ["Figma", "Sketch", "Adobe XD", "User Research", "Prototyping", "Wireframing"] 
          } 
        }
      },
      {
        filter: { title: "Software Engineering Intern" },
        update: { 
          $set: { 
            skills: ["Java", "Python", "Git", "SQL", "Problem Solving", "Algorithms"] 
          } 
        }
      }
    ];

    console.log('📝 Updating jobs with skills...');
    let updatedCount = 0;

    for (const { filter, update } of updates) {
      const result = await db.collection('jobs').updateMany(filter, update);
      updatedCount += result.modifiedCount;
      console.log(`Updated ${result.modifiedCount} jobs matching "${filter.title}"`);
    }

    console.log(`✅ Updated ${updatedCount} total jobs with skills`);

  } catch (error) {
    console.error('❌ Error updating jobs:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

updateJobsWithSkills();