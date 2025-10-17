# AvThR - AI Report & Quiz Generator

A powerful client-side web application that generates comprehensive reports and interactive quizzes using Google's Gemini 2.0 Flash model. No backend server required - runs entirely in your browser!

## ✨ Features

- 🤖 **AI-Powered Content Generation** - Uses Google Gemini 2.0 Flash for intelligent report and quiz creation
- 📊 **Multiple Report Formats** - Generate reports and download as HTML or text files
- 🎯 **Interactive Quizzes** - Create multiple choice, one-word answer, and flashcard-style questions
- 🎨 **Modern UI/UX** - Clean, responsive design with dark/light theme support
- 📱 **Mobile Friendly** - Fully responsive across all devices
- ⚡ **No Backend Required** - Completely client-side application
- 🚀 **GitHub Pages Ready** - Easy deployment to GitHub Pages

## 🌐 Live Demo

Visit the live application: [Your GitHub Pages URL]

## 🚀 Quick Setup for GitHub Pages

### 1. Clone or Download this Repository
```bash
git clone https://github.com/your-username/AvThR.git
cd AvThR
```

### 2. Create a GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository named `AvThR`
2. Push this code to your repository:

```bash
git remote add origin https://github.com/your-username/AvThR.git
git branch -M main
git push -u origin main
```

### 3. Enable GitHub Pages
1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **GitHub Actions**
5. The GitHub Actions workflow will automatically deploy your site

### 4. Your Site is Live!
Your application will be available at: `https://your-username.github.io/AvThR`

## 🔧 Local Development

### Prerequisites
- A modern web browser
- A local web server (optional, for development)

### Run Locally
You can run this application locally in several ways:

**Option 1: Using Python (if installed)**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option 2: Using Node.js serve**
```bash
npx serve .
```

**Option 3: Using any local server**
Just open `index.html` in your browser, though some features work better with a local server.

## 🔑 API Configuration

The application uses the Google Gemini API with the key directly embedded in the code. For security in production:

1. **Current Setup**: The API key is embedded in `script.js` for simplicity
2. **Security Note**: This is acceptable for client-side apps as the key has usage limits and is domain-restricted
3. **For Production**: Consider implementing additional security measures if needed

## 📁 Project Structure

```
AvThR/
├── 📄 index.html              # Main application page
├── 🎨 styles.css              # Application styles
├── ⚡ script.js               # Frontend JavaScript with AI integration
├── 📦 package.json            # Package configuration (for local dev)
├── 🚫 .gitignore              # Git ignore rules
├── 📖 README.md               # This file
├── 📄 about.html              # About page
├── 📄 faq.html                # FAQ page
└── .github/
    └── workflows/
        └── 📄 deploy.yml       # GitHub Actions deployment
```

## 🎯 How It Works

### Report Generation
1. Enter your topic
2. Select report length (short/medium/long)
3. Choose text format and formatting options
4. AI generates comprehensive content
5. Download as HTML (can be printed to PDF) or text file

### Quiz Generation
1. Enter quiz topic
2. Select quiz types (MCQ, one-word, flashcards)
3. Set number of questions and difficulty
4. AI creates interactive quiz
5. Take the quiz or download as HTML

### Client-Side AI Integration
- Direct API calls to Google Gemini 2.0 Flash
- No backend server required
- Real-time content generation
- Secure API communication

## 🛠️ Customization

### Updating the API Key
To change the API key, edit the `GEMINI_API_KEY` constant in `script.js`:

```javascript
const GEMINI_API_KEY = 'your-new-api-key-here';
```

### Styling
Modify `styles.css` to customize appearance:
- CSS custom properties for themes
- Responsive design variables
- Animation settings

### Content Templates
Modify the prompt functions in `script.js`:
- `createReportPrompt()` - Customize report generation
- `createQuizPrompt()` - Customize quiz generation

## 📈 Performance & Security

### Performance Features
- ⚡ Client-side rendering
- 🚀 No server latency
- 💾 Minimal resource usage
- 📱 Mobile-optimized

### Security Considerations
- ✅ HTTPS-only API calls
- ✅ Client-side validation
- ✅ No sensitive data storage
- ✅ CORS-compliant requests

## 🚀 Deployment Options

### GitHub Pages (Recommended)
- Automatic deployment via GitHub Actions
- Free hosting with custom domain support
- HTTPS by default
- Global CDN

### Alternative Deployments
1. **Netlify**: Drag and drop deployment
2. **Vercel**: Connect GitHub repository
3. **Firebase Hosting**: `firebase deploy`
4. **Any Static Host**: Upload files to any static hosting service

## 🔄 Updates & Maintenance

### Updating Content
1. Edit files locally
2. Commit and push changes
3. GitHub Actions automatically redeploys

### API Model Updates
To use a different Gemini model, update the `GEMINI_API_URL` in `script.js`:

```javascript
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
```

## 🆘 Troubleshooting

### Common Issues
1. **API Errors**: Check your API key and internet connection
2. **CORS Issues**: Use a local server for development
3. **Mobile Issues**: Ensure responsive design is working
4. **Download Issues**: Check browser's download permissions

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - Free to use, modify, and distribute.

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful content generation
- **GitHub Pages** for free hosting
- **Modern Web Standards** for enabling client-side AI applications

---

**Made with ❤️ by AvThR Team**

*Powered by Th Logic AI - Making AI accessible to everyone*