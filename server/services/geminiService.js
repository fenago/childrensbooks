import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

class GeminiStoryService {
  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    this.model = 'gemini-2.5-flash-image-preview';
  }

  async generateStory(storyParams) {
    const { theme, characters, moral, ageGroup, customIdeas } = storyParams;
    
    // Build age-appropriate vocabulary and complexity
    const ageSettings = this.getAgeSettings(ageGroup);
    
    // Construct the story prompt
    const storyPrompt = this.buildStoryPrompt(theme, characters, moral, ageGroup, customIdeas, ageSettings);
    
    // Using the exact API structure from the provided code
    const config = {
      responseModalities: ['TEXT'],
    };
    
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: storyPrompt,
          },
        ],
      },
    ];
    
    const response = await this.ai.models.generateContent({
      model: this.model,
      config,
      contents,
    });
    
    const storyContent = response.text();
    
    // Parse the story into pages
    const pages = this.parseStoryIntoPages(storyContent);
    
    // Generate illustrations for each page
    const illustratedPages = await this.generateIllustrations(pages, characters, theme);
    
    return illustratedPages;
  }

  async generateIllustrations(pages, characters, theme) {
    const illustratedPages = [];
    
    // Create a visual style prompt for consistency
    const stylePrompt = `Children's book illustration style: watercolor, soft colors, whimsical, friendly, age-appropriate. Theme: ${theme}. `;
    const characterDescriptions = characters.map(c => `${c.name}: ${c.description}`).join(', ');
    
    for (const page of pages) {
      try {
        const illustrationPrompt = `${stylePrompt} Characters: ${characterDescriptions}. Scene: ${page.illustrationPrompt || page.text.substring(0, 100)}. Create a single beautiful children's book illustration for this scene.`;
        
        // Using the exact API structure from the provided code for image generation
        const config = {
          responseModalities: [
            'IMAGE',
            'TEXT',
          ],
        };
        
        const contents = [
          {
            role: 'user',
            parts: [
              {
                text: illustrationPrompt,
              },
            ],
          },
        ];
        
        // Generate using streaming to capture images
        const response = await this.ai.models.generateContentStream({
          model: this.model,
          config,
          contents,
        });
        
        let imageData = null;
        let textContent = '';
        
        for await (const chunk of response) {
          if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
            continue;
          }
          
          // Check for image data in the response
          if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            const inlineData = chunk.candidates[0].content.parts[0].inlineData;
            const mimeType = inlineData.mimeType || 'image/png';
            imageData = {
              data: inlineData.data,
              mimeType: mimeType
            };
          } else if (chunk.text) {
            textContent += chunk.text;
          }
        }
        
        illustratedPages.push({
          ...page,
          illustration: imageData,
          illustrationPrompt,
          imageDescription: textContent
        });
        
      } catch (error) {
        console.error(`Error generating illustration for page ${page.pageNumber}:`, error);
        illustratedPages.push({
          ...page,
          illustration: null,
          error: 'Failed to generate illustration'
        });
      }
    }
    
    return illustratedPages;
  }

  buildStoryPrompt(theme, characters, moral, ageGroup, customIdeas, ageSettings) {
    const characterList = characters.map(c => `${c.name} (${c.description})`).join(', ');
    
    return `Create a children's story with the following specifications:
    
THEME: ${theme}
CHARACTERS: ${characterList}
AGE GROUP: ${ageGroup} years old
MORAL/LESSON: ${moral || 'A positive life lesson'}
${customIdeas ? `ADDITIONAL IDEAS: ${customIdeas}` : ''}

REQUIREMENTS:
1. Create a story with exactly 7 pages (including title page)
2. Use vocabulary appropriate for ${ageGroup} year olds: ${ageSettings.vocabulary}
3. Sentence complexity: ${ageSettings.complexity}
4. Each page should be ${ageSettings.wordCount} words
5. Include engaging dialogue and descriptive language
6. Make it fun, engaging, and educational
7. End with a clear resolution that reinforces the moral

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
[PAGE 1 - TITLE]
Title: [Story Title]
Text: [Title page text, author credit]
Illustration: [Description of cover illustration]

[PAGE 2]
Text: [Story text for page 2]
Illustration: [Description of what should be illustrated]

[PAGE 3]
Text: [Story text for page 3]
Illustration: [Description of what should be illustrated]

Continue this format for all 7 pages. Make sure the story has a clear beginning, middle, and end.`;
  }

  parseStoryIntoPages(storyContent) {
    const pages = [];
    const pageRegex = /\[PAGE (\d+)(?:\s*-\s*([^\]]+))?\]([\s\S]*?)(?=\[PAGE|\$)/gi;
    let match;
    
    while ((match = pageRegex.exec(storyContent)) !== null) {
      const pageNumber = parseInt(match[1]);
      const pageTitle = match[2] || '';
      const content = match[3].trim();
      
      // Extract text and illustration description
      const textMatch = content.match(/Text:\s*([\s\S]*?)(?=Illustration:|$)/i);
      const illustrationMatch = content.match(/Illustration:\s*([\s\S]*?)$/i);
      
      pages.push({
        pageNumber,
        title: pageTitle,
        text: textMatch ? textMatch[1].trim() : content,
        illustrationPrompt: illustrationMatch ? illustrationMatch[1].trim() : ''
      });
    }
    
    // If parsing fails, create a simple structure
    if (pages.length === 0) {
      const lines = storyContent.split('\n').filter(line => line.trim());
      const pageSize = Math.ceil(lines.length / 7);
      
      for (let i = 0; i < 7; i++) {
        const start = i * pageSize;
        const end = Math.min((i + 1) * pageSize, lines.length);
        const pageText = lines.slice(start, end).join(' ');
        
        pages.push({
          pageNumber: i + 1,
          title: i === 0 ? 'Title Page' : `Page ${i + 1}`,
          text: pageText || `Page ${i + 1} content`,
          illustrationPrompt: `Illustration for: ${pageText.substring(0, 100)}`
        });
      }
    }
    
    return pages;
  }

  getAgeSettings(ageGroup) {
    const settings = {
      '3-5': {
        vocabulary: 'simple, common words',
        complexity: 'short, simple sentences',
        wordCount: '20-40',
        themes: ['friendship', 'sharing', 'colors', 'animals', 'family']
      },
      '6-8': {
        vocabulary: 'common words with some new vocabulary',
        complexity: 'medium-length sentences with basic conjunctions',
        wordCount: '40-80',
        themes: ['adventure', 'problem-solving', 'emotions', 'nature', 'imagination']
      },
      '9-12': {
        vocabulary: 'varied vocabulary with context clues',
        complexity: 'complex sentences with multiple clauses',
        wordCount: '80-150',
        themes: ['mystery', 'courage', 'responsibility', 'discovery', 'friendship challenges']
      }
    };
    
    return settings[ageGroup] || settings['6-8'];
  }

  async saveGeneratedImage(imageData, fileName) {
    if (!imageData || !imageData.data) return null;
    
    const buffer = Buffer.from(imageData.data, 'base64');
    const extension = mime.getExtension(imageData.mimeType) || 'png';
    const fullFileName = `${fileName}.${extension}`;
    const filePath = path.join(process.cwd(), 'client', 'assets', 'generated', fullFileName);
    
    try {
      await writeFile(filePath, buffer);
      return `/assets/generated/${fullFileName}`;
    } catch (error) {
      console.error('Error saving image:', error);
      return null;
    }
  }
}

export default GeminiStoryService;
