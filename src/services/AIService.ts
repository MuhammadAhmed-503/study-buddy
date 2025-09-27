export interface AIResponse {
  success: boolean;
  result?: string;
  error?: string;
}

export interface FlashcardPair {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export class AIService {
  private static readonly API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  private static readonly BASE_URL = 'https://api-inference.huggingface.co/models';

  static async generateSummary(text: string): Promise<AIResponse> {
    try {
      // If no API key, use a fallback local summary
      if (!this.API_KEY || this.API_KEY === 'hf_your_api_key_here') {
        return {
          success: true,
          result: this.generateLocalSummary(text)
        };
      }

      const response = await fetch(`${this.BASE_URL}/facebook/bart-large-cnn`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text.substring(0, 1024), // Limit input length
          parameters: {
            max_length: 150,
            min_length: 50,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return {
        success: true,
        result: result[0]?.summary_text || this.generateLocalSummary(text)
      };
    } catch (error) {
      console.error('AI Summary error:', error);
      return {
        success: true, // Fallback to local summary
        result: this.generateLocalSummary(text)
      };
    }
  }

  static async generateFlashcards(text: string, count: number = 5): Promise<{ success: boolean; flashcards?: FlashcardPair[]; error?: string }> {
    try {
      // Try Hugging Face API for better quality if available
      if (this.API_KEY && this.API_KEY !== 'hf_your_api_key_here') {
        try {
          const flashcards = await this.generateAIFlashcards(text, count);
          return {
            success: true,
            flashcards
          };
        } catch (error) {
          console.log('Falling back to local flashcard generation');
        }
      }
      
      // Enhanced local flashcard generation
      const flashcards = this.generateEnhancedLocalFlashcards(text, count);
      
      return {
        success: true,
        flashcards
      };
    } catch (error) {
      console.error('AI Flashcards error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate flashcards'
      };
    }
  }

  static async generateQuiz(text: string, count: number = 5): Promise<{ success: boolean; questions?: QuizQuestion[]; error?: string }> {
    try {
      // Try Hugging Face API for better quality if available
      if (this.API_KEY && this.API_KEY !== 'hf_your_api_key_here') {
        try {
          const questions = await this.generateAIQuiz(text, count);
          return {
            success: true,
            questions
          };
        } catch (error) {
          console.log('Falling back to enhanced local quiz generation');
        }
      }
      
      // Enhanced local quiz generation with better quality
      const questions = this.generateEnhancedLocalQuiz(text, count);
      
      return {
        success: true,
        questions
      };
    } catch (error) {
      console.error('AI Quiz error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate quiz'
      };
    }
  }

  static async generateChatResponse(message: string, context?: string): Promise<AIResponse> {
    try {
      // If no API key, use a fallback response
      if (!this.API_KEY || this.API_KEY === 'hf_your_api_key_here') {
        return {
          success: true,
          result: this.generateLocalChatResponse(message, context)
        };
      }

      const prompt = context 
        ? `Context: ${context.substring(0, 500)}\n\nUser: ${message}\nAI:`
        : `User: ${message}\nAI:`;

      const response = await fetch(`${this.BASE_URL}/microsoft/DialoGPT-large`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 200,
            temperature: 0.7,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return {
        success: true,
        result: result[0]?.generated_text || this.generateLocalChatResponse(message, context)
      };
    } catch (error) {
      console.error('AI Chat error:', error);
      return {
        success: true, // Fallback to local response
        result: this.generateLocalChatResponse(message, context)
      };
    }
  }

  // Fallback local implementations
  private static generateLocalSummary(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyWords = ['important', 'key', 'main', 'primary', 'essential', 'crucial', 'significant'];
    
    // Find sentences with key words or take first few sentences
    const importantSentences = sentences
      .filter(sentence => 
        keyWords.some(word => sentence.toLowerCase().includes(word))
      )
      .slice(0, 3);
    
    if (importantSentences.length === 0) {
      return sentences.slice(0, 3).join('. ') + '.';
    }
    
    return importantSentences.join('. ') + '.';
  }

  private static generateEnhancedLocalFlashcards(text: string, count: number): FlashcardPair[] {
    const flashcards: FlashcardPair[] = [];
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    
    // Extract key concepts and definitions
    const concepts = this.extractKeyConceptsFromText(text);
    
    for (let i = 0; i < Math.min(count, concepts.length); i++) {
      const concept = concepts[i];
      
      // Generate different types of flashcards
      const cardTypes = ['definition', 'context', 'application', 'comparison'];
      const cardType = cardTypes[i % cardTypes.length];
      
      switch (cardType) {
        case 'definition':
          flashcards.push({
            question: `What is ${concept.term}?`,
            answer: concept.definition
          });
          break;
        case 'context':
          flashcards.push({
            question: `In what context is "${concept.term}" discussed?`,
            answer: concept.context
          });
          break;
        case 'application':
          flashcards.push({
            question: `How is ${concept.term} applied or used?`,
            answer: concept.application || concept.definition
          });
          break;
        case 'comparison':
          flashcards.push({
            question: `What are the key characteristics of ${concept.term}?`,
            answer: concept.characteristics || concept.definition
          });
          break;
      }
    }
    
    return flashcards;
  }
  
  private static extractKeyConceptsFromText(text: string): Array<{
    term: string;
    definition: string;
    context: string;
    application?: string;
    characteristics?: string;
  }> {
    const concepts: Array<{
      term: string;
      definition: string;
      context: string;
      application?: string;
      characteristics?: string;
    }> = [];
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30);
    
    sentences.forEach((sentence, index) => {
      const trimmedSentence = sentence.trim();
      
      // Look for definition patterns
      const definitionPatterns = [
        /(.+?)\s+(?:is|are|means?|refers?\s+to|defined\s+as)\s+(.+)/i,
        /(.+?):\s*(.+)/,
        /The\s+(.+?)\s+(?:is|are)\s+(.+)/i
      ];
      
      for (const pattern of definitionPatterns) {
        const match = trimmedSentence.match(pattern);
        if (match && match[1] && match[2]) {
          const term = match[1].trim().replace(/^(the|a|an)\s+/i, '');
          const definition = match[2].trim();
          
          if (term.length > 2 && term.length < 50 && definition.length > 10) {
            // Find context from surrounding sentences
            const contextStart = Math.max(0, index - 1);
            const contextEnd = Math.min(sentences.length, index + 2);
            const context = sentences.slice(contextStart, contextEnd).join('. ').trim();
            
            concepts.push({
              term,
              definition,
              context: context.substring(0, 200) + (context.length > 200 ? '...' : ''),
              characteristics: `Key aspects: ${definition.substring(0, 100)}...`
            });
            break;
          }
        }
      }
    });
    
    // If no formal definitions found, extract important terms and create flashcards
    if (concepts.length === 0) {
      const importantWords = this.extractImportantTerms(text);
      importantWords.forEach((word, index) => {
        const wordSentences = sentences.filter(s => s.toLowerCase().includes(word.toLowerCase()));
        if (wordSentences.length > 0) {
          concepts.push({
            term: word,
            definition: wordSentences[0].trim(),
            context: wordSentences.slice(0, 2).join('. ')
          });
        }
      });
    }
    
    return concepts.slice(0, 10); // Limit to prevent too many flashcards
  }
  
  private static extractImportantTerms(text: string): string[] {
    const words = text.split(/\s+/);
    const termFreq = new Map<string, number>();
    
    // Count frequency of meaningful words
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      if (cleanWord.length > 4 && 
          !/^(that|this|with|from|they|them|were|been|have|will|would|could|should|there|where|when|what|which)$/.test(cleanWord)) {
        termFreq.set(cleanWord, (termFreq.get(cleanWord) || 0) + 1);
      }
    });
    
    // Sort by frequency and take top terms
    return Array.from(termFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term]) => term);
  }
  
  private static async generateAIFlashcards(text: string, count: number): Promise<FlashcardPair[]> {
    const prompt = `Create ${count} high-quality flashcards from the following text. Each flashcard should have a clear question and comprehensive answer. Focus on key concepts, definitions, and important information. Return only a JSON array with this structure:

[
  {
    "question": "Clear, specific question",
    "answer": "Comprehensive, accurate answer"
  }
]

Text: ${text.substring(0, 2000)}`;

    const response = await fetch(`${this.BASE_URL}/microsoft/DialoGPT-large`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.7,
          return_full_text: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const generatedText = result[0]?.generated_text || '';
    
    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const flashcards = JSON.parse(jsonMatch[0]);
        return flashcards.slice(0, count);
      } catch (parseError) {
        console.warn('Failed to parse AI flashcard response, using fallback');
        throw new Error('Invalid AI response format');
      }
    }
    
    throw new Error('No valid flashcards in AI response');
  }
  
  private static generateLocalFlashcards(text: string, count: number): FlashcardPair[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const flashcards: FlashcardPair[] = [];
    
    const questionStarters = [
      'What is',
      'How does',
      'Why is',
      'When did',
      'Who was',
      'Where is'
    ];

    for (let i = 0; i < Math.min(count, sentences.length); i++) {
      const sentence = sentences[i].trim();
      const starter = questionStarters[i % questionStarters.length];
      
      flashcards.push({
        question: `${starter} related to: ${sentence.substring(0, 50)}...?`,
        answer: sentence
      });
    }

    return flashcards;
  }

  private static generateEnhancedLocalQuiz(text: string, count: number): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 100);
    
    for (let i = 0; i < Math.min(count, paragraphs.length); i++) {
      const paragraph = paragraphs[i].trim();
      const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      if (sentences.length > 0) {
        const sentence = sentences[Math.floor(sentences.length / 2)].trim();
        
        // Extract key concepts and entities
        const words = sentence.split(/\s+/).filter(w => 
          w.length > 3 && 
          !/^(the|and|but|for|are|was|were|been|have|has|will|would|could|should)$/i.test(w)
        );
        
        if (words.length > 3) {
          // Find the most important word (usually nouns or verbs)
          const targetWord = this.findKeyWord(words, sentence);
          const questionTypes = ['fill_blank', 'definition', 'context'];
          const questionType = questionTypes[i % questionTypes.length];
          
          let question: QuizQuestion;
          
          switch (questionType) {
            case 'fill_blank':
              question = this.generateFillBlankQuestion(sentence, targetWord, i);
              break;
            case 'definition':
              question = this.generateDefinitionQuestion(paragraph, targetWord, i);
              break;
            case 'context':
              question = this.generateContextQuestion(paragraph, sentence, i);
              break;
            default:
              question = this.generateFillBlankQuestion(sentence, targetWord, i);
          }
          
          questions.push(question);
        }
      }
    }
    
    return questions;
  }
  
  private static findKeyWord(words: string[], sentence: string): string {
    // Prioritize capitalized words (proper nouns) and longer words
    const scoredWords = words.map(word => ({
      word: word.replace(/[^\w]/g, ''),
      score: word.length + (word[0] === word[0].toUpperCase() ? 5 : 0)
    }));
    
    scoredWords.sort((a, b) => b.score - a.score);
    return scoredWords[0]?.word || words[0];
  }
  
  private static generateFillBlankQuestion(sentence: string, targetWord: string, index: number): QuizQuestion {
    const questionText = sentence.replace(new RegExp(`\\b${targetWord}\\b`, 'i'), '_____');
    
    // Generate more realistic distractors
    const distractors = [
      targetWord.toLowerCase() === targetWord ? targetWord.toUpperCase() : targetWord.toLowerCase(),
      this.generateSimilarWord(targetWord),
      this.generateRhymingWord(targetWord)
    ].filter(d => d !== targetWord);
    
    const options = [targetWord, ...distractors.slice(0, 3)];
    this.shuffleArray(options);
    const correctIndex = options.indexOf(targetWord);
    
    return {
      id: `q${index + 1}`,
      question: `Fill in the blank: ${questionText}`,
      options,
      correct: correctIndex,
      explanation: `The correct answer is "${targetWord}" as it fits the context of the sentence.`
    };
  }
  
  private static generateDefinitionQuestion(paragraph: string, targetWord: string, index: number): QuizQuestion {
    const context = paragraph.substring(0, 150) + '...';
    
    const distractors = [
      `A type of ${targetWord.toLowerCase()}`,
      `The opposite of ${targetWord.toLowerCase()}`,
      `A synonym for ${targetWord.toLowerCase()}`
    ];
    
    const options = [`The concept mentioned in the given context`, ...distractors];
    this.shuffleArray(options);
    const correctIndex = options.indexOf(`The concept mentioned in the given context`);
    
    return {
      id: `q${index + 1}`,
      question: `Based on the context: "${context}", what does "${targetWord}" refer to?`,
      options,
      correct: correctIndex,
      explanation: `"${targetWord}" is best understood from its usage in the given context.`
    };
  }
  
  private static generateContextQuestion(paragraph: string, sentence: string, index: number): QuizQuestion {
    const mainIdea = sentence.length > 80 ? sentence.substring(0, 80) + '...' : sentence;
    
    const distractors = [
      'This information is not mentioned in the text',
      'The text suggests the opposite meaning',
      'This is partially correct but not the main point'
    ];
    
    const options = [mainIdea, ...distractors];
    this.shuffleArray(options);
    const correctIndex = options.indexOf(mainIdea);
    
    return {
      id: `q${index + 1}`,
      question: `Which statement best represents the main idea from the given text?`,
      options,
      correct: correctIndex,
      explanation: `This statement directly reflects the content and main idea presented in the text.`
    };
  }
  
  private static generateSimilarWord(word: string): string {
    const variations = [
      word + 's',
      word + 'ing',
      word + 'ed',
      word.slice(0, -1) + 'y',
      word + 'ly'
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  }
  
  private static generateRhymingWord(word: string): string {
    const rhymes: { [key: string]: string[] } = {
      'tion': ['nation', 'station', 'creation'],
      'ing': ['thing', 'ring', 'sing'],
      'ed': ['red', 'bed', 'led'],
      'ly': ['my', 'by', 'try']
    };
    
    for (const ending in rhymes) {
      if (word.endsWith(ending)) {
        const options = rhymes[ending].filter(r => r !== word);
        if (options.length > 0) {
          return options[Math.floor(Math.random() * options.length)];
        }
      }
    }
    
    return word.split('').reverse().join('').substring(0, word.length);
  }
  
  private static async generateAIQuiz(text: string, count: number): Promise<QuizQuestion[]> {
    const prompt = `Generate ${count} high-quality multiple-choice quiz questions based on the following text. Each question should test comprehension, analysis, or application of the content. Return only a JSON array with this exact structure:

[
  {
    "id": "q1",
    "question": "What is the main concept discussed?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Explanation of why this is correct"
  }
]

Text: ${text.substring(0, 2000)}`;

    const response = await fetch(`${this.BASE_URL}/microsoft/DialoGPT-large`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 1500,
          temperature: 0.7,
          return_full_text: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const generatedText = result[0]?.generated_text || '';
    
    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const questions = JSON.parse(jsonMatch[0]);
        return questions.slice(0, count);
      } catch (parseError) {
        console.warn('Failed to parse AI quiz response, using fallback');
        throw new Error('Invalid AI response format');
      }
    }
    
    throw new Error('No valid quiz questions in AI response');
  }
  
  private static generateLocalQuiz(text: string, count: number): QuizQuestion[] {
    // Keep the old method as a simple fallback
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const questions: QuizQuestion[] = [];
    
    for (let i = 0; i < Math.min(count, Math.floor(sentences.length / 2)); i++) {
      const sentence = sentences[i * 2].trim();
      const words = sentence.split(' ').filter(w => w.length > 3);
      
      if (words.length > 5) {
        const targetWord = words[Math.floor(words.length / 2)];
        const questionText = sentence.replace(targetWord, '_____');
        
        const distractors = [
          `${targetWord.slice(0, -2)}ed`,
          `${targetWord}s`,
          targetWord.split('').reverse().join('')
        ].slice(0, 3);
        
        const options = [targetWord, ...distractors].sort(() => Math.random() - 0.5);
        const correctIndex = options.indexOf(targetWord);
        
        questions.push({
          id: `q${i + 1}`,
          question: `Fill in the blank: ${questionText}`,
          options,
          correct: correctIndex,
          explanation: `The correct answer is "${targetWord}" based on the context.`
        });
      }
    }
    
    return questions;
  }

  private static shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private static generateLocalChatResponse(message: string, context?: string): string {
    const lowerMessage = message.toLowerCase();
    
    // If no context available, provide generic responses
    if (!context) {
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return "Hello! I'm your AI Study Buddy. Upload some study materials and I'll be able to answer specific questions about your content.";
      }
      return "I'd love to help you study! Please upload some documents first so I can provide personalized answers based on your study material.";
    }

    // Analyze the user's question against the context
    const questionKeywords = this.extractQuestionKeywords(message);
    const relevantContent = this.findRelevantContent(context, questionKeywords);
    
    // Handle different types of questions
    if (lowerMessage.includes('what is') || lowerMessage.includes('define') || lowerMessage.includes('explain')) {
      const term = this.extractTermFromQuestion(message);
      if (term && relevantContent.includes(term.toLowerCase())) {
        const definition = this.extractDefinitionFromContext(relevantContent, term);
        return definition || `Based on your notes, "${term}" is mentioned in the context of: ${relevantContent.substring(0, 300)}...`;
      }
      return `I found this relevant information in your notes: ${relevantContent.substring(0, 400)}...`;
    }
    
    if (lowerMessage.includes('how') || lowerMessage.includes('why') || lowerMessage.includes('when')) {
      return `Based on your study material: ${relevantContent.substring(0, 400)}... ${this.generateFollowUpSuggestion(questionKeywords)}`;
    }
    
    if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
      return `Here's a summary of the relevant content from your notes: ${this.createSmartSummary(relevantContent)}`;
    }
    
    if (lowerMessage.includes('example') || lowerMessage.includes('application')) {
      return `From your study material, here are the key points about ${questionKeywords.join(', ')}: ${relevantContent.substring(0, 350)}...`;
    }
    
    // Handle physics-specific questions (based on your refraction example)
    if (this.containsPhysicsTerms(message)) {
      return this.handlePhysicsQuestion(message, relevantContent);
    }
    
    // Default intelligent response
    return `I found relevant information about "${questionKeywords.join(', ')}" in your notes: ${relevantContent.substring(0, 300)}... Would you like me to elaborate on any specific aspect?`;
  }
  
  private static extractQuestionKeywords(message: string): string[] {
    const words = message.toLowerCase().split(/\s+/);
    const stopWords = new Set(['what', 'is', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'can', 'could', 'should', 'would', 'how', 'why', 'when', 'where']);
    
    return words
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 5); // Take top 5 keywords
  }
  
  private static findRelevantContent(context: string, keywords: string[]): string {
    const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const scoredSentences = sentences.map(sentence => ({
      sentence: sentence.trim(),
      score: keywords.reduce((score, keyword) => {
        const regex = new RegExp(keyword, 'gi');
        const matches = sentence.match(regex);
        return score + (matches ? matches.length : 0);
      }, 0)
    }));
    
    // Sort by relevance and take top sentences
    const relevantSentences = scoredSentences
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.sentence);
    
    return relevantSentences.length > 0 
      ? relevantSentences.join('. ')
      : context.substring(0, 500); // Fallback to first part of context
  }
  
  private static extractTermFromQuestion(message: string): string | null {
    // Pattern to extract term from "What is X?" type questions
    const patterns = [
      /what\s+is\s+([^?]+)/i,
      /define\s+([^?]+)/i,
      /explain\s+([^?]+)/i,
      /what\s+are\s+([^?]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }
  
  private static extractDefinitionFromContext(context: string, term: string): string | null {
    const sentences = context.split(/[.!?]+/);
    const termLower = term.toLowerCase();
    
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      if (sentenceLower.includes(termLower) && 
          (sentenceLower.includes(' is ') || sentenceLower.includes(' refers to ') || sentenceLower.includes(' means '))) {
        return sentence.trim();
      }
    }
    return null;
  }
  
  private static createSmartSummary(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyWords = ['important', 'key', 'main', 'primary', 'essential', 'crucial', 'significant', 'fundamental'];
    
    const importantSentences = sentences.filter(sentence =>
      keyWords.some(word => sentence.toLowerCase().includes(word))
    ).slice(0, 2);
    
    if (importantSentences.length > 0) {
      return importantSentences.join('. ') + '.';
    }
    
    return sentences.slice(0, 2).join('. ') + '.';
  }
  
  private static generateFollowUpSuggestion(keywords: string[]): string {
    return keywords.length > 0 
      ? `Would you like me to explain more about ${keywords[0]}?`
      : "Feel free to ask more specific questions about your study material.";
  }
  
  private static containsPhysicsTerms(message: string): boolean {
    const physicsTerms = ['refraction', 'reflection', 'light', 'wave', 'wavelength', 'frequency', 'interference', 'diffraction', 'optics', 'physics', 'phenomenon', 'rainbow', 'prism', 'lens', 'index'];
    return physicsTerms.some(term => message.toLowerCase().includes(term));
  }
  
  private static handlePhysicsQuestion(message: string, context: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('refraction')) {
      const refractionInfo = this.findRelevantContent(context, ['refraction', 'light', 'wave']);
      return `Refraction is the bending of light as it passes through different media. ${refractionInfo ? 'From your notes: ' + refractionInfo : 'It occurs because light travels at different speeds in different materials, causing the light ray to change direction at the boundary between two media.'}`;
    }
    
    if (lowerMessage.includes('rainbow')) {
      return "A rainbow forms through refraction and dispersion of white light. When sunlight enters water droplets, it refracts, separates into different colors (dispersion), reflects off the back of the droplet, and refracts again as it exits, creating the spectrum of colors we see.";
    }
    
    if (lowerMessage.includes('interference') || lowerMessage.includes('double slit')) {
      return "Young's double slit experiment demonstrates wave interference. When coherent light passes through two parallel slits, it creates an interference pattern of bright and dark fringes, proving the wave nature of light.";
    }
    
    return `Based on your physics study material: ${context.substring(0, 300)}...`;
  }
}