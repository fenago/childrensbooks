import express from 'express';
import GeminiStoryService from '../services/geminiService.js';
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const storyService = new GeminiStoryService();

// Store generated stories temporarily (in production, use a database)
const storyCache = new Map();

// Generate a new story
router.post('/generate', async (req, res) => {
  try {
    const { theme, characters, moral, ageGroup, customIdeas } = req.body;
    
    // Validate input
    if (!theme || !characters || characters.length === 0 || !ageGroup) {
      return res.status(400).json({
        error: 'Missing required fields: theme, characters, and ageGroup are required'
      });
    }
    
    // Set up SSE for streaming response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Send initial status
    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Starting story generation...' })}\n\n`);
    
    // Generate story ID
    const storyId = uuidv4();
    
    // Generate the story
    try {
      res.write(`data: ${JSON.stringify({ type: 'status', message: 'Creating story outline...' })}\n\n`);
      
      const storyPages = await storyService.generateStory({
        theme,
        characters,
        moral,
        ageGroup,
        customIdeas
      });
      
      // Store the story
      storyCache.set(storyId, {
        id: storyId,
        pages: storyPages,
        metadata: {
          theme,
          characters,
          moral,
          ageGroup,
          createdAt: new Date().toISOString()
        }
      });
      
      // Send pages one by one for streaming effect
      for (let i = 0; i < storyPages.length; i++) {
        const page = storyPages[i];
        res.write(`data: ${JSON.stringify({ 
          type: 'page', 
          pageNumber: page.pageNumber,
          totalPages: storyPages.length,
          content: page 
        })}\n\n`);
        
        // Small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Send completion message
      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        storyId,
        message: 'Story generation complete!' 
      })}\n\n`);
      
    } catch (error) {
      console.error('Story generation error:', error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: error.message || 'Failed to generate story' 
      })}\n\n`);
    }
    
    res.end();
    
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a stored story
router.get('/story/:id', (req, res) => {
  const story = storyCache.get(req.params.id);
  
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }
  
  res.json(story);
});

// Regenerate a specific page
router.post('/regenerate-page', async (req, res) => {
  try {
    const { storyId, pageNumber } = req.body;
    
    const story = storyCache.get(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    // Find the page to regenerate
    const pageIndex = story.pages.findIndex(p => p.pageNumber === pageNumber);
    if (pageIndex === -1) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    // Regenerate just the illustration for the page
    const page = story.pages[pageIndex];
    const regeneratedPages = await storyService.generateIllustrations(
      [page],
      story.metadata.characters,
      story.metadata.theme
    );
    
    if (regeneratedPages.length > 0) {
      story.pages[pageIndex] = regeneratedPages[0];
      storyCache.set(storyId, story);
    }
    
    res.json({
      success: true,
      page: regeneratedPages[0]
    });
    
  } catch (error) {
    console.error('Page regeneration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate PDF
router.post('/generate-pdf', async (req, res) => {
  try {
    const { storyId } = req.body;
    
    const story = storyCache.get(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: story.pages[0]?.text || 'Children\'s Story',
        Author: 'AI Story Generator',
        Subject: 'Children\'s Story',
        Keywords: story.metadata.theme
      }
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="story-${storyId}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add pages to PDF
    for (let i = 0; i < story.pages.length; i++) {
      const page = story.pages[i];
      
      if (i > 0) {
        doc.addPage();
      }
      
      // Add page title
      if (page.title) {
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text(page.title, { align: 'center' });
        doc.moveDown();
      }
      
      // Add illustration if available
      if (page.illustration && page.illustration.data) {
        try {
          const imageBuffer = Buffer.from(page.illustration.data, 'base64');
          doc.image(imageBuffer, {
            fit: [400, 300],
            align: 'center'
          });
          doc.moveDown();
        } catch (err) {
          console.error('Error adding image to PDF:', err);
        }
      }
      
      // Add text
      doc.fontSize(12)
         .font('Helvetica')
         .text(page.text, {
           align: 'justify',
           lineGap: 5
         });
      
      // Add page number
      doc.fontSize(10)
         .text(`Page ${page.pageNumber}`, 50, doc.page.height - 50, {
           align: 'center'
         });
    }
    
    // Add metadata
    doc.addPage();
    doc.fontSize(10)
       .font('Helvetica-Oblique')
       .text('Created with AI Story Generator', { align: 'center' })
       .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' })
       .text(`Theme: ${story.metadata.theme}`, { align: 'center' });
    
    // Finalize PDF
    doc.end();
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available themes
router.get('/themes', (req, res) => {
  res.json({
    themes: [
      { value: 'adventure', label: 'Adventure', emoji: '🗺️' },
      { value: 'friendship', label: 'Friendship', emoji: '🤝' },
      { value: 'magic', label: 'Magic & Fantasy', emoji: '✨' },
      { value: 'animals', label: 'Animals', emoji: '🦁' },
      { value: 'space', label: 'Space', emoji: '🚀' },
      { value: 'underwater', label: 'Underwater', emoji: '🐠' },
      { value: 'dinosaurs', label: 'Dinosaurs', emoji: '🦕' },
      { value: 'fairy-tale', label: 'Fairy Tale', emoji: '🏰' },
      { value: 'superhero', label: 'Superhero', emoji: '🦸' },
      { value: 'nature', label: 'Nature', emoji: '🌳' }
    ]
  });
});

export default router;
