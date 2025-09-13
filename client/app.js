// Main Application JavaScript
class StoryGenerator {
    constructor() {
        this.currentStory = null;
        this.currentPageIndex = 0;
        this.storyPages = [];
        this.themes = [];
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadThemes();
    }
    
    initializeElements() {
        // Form elements
        this.storyForm = document.getElementById('createStoryForm');
        this.themeGrid = document.getElementById('themeGrid');
        this.charactersContainer = document.getElementById('charactersContainer');
        this.addCharacterBtn = document.getElementById('addCharacterBtn');
        
        // Loading elements
        this.loadingContainer = document.getElementById('loadingContainer');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.progressFill = document.getElementById('progressFill');
        
        // Book preview elements
        this.bookPreview = document.getElementById('bookPreview');
        this.leftPage = document.getElementById('leftPage');
        this.rightPage = document.getElementById('rightPage');
        this.leftIllustration = document.getElementById('leftIllustration');
        this.rightIllustration = document.getElementById('rightIllustration');
        this.leftText = document.getElementById('leftText');
        this.rightText = document.getElementById('rightText');
        this.leftPageNumber = document.getElementById('leftPageNumber');
        this.rightPageNumber = document.getElementById('rightPageNumber');
        this.pageIndicator = document.getElementById('pageIndicator');
        
        // Navigation buttons
        this.prevPageBtn = document.getElementById('prevPageBtn');
        this.nextPageBtn = document.getElementById('nextPageBtn');
        
        // Action buttons
        this.downloadPdfBtn = document.getElementById('downloadPdfBtn');
        this.shareStoryBtn = document.getElementById('shareStoryBtn');
        this.newStoryBtn = document.getElementById('newStoryBtn');
        this.regeneratePageBtn = document.getElementById('regeneratePageBtn');
        
        // Error elements
        this.errorContainer = document.getElementById('errorContainer');
        this.errorMessage = document.getElementById('errorMessage');
        this.tryAgainBtn = document.getElementById('tryAgainBtn');
        
        // Form container
        this.storyFormContainer = document.getElementById('storyForm');
    }
    
    attachEventListeners() {
        // Form submission
        this.storyForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Add character button
        this.addCharacterBtn.addEventListener('click', () => this.addCharacterInput());
        
        // Navigation buttons
        this.prevPageBtn.addEventListener('click', () => this.previousPage());
        this.nextPageBtn.addEventListener('click', () => this.nextPage());
        
        // Action buttons
        this.downloadPdfBtn.addEventListener('click', () => this.downloadPdf());
        this.shareStoryBtn.addEventListener('click', () => this.shareStory());
        this.newStoryBtn.addEventListener('click', () => this.createNewStory());
        this.regeneratePageBtn.addEventListener('click', () => this.regeneratePage());
        
        // Error retry button
        this.tryAgainBtn.addEventListener('click', () => this.hideError());
        
        // Initial character remove button
        this.attachCharacterRemoveListeners();
    }
    
    async loadThemes() {
        try {
            const response = await fetch('/api/story/themes');
            const data = await response.json();
            this.themes = data.themes;
            this.renderThemes();
        } catch (error) {
            console.error('Failed to load themes:', error);
            // Use default themes as fallback
            this.themes = [
                { value: 'adventure', label: 'Adventure', emoji: '🗺️' },
                { value: 'friendship', label: 'Friendship', emoji: '🤝' },
                { value: 'magic', label: 'Magic & Fantasy', emoji: '✨' },
                { value: 'animals', label: 'Animals', emoji: '🦁' },
                { value: 'space', label: 'Space', emoji: '🚀' },
                { value: 'underwater', label: 'Underwater', emoji: '🐠' },
                { value: 'dinosaurs', label: 'Dinosaurs', emoji: '🦕' },
                { value: 'fairy-tale', label: 'Fairy Tale', emoji: '🏰' }
            ];
            this.renderThemes();
        }
    }
    
    renderThemes() {
        this.themeGrid.innerHTML = this.themes.map((theme, index) => `
            <label class="theme-option">
                <input type="radio" name="theme" value="${theme.value}" ${index === 0 ? 'checked' : ''} required>
                <div class="theme-card">
                    <span class="theme-emoji">${theme.emoji}</span>
                    <span class="theme-name">${theme.label}</span>
                </div>
            </label>
        `).join('');
    }
    
    addCharacterInput() {
        const characterDiv = document.createElement('div');
        characterDiv.className = 'character-input';
        characterDiv.innerHTML = `
            <input type="text" placeholder="Character name" class="character-name" required>
            <input type="text" placeholder="Character description" class="character-description" required>
            <button type="button" class="remove-character-btn">❌</button>
        `;
        
        this.charactersContainer.appendChild(characterDiv);
        this.attachCharacterRemoveListeners();
        this.updateRemoveButtonVisibility();
    }
    
    attachCharacterRemoveListeners() {
        const removeButtons = document.querySelectorAll('.remove-character-btn');
        removeButtons.forEach(btn => {
            btn.removeEventListener('click', this.removeCharacterHandler);
            btn.addEventListener('click', this.removeCharacterHandler);
        });
    }
    
    removeCharacterHandler = (e) => {
        const characterDiv = e.target.closest('.character-input');
        if (characterDiv) {
            characterDiv.remove();
            this.updateRemoveButtonVisibility();
        }
    }
    
    updateRemoveButtonVisibility() {
        const characterInputs = document.querySelectorAll('.character-input');
        const removeButtons = document.querySelectorAll('.remove-character-btn');
        
        removeButtons.forEach(btn => {
            btn.style.display = characterInputs.length > 1 ? 'block' : 'none';
        });
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        // Collect form data
        const formData = new FormData(this.storyForm);
        const theme = formData.get('theme');
        const ageGroup = formData.get('ageGroup');
        const moral = formData.get('moral');
        const customIdeas = formData.get('customIdeas');
        
        // Collect characters
        const characters = [];
        const characterInputs = document.querySelectorAll('.character-input');
        characterInputs.forEach(input => {
            const name = input.querySelector('.character-name').value;
            const description = input.querySelector('.character-description').value;
            if (name && description) {
                characters.push({ name, description });
            }
        });
        
        if (characters.length === 0) {
            this.showToast('Please add at least one character', 'error');
            return;
        }
        
        // Start story generation
        this.showLoading();
        this.storyPages = [];
        this.currentPageIndex = 0;
        
        try {
            const response = await fetch('/api/story/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    theme,
                    characters,
                    moral,
                    ageGroup,
                    customIdeas
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate story');
            }
            
            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data.trim()) {
                            this.handleStreamData(JSON.parse(data));
                        }
                    }
                }
            }
            
        } catch (error) {
            console.error('Story generation error:', error);
            this.showError(error.message);
        }
    }
    
    handleStreamData(data) {
        switch (data.type) {
            case 'status':
                this.updateLoadingMessage(data.message);
                break;
                
            case 'page':
                this.storyPages.push(data.content);
                this.updateProgress((data.pageNumber / data.totalPages) * 100);
                this.updateLoadingMessage(`Creating page ${data.pageNumber} of ${data.totalPages}...`);
                break;
                
            case 'complete':
                this.currentStory = {
                    id: data.storyId,
                    pages: this.storyPages
                };
                this.hideLoading();
                this.showBookPreview();
                this.showToast('Your magical story is ready! 🎉', 'success');
                break;
                
            case 'error':
                this.showError(data.message);
                break;
        }
    }
    
    updateLoadingMessage(message) {
        this.loadingMessage.textContent = message;
    }
    
    updateProgress(percentage) {
        this.progressFill.style.width = `${percentage}%`;
    }
    
    showLoading() {
        this.storyFormContainer.style.display = 'none';
        this.bookPreview.style.display = 'none';
        this.errorContainer.style.display = 'none';
        this.loadingContainer.style.display = 'block';
        this.progressFill.style.width = '0%';
    }
    
    hideLoading() {
        this.loadingContainer.style.display = 'none';
    }
    
    showBookPreview() {
        this.bookPreview.style.display = 'block';
        this.displayCurrentPages();
    }
    
    displayCurrentPages() {
        if (!this.storyPages || this.storyPages.length === 0) return;
        
        const leftPageIndex = this.currentPageIndex * 2;
        const rightPageIndex = leftPageIndex + 1;
        
        // Display left page
        if (leftPageIndex < this.storyPages.length) {
            this.displayPage(this.storyPages[leftPageIndex], 'left');
        } else {
            this.clearPage('left');
        }
        
        // Display right page
        if (rightPageIndex < this.storyPages.length) {
            this.displayPage(this.storyPages[rightPageIndex], 'right');
        } else {
            this.clearPage('right');
        }
        
        // Update page indicator
        const currentPage = Math.min(leftPageIndex + 1, this.storyPages.length);
        this.pageIndicator.textContent = `Page ${currentPage}-${Math.min(currentPage + 1, this.storyPages.length)} of ${this.storyPages.length}`;
        
        // Update navigation buttons
        this.prevPageBtn.disabled = this.currentPageIndex === 0;
        this.nextPageBtn.disabled = rightPageIndex >= this.storyPages.length - 1;
    }
    
    displayPage(page, side) {
        const illustration = side === 'left' ? this.leftIllustration : this.rightIllustration;
        const text = side === 'left' ? this.leftText : this.rightText;
        const pageNumber = side === 'left' ? this.leftPageNumber : this.rightPageNumber;
        
        // Display illustration
        if (page.illustration && page.illustration.data) {
            const img = document.createElement('img');
            img.src = `data:${page.illustration.mimeType};base64,${page.illustration.data}`;
            img.alt = page.illustrationPrompt || 'Story illustration';
            illustration.innerHTML = '';
            illustration.appendChild(img);
        } else {
            illustration.innerHTML = `
                <div style="text-align: center; color: #9CA3AF;">
                    <span style="font-size: 3rem;">🎨</span>
                    <p>Illustration coming soon...</p>
                </div>
            `;
        }
        
        // Display text
        text.textContent = page.text;
        
        // Display page number
        pageNumber.textContent = `Page ${page.pageNumber}`;
    }
    
    clearPage(side) {
        const illustration = side === 'left' ? this.leftIllustration : this.rightIllustration;
        const text = side === 'left' ? this.leftText : this.rightText;
        const pageNumber = side === 'left' ? this.leftPageNumber : this.rightPageNumber;
        
        illustration.innerHTML = '';
        text.textContent = '';
        pageNumber.textContent = '';
    }
    
    previousPage() {
        if (this.currentPageIndex > 0) {
            this.currentPageIndex--;
            this.addPageTurnAnimation('right');
            setTimeout(() => {
                this.displayCurrentPages();
            }, 300);
        }
    }
    
    nextPage() {
        const maxPageIndex = Math.ceil(this.storyPages.length / 2) - 1;
        if (this.currentPageIndex < maxPageIndex) {
            this.currentPageIndex++;
            this.addPageTurnAnimation('left');
            setTimeout(() => {
                this.displayCurrentPages();
            }, 300);
        }
    }
    
    addPageTurnAnimation(direction) {
        const book = document.getElementById('bookContainer');
        book.classList.add(`page-turn-${direction}`);
        setTimeout(() => {
            book.classList.remove(`page-turn-${direction}`);
        }, 600);
    }
    
    async downloadPdf() {
        if (!this.currentStory) return;
        
        try {
            this.showToast('Generating PDF...', 'info');
            
            const response = await fetch('/api/story/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    storyId: this.currentStory.id
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `magical-story-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showToast('PDF downloaded successfully! 📥', 'success');
        } catch (error) {
            console.error('PDF download error:', error);
            this.showToast('Failed to download PDF', 'error');
        }
    }
    
    async shareStory() {
        if (!this.currentStory) return;
        
        const shareUrl = `${window.location.origin}/story/${this.currentStory.id}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Magical Story',
                    text: 'Check out this amazing story I created!',
                    url: shareUrl
                });
                this.showToast('Story shared successfully! 🔗', 'success');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    this.copyToClipboard(shareUrl);
                }
            }
        } else {
            this.copyToClipboard(shareUrl);
        }
    }
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Link copied to clipboard! 📋', 'success');
        }).catch(() => {
            this.showToast('Failed to copy link', 'error');
        });
    }
    
    createNewStory() {
        this.currentStory = null;
        this.storyPages = [];
        this.currentPageIndex = 0;
        this.bookPreview.style.display = 'none';
        this.storyFormContainer.style.display = 'block';
        this.storyForm.reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    async regeneratePage() {
        if (!this.currentStory) return;
        
        const currentPageNumber = this.currentPageIndex * 2 + 1;
        
        try {
            this.showToast('Regenerating page...', 'info');
            
            const response = await fetch('/api/story/regenerate-page', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    storyId: this.currentStory.id,
                    pageNumber: currentPageNumber
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to regenerate page');
            }
            
            const data = await response.json();
            
            if (data.success && data.page) {
                const pageIndex = this.storyPages.findIndex(p => p.pageNumber === currentPageNumber);
                if (pageIndex !== -1) {
                    this.storyPages[pageIndex] = data.page;
                    this.displayCurrentPages();
                    this.showToast('Page regenerated successfully! 🔄', 'success');
                }
            }
        } catch (error) {
            console.error('Page regeneration error:', error);
            this.showToast('Failed to regenerate page', 'error');
        }
    }
    
    showError(message) {
        this.hideLoading();
        this.storyFormContainer.style.display = 'none';
        this.bookPreview.style.display = 'none';
        this.errorContainer.style.display = 'block';
        this.errorMessage.textContent = message || 'An unexpected error occurred';
    }
    
    hideError() {
        this.errorContainer.style.display = 'none';
        this.storyFormContainer.style.display = 'block';
    }
    
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        }[type] || 'ℹ️';
        
        toast.innerHTML = `
            <span>${icon}</span>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new StoryGenerator();
});
