# wiSHlist 🎓📝

A modern, user-friendly wishlist application designed specifically for teachers to create and share classroom supply wishlists with supporters. Built with React, TypeScript, and Appwrite.

<!-- Deployment trigger -->

## 📖 Overview

wiSHlist empowers educators to create organized wishlists of classroom supplies and materials, making it easy for parents, community members, and supporters to contribute to student success. Teachers can manage their wishlists with drag-and-drop functionality, while supporters can view and purchase items through a clean, responsive interface.

## ✨ Features

### For Teachers
- **📋 Wishlist Management**: Create and manage multiple wishlists with drag-and-drop reordering
- **🎨 Customizable Items**: Add items with names, descriptions, store links, and estimated costs
- **👥 User Management**: Invite and manage recommenders and administrators
- **📊 Contribution Tracking**: Monitor which items have been purchased and by how many contributors
- **🔗 Easy Sharing**: Generate shareable links and keys for public wishlist access
- **⚙️ Settings Control**: Customize wishlist names, contact information, and privacy settings
- **📱 Responsive Design**: Manage wishlists on desktop, tablet, or mobile devices

### For Supporters
- **🛍️ Easy Browsing**: View wishlists in list or grid layout
- **🔍 Item Details**: See item descriptions, costs, and store links
- **✅ Purchase Tracking**: Mark items as purchased to prevent duplicates
- **🌐 Direct Links**: Quick access to store pages for purchasing
- **💡 Suggestions**: Recommend new items to teachers
- **📱 Mobile Friendly**: Browse and contribute on any device

### Technical Features
- **🌙 Dark/Light Mode**: Automatic theme switching with system preference detection
- **🔐 Secure Authentication**: User registration and login with Appwrite
- **📦 Real-time Updates**: Live synchronization of wishlist changes
- **🎯 Modern UI**: Clean, intuitive interface built with Tailwind CSS
- **♿ Accessibility**: Screen reader friendly with proper ARIA labels
- **⚡ Performance**: Optimized loading and caching for smooth experience

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Appwrite (Database, Authentication, Real-time)
- **Icons**: Lucide React
- **Drag & Drop**: React Beautiful DND
- **Routing**: React Router DOM
- **Build Tool**: Create React App

## 🚀 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Appwrite account and project

### 1. Clone the Repository

```bash
git clone https://github.com/shuff57/wiSHlist.git
cd wiSHlist
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Appwrite

1. Create an account at [Appwrite Cloud](https://cloud.appwrite.io) or set up self-hosted Appwrite
2. Create a new project
3. Set up the following collections in your Appwrite database:
   - `wishlists` - Store wishlist information
   - `items` - Store wishlist items
   - `suggestions` - Store item suggestions
   - `users` - Store user profiles

### 4. Environment Configuration

Create a `.env` file in the root directory:

```env
# Appwrite Configuration
REACT_APP_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
REACT_APP_APPWRITE_PROJECT_ID=your_project_id_here
```

Replace `your_project_id_here` with your actual Appwrite project ID.

### 5. Start Development Server

```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000)

## 📦 Available Scripts

### Development
```bash
npm start          # Start development server
npm run dev        # Alternative dev server command
```

### Production
```bash
npm run build      # Build for production
npm run preview    # Preview production build locally
```

### Testing & Quality
```bash
npm test           # Run test suite
npm run lint       # Check code quality
```

## 🏗️ Project Structure

```
src/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── common/          # Reusable UI components
│   ├── layout/          # Layout components (Header, etc.)
│   ├── supporter/       # Supporter-facing components
│   └── teacher/         # Teacher dashboard components
├── context/             # React context providers
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── constants/           # Application constants
└── assets/              # Static assets
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push to main

### Deploy to Netlify
1. Build the project: `npm run build`
2. Upload the `build` folder to Netlify
3. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Teachers everywhere who inspire learning
- The Appwrite team for an excellent backend platform
- The React and TypeScript communities
- Contributors who help improve education technology

## 📞 Support

For support, email support@wishlist.app or open an issue on GitHub.

---

**Made with ❤️ for educators and their supporters**

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have Node.js and npm installed on your machine.

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/your_username/wiSHlist.git
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```

## Available Scripts

In the project directory, you can run:

### `npm start` or `npm run dev`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Project Structure

```
src
├── App.tsx
├── index.css
├── index.tsx
├── components
│   ├── TeacherWishlist.tsx
│   ├── admin
│   │   └── AdminDashboard.tsx
│   ├── auth
│   │   └── LoginView.tsx
│   └── wishlist
│       └── WishlistView.tsx
├── constants
│   └── index.ts
├── types
│   └── index.ts
└── utils
    └── auth.ts
```

## Dependencies

-   [@types/node](https://www.npmjs.com/package/@types/node)
-   [@types/react](https://www.npmjs.com/package/@types/react)
-   [@types/react-dom](https://www.npmjs.com/package/@types/react-dom)
-   [lucide-react](https://www.npmjs.com/package/lucide-react)
-   [react](https://www.npmjs.com/package/react)
-   [react-dom](https://www.npmjs.com/package/react-dom)
-   [typescript](https://www.npmjs.com/package/typescript)

## Dev Dependencies

-   [@types/jest](https://www.npmjs.com/package/@types/jest)
-   [autoprefixer](https://www.npmjs.com/package/autoprefixer)
-   [postcss](https://www.npmjs.com/package/postcss)
-   [react-scripts](https://www.npmjs.com/package/react-scripts)
-   [tailwindcss](https://npmjs.com/package/tailwindcss)
