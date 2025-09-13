# 🪄 Magical Story Creator - AI Children's Book Generator

An interactive web application that generates illustrated children's stories using Google's Gemini 2.0 Flash API (Nano Banana). Create magical, personalized stories with beautiful illustrations tailored to different age groups.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green)
![License](https://img.shields.io/badge/license-MIT-purple)

## ✨ Features

- **AI-Powered Story Generation**: Creates unique, age-appropriate stories with engaging narratives
- **Automatic Illustrations**: Generates beautiful illustrations for each page of the story
- **Multiple Themes**: Choose from adventure, friendship, magic, animals, space, and more
- **Age-Appropriate Content**: Tailored vocabulary and complexity for ages 3-5, 6-8, and 9-12
- **Character Customization**: Create custom characters with names and descriptions
- **Interactive Book Preview**: Beautiful page-turning animations and book-style display
- **PDF Export**: Download your story as a professionally formatted PDF
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Real-time Streaming**: Watch your story come to life with streaming generation

## 🚀 Quick Start

### Prerequisites

- Node.js 16.0 or higher
- npm or yarn package manager
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ChildrensBook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and add your Gemini API key
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎨 How It Works

1. **Choose a Theme**: Select from various story themes like adventure, magic, or friendship
2. **Create Characters**: Add character names and descriptions for your story
3. **Select Age Group**: Choose the appropriate age range for vocabulary and complexity
4. **Add Details**: Optionally add a moral lesson or custom story ideas
5. **Generate**: Click the magic button and watch your story come to life!
6. **Preview**: View your illustrated story in a beautiful book format
7. **Download**: Export your story as a PDF to share or print

## 📁 Project Structure

```
ChildrensBook/
├── server/
│   ├── server.js           # Express server setup
│   ├── routes/
│   │   └── storyRoutes.js  # API endpoints for story generation
│   └── services/
│       └── geminiService.js # Gemini API integration
├── client/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # Beautiful animations and styling
│   ├── app.js              # Frontend JavaScript application
│   └── assets/
│       └── generated/      # Generated images storage
├── package.json            # Project dependencies
├── .env.example           # Environment variables template
└── README.md              # Project documentation
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|------------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Yes |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |

### Customization

You can customize various aspects of the application:

- **Themes**: Add new themes in `storyRoutes.js`
- **Age Settings**: Modify age-appropriate settings in `geminiService.js`
- **Styling**: Update colors and animations in `styles.css`
- **Page Count**: Adjust story length in `geminiService.js`

## 🌟 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/story/generate` | POST | Generate a new story |
| `/api/story/story/:id` | GET | Retrieve a generated story |
| `/api/story/regenerate-page` | POST | Regenerate a specific page |
| `/api/story/generate-pdf` | POST | Generate PDF download |
| `/api/story/themes` | GET | Get available themes |

## 💡 Tips for Best Results

1. **Character Descriptions**: Be specific about character traits and appearance
2. **Custom Ideas**: Add unique plot points or scenes for more personalized stories
3. **Age Selection**: Choose the right age group for appropriate vocabulary
4. **Themes**: Mix themes with custom ideas for unique combinations

## 🐛 Troubleshooting

### Common Issues

**API Key Issues**
- Ensure your Gemini API key is valid and has proper permissions
- Check that the .env file is in the root directory
- Verify the API key is correctly set in the .env file

**Generation Failures**
- Check your internet connection
- Verify the Gemini API service is available
- Look for error messages in the browser console

**PDF Download Issues**
- Ensure the story has been fully generated
- Check browser popup blockers
- Try a different browser if issues persist

## 📝 Development

### Running in Development Mode

```bash
npm run dev
```

This will start the server with nodemon for automatic restarts on file changes.

### Building for Production

```bash
npm run build
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini AI for the powerful language and image generation capabilities
- The Windsurf team for the development environment
- All contributors and testers

## 📧 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

**Made with ❤️ and a sprinkle of AI magic ✨**
