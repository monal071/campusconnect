const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

const MONGODB_URI = "mongodb+srv://cc:123%40abc@campusconnect.jligiuz.mongodb.net/?retryWrites=true&w=majority&appName=campusconnect";

async function addDemoData() {
  let client;

  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('campusconnect');

    // Demo Jobs
    console.log('📋 Adding demo jobs...');
    const jobs = [
      {
        title: "Frontend Developer",
        company: "TechCorp Inc.",
        location: "New York, NY",
        type: "Full-time",
        description: "We're looking for a passionate Frontend Developer to join our team. Experience with React, JavaScript, and modern web technologies required.",
        requirements: ["3+ years React experience", "JavaScript/TypeScript proficiency", "CSS/SCSS skills", "Git version control"],
        skills: ["React", "JavaScript", "TypeScript", "CSS", "HTML", "Git"],
        salary: "$70,000 - $90,000",
        postedBy: "hr@techcorp.com",
        postedAt: new Date("2024-10-10"),
        expiresAt: new Date("2024-12-10"),
        status: "active"
      },
      {
        title: "Data Science Intern",
        company: "DataVision Labs",
        location: "Remote",
        type: "Internship",
        description: "Join our data science team to work on machine learning projects. Perfect opportunity for students to gain real-world experience.",
        requirements: ["Python programming", "Statistics knowledge", "Machine learning basics", "Currently enrolled student"],
        skills: ["Python", "Machine Learning", "Statistics", "Pandas", "NumPy", "Jupyter"],
        salary: "$20/hour",
        postedBy: "careers@datavision.com",
        postedAt: new Date("2024-10-12"),
        expiresAt: new Date("2024-11-30"),
        status: "active"
      },
      {
        title: "UX Designer",
        company: "Creative Studios",
        location: "San Francisco, CA",
        type: "Part-time",
        description: "Seeking a creative UX Designer to help design user-friendly interfaces for our mobile and web applications.",
        requirements: ["Figma/Sketch proficiency", "User research experience", "Portfolio required", "Design thinking methodology"],
        skills: ["Figma", "Sketch", "Adobe XD", "User Research", "Prototyping", "Wireframing"],
        salary: "$40,000 - $50,000",
        postedBy: "design@creativestudios.com",
        postedAt: new Date("2024-10-08"),
        expiresAt: new Date("2024-11-20"),
        status: "active"
      },
      {
        title: "Software Engineering Intern",
        company: "StartupXYZ",
        location: "Austin, TX",
        type: "Internship",
        description: "Summer internship program for computer science students. Work on real projects with our development team.",
        requirements: ["CS student (Junior/Senior)", "Java or Python experience", "Problem-solving skills", "Team collaboration"],
        skills: ["Java", "Python", "Git", "SQL", "Problem Solving", "Algorithms"],
        salary: "$25/hour",
        postedBy: "internships@startupxyz.com",
        postedAt: new Date("2024-10-05"),
        expiresAt: new Date("2024-12-01"),
        status: "active"
      }
    ];

    await db.collection('jobs').insertMany(jobs);
    console.log(`✅ Added ${jobs.length} demo jobs`);

    // Demo Events
    console.log('🎉 Adding demo events...');
    const events = [
      {
        title: "Tech Career Fair 2024",
        description: "Join us for the biggest tech career fair of the year! Meet recruiters from top tech companies, attend workshops, and network with industry professionals.",
        date: new Date("2024-11-15T10:00:00.000Z"),
        endDate: new Date("2024-11-15T16:00:00.000Z"),
        location: "Campus Convention Center, Hall A",
        organizer: "Career Services Office",
        category: "career",
        attendees: [],
        maxAttendees: 500,
        isPublic: true,
        createdAt: new Date(),
        createdBy: "career@university.edu"
      },
      {
        title: "JavaScript Workshop: Modern ES6+ Features",
        description: "Learn about the latest JavaScript features including async/await, destructuring, arrow functions, and modules. Perfect for beginners and intermediate developers.",
        date: new Date("2024-10-25T14:00:00.000Z"),
        endDate: new Date("2024-10-25T17:00:00.000Z"),
        location: "Computer Science Building, Room 201",
        organizer: "Computer Science Club",
        category: "workshop",
        attendees: [],
        maxAttendees: 50,
        isPublic: true,
        createdAt: new Date(),
        createdBy: "cs.club@university.edu"
      },
      {
        title: "AI & Machine Learning Symposium",
        description: "Explore the latest trends in artificial intelligence and machine learning. Guest speakers from industry and academia will share insights on cutting-edge research.",
        date: new Date("2024-11-20T09:00:00.000Z"),
        endDate: new Date("2024-11-20T17:00:00.000Z"),
        location: "Engineering Auditorium",
        organizer: "AI Research Lab",
        category: "conference",
        attendees: [],
        maxAttendees: 200,
        isPublic: true,
        createdAt: new Date(),
        createdBy: "ai.lab@university.edu"
      },
      {
        title: "Hackathon 2024: Build for Good",
        description: "48-hour hackathon focused on creating solutions for social impact. Team up with other students and build something that makes a difference!",
        date: new Date("2024-11-01T18:00:00.000Z"),
        endDate: new Date("2024-11-03T18:00:00.000Z"),
        location: "Innovation Hub",
        organizer: "Student Tech Society",
        category: "competition",
        attendees: [],
        maxAttendees: 100,
        isPublic: true,
        createdAt: new Date(),
        createdBy: "tech.society@university.edu"
      },
      {
        title: "Networking Night: Alumni Meetup",
        description: "Connect with successful alumni working in various industries. Great opportunity to learn about career paths and build professional networks.",
        date: new Date("2024-10-30T18:30:00.000Z"),
        endDate: new Date("2024-10-30T21:00:00.000Z"),
        location: "Student Union Building, Grand Ballroom",
        organizer: "Alumni Association",
        category: "networking",
        attendees: [],
        maxAttendees: 150,
        isPublic: true,
        createdAt: new Date(),
        createdBy: "alumni@university.edu"
      }
    ];

    await db.collection('events').insertMany(events);
    console.log(`✅ Added ${events.length} demo events`);

    // Demo Public Quizzes
    console.log('📝 Adding demo public quizzes...');
    
    // First, let's create a demo faculty user if it doesn't exist
    const demoFacultyId = new ObjectId();
    const existingFaculty = await db.collection('users').findOne({ email: 'demo.faculty@university.edu' });
    
    if (!existingFaculty) {
      await db.collection('users').insertOne({
        _id: demoFacultyId,
        email: 'demo.faculty@university.edu',
        name: 'Prof. Demo Faculty',
        role: 'faculty',
        department: 'Computer Science',
        createdAt: new Date()
      });
      console.log('✅ Created demo faculty user');
    } else {
      console.log('ℹ️ Demo faculty user already exists, using existing ID');
    }

    const facultyId = existingFaculty ? existingFaculty._id : demoFacultyId;

    const quizzes = [
      {
        quizName: "JavaScript Fundamentals Quiz",
        description: "Test your knowledge of JavaScript basics including variables, functions, arrays, and objects.",
        questions: [
          {
            id: 1,
            question: "Which of the following is the correct way to declare a variable in JavaScript?",
            options: ["var myVar;", "variable myVar;", "v myVar;", "declare myVar;"],
            correctAnswer: 0,
            points: 10
          },
          {
            id: 2,
            question: "What does 'typeof null' return in JavaScript?",
            options: ["'null'", "'undefined'", "'object'", "'boolean'"],
            correctAnswer: 2,
            points: 10
          },
          {
            id: 3,
            question: "Which method is used to add an element to the end of an array?",
            options: ["append()", "push()", "add()", "insert()"],
            correctAnswer: 1,
            points: 10
          },
          {
            id: 4,
            question: "What is the result of '3' + 2 in JavaScript?",
            options: ["5", "'32'", "32", "Error"],
            correctAnswer: 1,
            points: 10
          },
          {
            id: 5,
            question: "Which of the following is NOT a JavaScript data type?",
            options: ["String", "Boolean", "Integer", "Number"],
            correctAnswer: 2,
            points: 10
          }
        ],
        timeLimit: 15,
        difficulty: "beginner",
        category: "Programming",
        totalQuestions: 5,
        totalPoints: 50,
        isPublic: true,
        isActive: true,
        allowRetakes: true,
        showResults: true,
        createdBy: facultyId,
        createdByName: "Prof. Demo Faculty",
        createdAt: new Date("2024-10-10"),
        password: "JS2024",
        submissions: []
      },
      {
        quizName: "Data Structures & Algorithms Basics",
        description: "Fundamental concepts in data structures and algorithms. Good for computer science students preparing for interviews.",
        questions: [
          {
            id: 1,
            question: "What is the time complexity of searching in a binary search tree (average case)?",
            options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
            correctAnswer: 1,
            points: 15
          },
          {
            id: 2,
            question: "Which data structure follows the LIFO (Last In First Out) principle?",
            options: ["Queue", "Stack", "Array", "Linked List"],
            correctAnswer: 1,
            points: 15
          },
          {
            id: 3,
            question: "What is the worst-case time complexity of Quick Sort?",
            options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
            correctAnswer: 2,
            points: 15
          },
          {
            id: 4,
            question: "In a hash table, what happens when two keys hash to the same index?",
            options: ["Error occurs", "Collision occurs", "Data is lost", "Table is resized"],
            correctAnswer: 1,
            points: 15
          }
        ],
        timeLimit: 20,
        difficulty: "intermediate",
        category: "Computer Science",
        totalQuestions: 4,
        totalPoints: 60,
        isPublic: true,
        isActive: true,
        allowRetakes: false,
        showResults: true,
        createdBy: facultyId,
        createdByName: "Prof. Demo Faculty",
        createdAt: new Date("2024-10-08"),
        password: "DSA2024",
        submissions: []
      },
      {
        quizName: "Web Development Trivia",
        description: "Fun quiz about web development technologies, frameworks, and best practices. Test your web dev knowledge!",
        questions: [
          {
            id: 1,
            question: "Which CSS property is used to make text bold?",
            options: ["font-weight", "text-bold", "font-style", "text-weight"],
            correctAnswer: 0,
            points: 10
          },
          {
            id: 2,
            question: "What does HTML stand for?",
            options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"],
            correctAnswer: 0,
            points: 10
          },
          {
            id: 3,
            question: "Which JavaScript framework is developed by Facebook?",
            options: ["Angular", "Vue.js", "React", "Svelte"],
            correctAnswer: 2,
            points: 10
          },
          {
            id: 4,
            question: "What is the default port for HTTP?",
            options: ["80", "443", "8080", "3000"],
            correctAnswer: 0,
            points: 10
          },
          {
            id: 5,
            question: "Which HTTP method is used to update existing data?",
            options: ["GET", "POST", "PUT", "DELETE"],
            correctAnswer: 2,
            points: 10
          },
          {
            id: 6,
            question: "What does CSS stand for?",
            options: ["Creative Style Sheets", "Cascading Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"],
            correctAnswer: 1,
            points: 10
          }
        ],
        timeLimit: 10,
        difficulty: "beginner",
        category: "Web Development",
        totalQuestions: 6,
        totalPoints: 60,
        isPublic: true,
        isActive: true,
        allowRetakes: true,
        showResults: true,
        createdBy: facultyId,
        createdByName: "Prof. Demo Faculty",
        createdAt: new Date("2024-10-12"),
        password: "WEB2024",
        submissions: []
      },
      {
        quizName: "Database Management Systems",
        description: "Test your understanding of database concepts, SQL queries, and database design principles.",
        questions: [
          {
            id: 1,
            question: "What does SQL stand for?",
            options: ["Structured Query Language", "Standard Query Language", "Simple Query Language", "System Query Language"],
            correctAnswer: 0,
            points: 12
          },
          {
            id: 2,
            question: "Which SQL command is used to retrieve data from a database?",
            options: ["GET", "SELECT", "FETCH", "RETRIEVE"],
            correctAnswer: 1,
            points: 12
          },
          {
            id: 3,
            question: "What is a primary key in a database?",
            options: ["The first column in a table", "A unique identifier for each row", "The most important data", "A password for the database"],
            correctAnswer: 1,
            points: 12
          },
          {
            id: 4,
            question: "Which normal form eliminates transitive dependencies?",
            options: ["1NF", "2NF", "3NF", "4NF"],
            correctAnswer: 2,
            points: 12
          },
          {
            id: 5,
            question: "What is the purpose of an index in a database?",
            options: ["To store data", "To speed up queries", "To backup data", "To secure data"],
            correctAnswer: 1,
            points: 12
          }
        ],
        timeLimit: 25,
        difficulty: "intermediate",
        category: "Database",
        totalQuestions: 5,
        totalPoints: 60,
        isPublic: true,
        isActive: true,
        allowRetakes: true,
        showResults: true,
        createdBy: facultyId,
        createdByName: "Prof. Demo Faculty",
        createdAt: new Date("2024-10-06"),
        password: "DB2024",
        submissions: []
      }
    ];

    await db.collection('quizzes').insertMany(quizzes);
    console.log(`✅ Added ${quizzes.length} demo public quizzes`);

    // Demo Posts
    console.log('📱 Adding demo posts...');
    const posts = [
      {
        content: "Just finished an amazing coding bootcamp! The experience was intense but so rewarding. Special thanks to all the instructors who helped me along the way. Now I'm ready to start my journey as a full-stack developer! 🚀 #coding #webdevelopment #career",
        author: "Alex Johnson",
        authorEmail: "alex.j@university.edu",
        authorRole: "student",
        likes: 24,
        comments: [
          {
            id: new ObjectId(),
            text: "Congratulations! That's awesome news!",
            author: "Sarah Wilson",
            authorEmail: "sarah.w@university.edu",
            createdAt: new Date("2024-10-13T09:30:00.000Z")
          },
          {
            id: new ObjectId(),
            text: "Well done! The bootcamp was definitely challenging but worth it.",
            author: "Mike Chen",
            authorEmail: "mike.c@university.edu", 
            createdAt: new Date("2024-10-13T10:15:00.000Z")
          }
        ],
        createdAt: new Date("2024-10-13T08:00:00.000Z"),
        updatedAt: new Date("2024-10-13T08:00:00.000Z")
      },
      {
        content: "Looking for study partners for the upcoming Data Structures exam! Planning to meet at the library this weekend. We can review algorithms, practice coding problems, and help each other understand the tricky concepts. DM me if interested! 📚",
        author: "Emma Rodriguez",
        authorEmail: "emma.r@university.edu",
        authorRole: "student",
        likes: 18,
        comments: [
          {
            id: new ObjectId(),
            text: "I'm interested! What time are you thinking?",
            author: "David Kim",
            authorEmail: "david.k@university.edu",
            createdAt: new Date("2024-10-12T15:45:00.000Z")
          }
        ],
        createdAt: new Date("2024-10-12T14:30:00.000Z"),
        updatedAt: new Date("2024-10-12T14:30:00.000Z")
      },
      {
        content: "Excited to announce that our AI research paper has been accepted to the International Conference on Machine Learning! This project involved analyzing deep learning models for natural language processing. Proud of my research team! 🎓🔬 #research #AI #MachineLearning",
        author: "Prof. Demo Faculty",
        authorEmail: "demo.faculty@university.edu",
        authorRole: "faculty",
        likes: 45,
        comments: [
          {
            id: new ObjectId(),
            text: "Congratulations Professor! That's a huge achievement!",
            author: "Lisa Park",
            authorEmail: "lisa.p@university.edu",
            createdAt: new Date("2024-10-11T11:20:00.000Z")
          },
          {
            id: new ObjectId(),
            text: "Amazing work! Can't wait to read the paper when it's published.",
            author: "James Wilson",
            authorEmail: "james.w@university.edu",
            createdAt: new Date("2024-10-11T12:00:00.000Z")
          }
        ],
        createdAt: new Date("2024-10-11T10:00:00.000Z"),
        updatedAt: new Date("2024-10-11T10:00:00.000Z")
      },
      {
        content: "PSA: The university library will have extended hours during finals week! Open 24/7 from November 25th to December 8th. Perfect for those late-night study sessions. Also, don't forget they have free coffee and snacks on the 3rd floor! ☕📖",
        author: "Campus News Bot",
        authorEmail: "news@university.edu",
        authorRole: "admin",
        likes: 67,
        comments: [],
        createdAt: new Date("2024-10-10T16:00:00.000Z"),
        updatedAt: new Date("2024-10-10T16:00:00.000Z")
      }
    ];

    await db.collection('posts').insertMany(posts);
    console.log(`✅ Added ${posts.length} demo posts`);

    // Demo Resources
    console.log('📚 Adding demo resources...');
    const resources = [
      {
        title: "JavaScript: The Definitive Guide",
        description: "Comprehensive guide to JavaScript programming language. Covers everything from basics to advanced topics including ES6+ features, DOM manipulation, and modern JavaScript development.",
        type: "book",
        category: "programming",
        tags: ["javascript", "programming", "web development", "es6"],
        author: "David Flanagan",
        url: "https://example.com/js-guide",
        uploadedBy: "library@university.edu",
        uploadedByName: "University Library",
        createdAt: new Date("2024-10-10"),
        isPublic: true,
        downloadCount: 245
      },
      {
        title: "Introduction to Algorithms (CLRS)",
        description: "The essential textbook for computer science students. Comprehensive coverage of algorithms and data structures with mathematical proofs and analysis.",
        type: "book", 
        category: "computer science",
        tags: ["algorithms", "data structures", "computer science", "mathematics"],
        author: "Cormen, Leiserson, Rivest, Stein",
        url: "https://example.com/clrs",
        uploadedBy: "cs.dept@university.edu",
        uploadedByName: "CS Department",
        createdAt: new Date("2024-10-08"),
        isPublic: true,
        downloadCount: 189
      },
      {
        title: "React.js Crash Course - Complete Tutorial",
        description: "Learn React.js from scratch in this comprehensive video tutorial. Covers components, hooks, state management, and building real projects.",
        type: "video",
        category: "web development",
        tags: ["react", "javascript", "frontend", "tutorial"],
        author: "TechEdu Channel",
        url: "https://youtube.com/watch?v=example",
        uploadedBy: "demo.faculty@university.edu",
        uploadedByName: "Prof. Demo Faculty",
        createdAt: new Date("2024-10-12"),
        isPublic: true,
        downloadCount: 156
      },
      {
        title: "Database Design Best Practices",
        description: "Essential guide for designing efficient and scalable databases. Includes normalization, indexing strategies, and performance optimization techniques.",
        type: "document",
        category: "database",
        tags: ["database", "sql", "design", "best practices"],
        author: "University DB Team",
        url: "https://example.com/db-guide.pdf",
        uploadedBy: "it.support@university.edu",
        uploadedByName: "IT Support Team",
        createdAt: new Date("2024-10-09"),
        isPublic: true,
        downloadCount: 98
      },
      {
        title: "Python for Data Science Handbook",
        description: "Comprehensive guide to using Python for data analysis and machine learning. Covers pandas, numpy, matplotlib, and scikit-learn libraries.",
        type: "book",
        category: "data science",
        tags: ["python", "data science", "machine learning", "pandas"],
        author: "Jake VanderPlas",
        url: "https://example.com/python-ds",
        uploadedBy: "data.science@university.edu",
        uploadedByName: "Data Science Club",
        createdAt: new Date("2024-10-11"),
        isPublic: true,
        downloadCount: 134
      },
      {
        title: "CSS Grid and Flexbox Masterclass",
        description: "Master modern CSS layout techniques with this comprehensive video course. Learn to create responsive and flexible web layouts.",
        type: "video",
        category: "web development",
        tags: ["css", "grid", "flexbox", "responsive design"],
        author: "WebDesign Pro",
        url: "https://example.com/css-masterclass",
        uploadedBy: "design.club@university.edu", 
        uploadedByName: "Web Design Club",
        createdAt: new Date("2024-10-07"),
        isPublic: true,
        downloadCount: 87
      }
    ];

    await db.collection('resources').insertMany(resources);
    console.log(`✅ Added ${resources.length} demo resources`);

    console.log('\n🎉 Demo data has been successfully added to the database!');
    console.log('📋 Summary:');
    console.log(`   • ${jobs.length} Jobs`);
    console.log(`   • ${events.length} Events`);
    console.log(`   • ${quizzes.length} Public Quizzes`);
    console.log(`   • ${posts.length} Posts`);
    console.log(`   • ${resources.length} Resources`);

  } catch (error) {
    console.error('❌ Error adding demo data:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run the script
addDemoData();