- Profile customization (bio, profile picture, website)
- Follow/unfollow users
- View followers and following lists
- Public and private account settings

### Posts Management
- Create posts with multiple images (up to 10)
- Add captions and locations
- Like and unlike posts
- Comment on posts
- Save posts for later
- Delete your own posts
- View post details

### Feed & Discovery
- Personalized home feed from followed users
- Infinite scroll for seamless browsing
- Explore page to discover new content
- Search users by username or name
- Post grid view on profile pages

### Responsive Design
- Modern, Instagram-inspired UI
- Fully responsive for mobile, tablet, and desktop
- Smooth animations and transitions
- Toast notifications for user feedback

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Docker and Docker Compose installed
- MongoDB Atlas account (free tier)
- Cloudinary account (free tier)

### Setup

1. **Clone and navigate to project**
   ```bash
   cd "c:\Users\vigne\OneDrive\Desktop\instagram clone"
   ```

2. **Create environment file**
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

3. **Configure MongoDB Atlas**
   - Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Get your connection string
   - Add it to `.env` as `MONGODB_URI`

4. **Configure Cloudinary**
   - Sign up at [cloudinary.com](https://cloudinary.com/)
   - Get your Cloud Name, API Key, and API Secret
   - Add them to `.env`

5. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

6. **Run with Docker**
   ```bash
   docker-compose up --build
   ```

   Or run manually:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend (serve with any static server)
   # Example with Python:
   cd frontend
   python -m http.server 80
   ```

7. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:3000
   - Health check: http://localhost:3000/health

## 📁 Project Structure

```
instagram-clone/
├── backend/
│   ├── config/
│   │   ├── database.js      # MongoDB connection
│   │   └── cloudinary.js    # Cloudinary setup
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication
│   │   └── upload.js        # File upload handling
│   ├── models/
│   │   ├── User.js          # User schema
│   │   └── Post.js          # Post schema
│   ├── routes/
│   │   ├── auth.js          # Authentication endpoints
│   │   ├── users.js         # User management
│   │   └── posts.js         # Post operations
│   ├── server.js            # Express server
│   └── package.json
├── frontend/
│   ├── css/
│   │   ├── main.css         # Core styles & design system
│   │   └── components.css   # Component styles
│   ├── js/
│   │   ├── components/
│   │   │   ├── navbar.js
│   │   │   ├── post-card.js
│   │   │   └── modal.js
│   │   ├── pages/
│   │   │   ├── login.js
│   │   │   ├── signup.js
│   │   │   ├── home.js
│   │   │   ├── profile.js
│   │   │   ├── upload.js
│   │   │   └── explore.js
│   │   ├── utils/
│   │   │   ├── helpers.js
│   │   │   └── toast.js
│   │   ├── api.js           # API client
│   │   ├── auth.js          # Auth manager
│   │   ├── router.js        # SPA router
│   │   └── app.js           # Main entry point
│   └── index.html
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf
├── .env.example
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify` - Verify token

### Users
- `GET /api/users/search?q=query` - Search users
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/profile-picture` - Update profile picture
- `POST /api/users/:userId/follow` - Follow user
- `DELETE /api/users/:userId/follow` - Unfollow user
- `GET /api/users/:userId/followers` - Get followers
- `GET /api/users/:userId/following` - Get following

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts/feed?page=1&limit=10` - Get feed
- `GET /api/posts/:postId` - Get single post
- `GET /api/posts/user/:userId` - Get user posts
- `PUT /api/posts/:postId` - Update post
- `DELETE /api/posts/:postId` - Delete post
- `POST /api/posts/:postId/like` - Like post
- `DELETE /api/posts/:postId/like` - Unlike post
- `POST /api/posts/:postId/comment` - Add comment
- `DELETE /api/posts/:postId/comment/:commentId` - Delete comment
- `POST /api/posts/:postId/save` - Save post
- `DELETE /api/posts/:postId/save` - Unsave post
- `GET /api/posts/saved/all` - Get saved posts

## 🎨 Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Cloudinary** - Image hosting
- **Multer** - File upload
- **Bcrypt** - Password hashing

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling (custom design system)
- **JavaScript (ES6+)** - Logic
- **Font Awesome** - Icons
- **Google Fonts (Inter)** - Typography

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Web server & reverse proxy

## 🔐 Security Features

- JWT-based authentication with HTTP-only cookies
- Password hashing with bcrypt
- MongoDB injection prevention
- XSS protection
- CORS configuration
- Rate limiting
- Helmet security headers
- Input validation and sanitization

## 🌟 Best Practices

- Clean code architecture
- RESTful API design
- Error handling and logging
- Environment variables for configuration
- Multi-stage Docker builds
- Health checks for containers
- Responsive design
- Accessibility considerations

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
NODE_ENV=development
PORT=3000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/instagram-clone?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend
FRONTEND_URL=http://localhost:80

# Cookies
COOKIE_SECRET=your-cookie-secret-change-this
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify your connection string is correct
- Check IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for development)
- Ensure database user has proper permissions

### Cloudinary Upload Errors
- Verify API credentials
- Check file size limits (max 50MB)
- Ensure proper file types (JPEG, PNG, GIF, WebP)

### Docker Issues
- Run `docker-compose down -v` to remove volumes
- Run `docker system prune` to clean up
- Check Docker Desktop is running

## 🚀 Deployment

### Production Considerations
1. Use strong JWT secret
2. Enable HTTPS with SSL certificates
3. Configure MongoDB Atlas IP whitelist
4. Set proper CORS origins
5. Use production-grade error logging
6. Configure CDN for static assets
7. Set up monitoring and alerts

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🙏 Acknowledgments

- Inspired by Instagram
- Built with modern web technologies
- Designed for learning and demonstration purposes

---

**Note**: This is a learning project and should not be used as-is in production without proper security audits and enhancements.
