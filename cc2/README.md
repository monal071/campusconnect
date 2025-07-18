# CampusConnect 🎓

A modern digital platform designed to enhance campus life by connecting students, facilitating event discovery, and fostering meaningful relationships within the university community.

![CampusConnect Preview](https://cdn.builder.io/o/assets%2F120eb199b6cc47adbce36dcfbc52593e%2Fc15659da75ea420bbc615cd607f1139a?alt=media&token=e0852113-020f-4129-a1d5-fabf881aa6e6&apiKey=120eb199b6cc47adbce36dcfbc52593e)

## ✨ Features

- **🏠 Modern Homepage** - Beautiful hero section with engaging animations
- **📊 Smart Dashboard** - Personalized hub with quick actions and insights
- **📅 Event Discovery** - Find and join campus events effortlessly
- **💼 Job Opportunities** - Access career opportunities and internships
- **📚 Resource Sharing** - Share and access academic materials
- **🤝 Social Networking** - Connect with like-minded peers
- **🎨 Dark/Light Theme** - Modern UI with theme switching
- **📱 Responsive Design** - Works seamlessly on all devices

## 🚀 Tech Stack

- **Frontend:** Next.js 13, React 18, Tailwind CSS
- **Backend:** Node.js, Next.js API Routes
- **Database:** MongoDB with Mongoose
- **Authentication:** NextAuth.js with Google OAuth
- **UI Libraries:** Framer Motion, Heroicons, Material-UI
- **Styling:** Tailwind CSS with custom animations

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB database
- Google OAuth credentials

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/yourusername/campusconnect.git
cd campusconnect
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install

# or

yarn install
\`\`\`

### 3. Set up environment variables

Create a \`.env.local\` file in the root directory:

\`\`\`env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
\`\`\`

### 4. Run the development server

\`\`\`bash
npm run dev

# or

yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

\`\`\`
campusconnect/
├── components/ # Reusable UI components
├── pages/ # Next.js pages and API routes
│ ├── api/ # Backend API endpoints
│ ├── auth/ # Authentication pages
│ └── ... # Feature pages
├── styles/ # Global styles and CSS
├── utils/ # Utility functions
├── hooks/ # Custom React hooks
├── types/ # TypeScript type definitions
└── public/ # Static assets
\`\`\`

## 🎨 Key Components

- **HeroSection** - Modern landing page hero with animations
- **NavBar** - Responsive navigation with theme switching
- **Dashboard** - Personalized user dashboard
- **EventCard** - Interactive event display components
- **Layout** - Global layout wrapper with animations

## 🔧 Available Scripts

\`\`\`bash
npm run dev # Start development server
npm run build # Build for production
npm run start # Start production server
npm run lint # Run ESLint
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Next.js and modern React patterns
- UI inspired by modern design systems
- Icons by Heroicons
- Animations powered by Framer Motion

---

**CampusConnect** - Empowering campus communities worldwide 🌍
