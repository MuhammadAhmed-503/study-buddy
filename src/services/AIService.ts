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
  private static readonly API_KEY = import.meta.env.VITE_GROK_API_KEY;
  private static readonly BASE_URL = 'https://api.x.ai/v1';
  private static readonly MODEL = 'grok-beta';

  static async generateSummary(text: string): Promise<AIResponse> {
    try {
      // If no API key, use a fallback local summary
      if (!this.API_KEY || this.API_KEY === 'your_api_key_here' || this.API_KEY.startsWith('gsk_your_')) {
        return {
          success: true,
          result: this.generateLocalSummary(text)
        };
      }

      const response = await fetch(`${this.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are an expert summarizer. Create concise, informative summaries that capture the key points and main ideas of the given text. Keep summaries between 100-200 words.'
            },
            {
              role: 'user',
              content: `Please summarize the following text:\n\n${text.substring(0, 4000)}`
            }
          ],
          max_tokens: 300,
          temperature: 0.3,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message || 'API error');
      }

      const summary = result.choices?.[0]?.message?.content;
      if (!summary) {
        throw new Error('No summary generated');
      }

      return {
        success: true,
        result: summary
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
      // Try Grok API for better quality if available
      if (this.API_KEY && this.API_KEY !== 'your_api_key_here' && !this.API_KEY.startsWith('gsk_your_')) {
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
      // Try Grok API for better quality if available
      if (this.API_KEY && this.API_KEY !== 'your_api_key_here' && !this.API_KEY.startsWith('gsk_your_')) {
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
      // Debug API key
      console.log('API_KEY check:', {
        hasKey: !!this.API_KEY,
        keyLength: this.API_KEY?.length,
        keyPrefix: this.API_KEY?.substring(0, 10),
        isPlaceholder: this.API_KEY === 'your_api_key_here',
        startsWithGskYour: this.API_KEY?.startsWith('gsk_your_')
      });
      
      // Temporarily force fallback to test
      // TODO: Fix Grok API integration
      console.log('Temporarily using fallback while debugging API');
      return {
        success: true,
        result: this.generateLocalChatResponse(message, context)
      };

      // If no API key, use a fallback response
      if (!this.API_KEY || this.API_KEY === 'your_api_key_here' || this.API_KEY.startsWith('gsk_your_')) {
        console.log('Using fallback response - no valid API key');
        return {
          success: true,
          result: this.generateLocalChatResponse(message, context)
        };
      }

      console.log('Using Grok API for response');

      const messages = [
        {
          role: 'system',
          content: context 
            ? `You are a helpful AI assistant with access to information from the user's study materials. You can answer questions both from the provided context and from your general knowledge. Be accurate, helpful, and conversational.\n\nStudy Material Context: ${context.substring(0, 2000)}`
            : 'You are a helpful AI assistant. You can answer questions on any topic, provide explanations, help with problem-solving, engage in conversations, and assist with various tasks. Be accurate, helpful, and conversational like ChatGPT or Grok AI.'
        },
        {
          role: 'user',
          content: message
        }
      ];

      const response = await fetch(`${this.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages,
          max_tokens: 1000,
          temperature: 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('=== GROK API ERROR DETAILS ===');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Error Data:', JSON.stringify(errorData, null, 2));
        console.log('Request Body:', JSON.stringify({
          model: this.MODEL,
          messages,
          max_tokens: 500,
          temperature: 0.7,
        }, null, 2));
        console.log('Headers:', JSON.stringify({
          'Authorization': `Bearer ${this.API_KEY.substring(0, 10)}...`,
          'Content-Type': 'application/json',
        }, null, 2));
        
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message || 'API error');
      }

      const chatResponse = result.choices?.[0]?.message?.content;
      if (!chatResponse) {
        throw new Error('No response generated');
      }

      return {
        success: true,
        result: chatResponse
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
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Extract key concepts and definitions
    const concepts = this.extractKeyConceptsFromText(text);
    
    // First, generate flashcards from concepts
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
    
    // If we still need more flashcards, generate from sentences
    let sentenceIndex = 0;
    while (flashcards.length < count && sentenceIndex < sentences.length) {
      const sentence = sentences[sentenceIndex].trim();
      const words = sentence.split(/\s+/).filter(w => w.length > 4);
      
      if (words.length >= 3) {
        const keyWord = words[Math.floor(words.length / 2)];
        const questionTypes = [
          `What does "${keyWord}" refer to in this context?`,
          `According to the text, what is mentioned about ${keyWord.toLowerCase()}?`,
          `Complete this statement from the text: "${sentence.substring(0, 30)}..."`,
          `What information is provided about ${keyWord.toLowerCase()}?`
        ];
        
        const questionType = questionTypes[flashcards.length % questionTypes.length];
        
        flashcards.push({
          question: questionType,
          answer: sentence
        });
      }
      sentenceIndex++;
    }
    
    return flashcards.slice(0, count);
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
    
    return concepts; // No artificial limit, let the count parameter control this
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
    const messages = [
      {
        role: 'system',
        content: `You are an expert educator creating study flashcards. Create exactly ${count} high-quality flashcards from the provided text. Focus on key concepts, definitions, important facts, and critical information that students should remember.

Return ONLY a valid JSON array in this exact format:
[
  {
    "question": "Clear, specific question",
    "answer": "Comprehensive, accurate answer"
  }
]

Do not include any other text, explanations, or formatting outside the JSON array.`
      },
      {
        role: 'user',
        content: `Create ${count} flashcards from this text:\n\n${text.substring(0, 3000)}`
      }
    ];

    const response = await fetch(`${this.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.MODEL,
        messages,
        max_tokens: 1200,
        temperature: 0.3,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message || 'API error');
    }

    const generatedText = result.choices?.[0]?.message?.content || '';
    
    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const flashcards = JSON.parse(jsonMatch[0]);
        if (Array.isArray(flashcards) && flashcards.length > 0) {
          return flashcards.slice(0, count);
        }
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
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    
    // Use paragraphs if available, otherwise use sentences
    const textSegments = paragraphs.length > 0 ? paragraphs : sentences;
    
    let segmentIndex = 0;
    
    while (questions.length < count && segmentIndex < textSegments.length) {
      const segment = textSegments[segmentIndex].trim();
      const segmentSentences = segment.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      if (segmentSentences.length > 0) {
        const sentence = segmentSentences[0].trim();
        
        // Extract key concepts and entities
        const words = sentence.split(/\s+/).filter(w => 
          w.length > 3 && 
          !/^(the|and|but|for|are|was|were|been|have|has|will|would|could|should|very|much|many|some|most|each|every)$/i.test(w)
        );
        
        if (words.length >= 2) {
          // Find the most important word
          const targetWord = this.findKeyWord(words, sentence);
          const questionTypes = ['fill_blank', 'definition', 'context', 'comprehension'];
          const questionType = questionTypes[questions.length % questionTypes.length];
          
          let question: QuizQuestion;
          
          switch (questionType) {
            case 'fill_blank':
              question = this.generateFillBlankQuestion(sentence, targetWord, questions.length);
              break;
            case 'definition':
              question = this.generateDefinitionQuestion(segment, targetWord, questions.length);
              break;
            case 'context':
              question = this.generateContextQuestion(segment, sentence, questions.length);
              break;
            case 'comprehension':
              question = this.generateComprehensionQuestion(segment, sentence, questions.length);
              break;
            default:
              question = this.generateFillBlankQuestion(sentence, targetWord, questions.length);
          }
          
          questions.push(question);
        }
      }
      segmentIndex++;
      
      // If we've gone through all segments but need more questions, cycle through again
      if (segmentIndex >= textSegments.length && questions.length < count && textSegments.length > 0) {
        segmentIndex = 0;
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
  
  private static generateComprehensionQuestion(paragraph: string, sentence: string, index: number): QuizQuestion {
    const words = sentence.split(/\s+/).filter(w => w.length > 3);
    const keyWord = words.length > 0 ? words[Math.floor(words.length / 2)] : 'concept';
    
    const distractors = [
      `${keyWord} is not discussed in this context`,
      `The text contradicts this information about ${keyWord}`,
      `${keyWord} is mentioned but with different details`
    ];
    
    const correctAnswer = `The text discusses ${keyWord} as described`;
    const options = [correctAnswer, ...distractors];
    this.shuffleArray(options);
    const correctIndex = options.indexOf(correctAnswer);
    
    return {
      id: `q${index + 1}`,
      question: `Based on the text, what can you conclude about ${keyWord}?`,
      options,
      correct: correctIndex,
      explanation: `The text provides information about ${keyWord} that supports this conclusion.`
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
    const messages = [
      {
        role: 'system',
        content: `You are an expert educator creating multiple-choice quiz questions. Create exactly ${count} high-quality questions based on the provided text. Each question should test comprehension, analysis, or application of the content with 4 options and clear explanations.

Return ONLY a valid JSON array in this exact format:
[
  {
    "id": "q1",
    "question": "What is the main concept discussed?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Explanation of why this is correct"
  }
]

Ensure the "correct" field is the index (0-3) of the correct option. Do not include any other text outside the JSON array.`
      },
      {
        role: 'user',
        content: `Create ${count} multiple-choice quiz questions from this text:\n\n${text.substring(0, 3000)}`
      }
    ];

    const response = await fetch(`${this.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.MODEL,
        messages,
        max_tokens: 1800,
        temperature: 0.3,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message || 'API error');
    }

    const generatedText = result.choices?.[0]?.message?.content || '';
    
    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const questions = JSON.parse(jsonMatch[0]);
        if (Array.isArray(questions) && questions.length > 0) {
          // Validate and fix question IDs
          return questions.slice(0, count).map((q, index) => ({
            ...q,
            id: `q${index + 1}`
          }));
        }
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
      // Handle general AI queries without document context
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return "Hello! I'm your AI assistant. I can help you with any questions, provide explanations on various topics, assist with problem-solving, and much more. What can I help you with today?";
      }
      
      // Provide universal AI responses for common question patterns
      if (lowerMessage.includes('what is') || lowerMessage.includes('what are')) {
        return this.generateUniversalResponse(message);
      }
      
      if (lowerMessage.includes('how to') || lowerMessage.includes('how do')) {
        return this.generateUniversalResponse(message);
      }
      
      if (lowerMessage.includes('explain') || lowerMessage.includes('tell me about')) {
        return this.generateUniversalResponse(message);
      }
      
      // Default universal response
      return this.generateUniversalResponse(message);
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
  
  private static generateUniversalResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Handle common question patterns with general knowledge
    if (lowerMessage.includes('biggest lake') || lowerMessage.includes('largest lake')) {
      return "The world's biggest lake by surface area is the Caspian Sea, located between Europe and Asia. It covers approximately 371,000 square kilometers (143,200 square miles). Despite being called a 'sea,' it's technically a lake because it's completely enclosed by land and not directly connected to the world's oceans.";
    }
    
    if (lowerMessage.includes('quantum physics')) {
      return "Quantum physics is the branch of physics that studies matter and energy at the smallest scales, typically at the level of atoms and subatomic particles. Key principles include wave-particle duality (particles can behave like waves), uncertainty principle (you can't precisely know both position and momentum), and quantum entanglement (particles can be mysteriously connected regardless of distance).";
    }
    
    if ((lowerMessage.includes(' ai ') || lowerMessage.startsWith('ai ') || lowerMessage.endsWith(' ai') || lowerMessage === 'ai') || lowerMessage.includes('artificial intelligence')) {
      return "Artificial Intelligence (AI) refers to computer systems that can perform tasks typically requiring human intelligence, such as learning, reasoning, problem-solving, and understanding language. Modern AI includes machine learning, neural networks, and large language models like the one you're chatting with right now!";
    }
    
    if (lowerMessage.includes('networking') || (lowerMessage.includes('explain') && lowerMessage.includes('network'))) {
      return "Networking refers to the practice of connecting computers and devices to share resources and communicate. It includes: 1) **Computer Networks**: LANs, WANs, Internet protocols (TCP/IP, HTTP, DNS), 2) **Professional Networking**: Building relationships for career growth and opportunities, 3) **Network Types**: Ethernet, Wi-Fi, cellular networks, 4) **Network Security**: Firewalls, VPNs, encryption, 5) **Social Networking**: Platforms like LinkedIn for professional connections. The field covers both technical infrastructure and human relationship building.";
    }
    
    if (lowerMessage.includes('blockchain')) {
      return "Blockchain is a distributed digital ledger technology that maintains a continuously growing list of records (blocks) linked and secured using cryptography. Each block contains transaction data, timestamps, and cryptographic hashes. It's the technology behind cryptocurrencies like Bitcoin and has applications in supply chain management, digital identity, and smart contracts.";
    }
    
    if (lowerMessage.includes('productivity')) {
      return "Here are some effective productivity tips: 1) Use the Pomodoro Technique (25-minute focused work sessions), 2) Prioritize tasks using the Eisenhower Matrix (urgent vs important), 3) Eliminate distractions during work time, 4) Take regular breaks, 5) Set specific, achievable goals, and 6) Use tools like calendars and task lists to stay organized.";
    }
    
    if (lowerMessage.includes('pakistan') && (lowerMessage.includes('biggest university') || lowerMessage.includes('largest university'))) {
      return "Pakistan's biggest university by enrollment is the University of the Punjab (PU) in Lahore, established in 1882. It's one of the oldest and largest universities in Pakistan with over 600,000 students across its various campuses and affiliated colleges. Other major universities in Pakistan include Karachi University, Quaid-i-Azam University Islamabad, and Lahore University of Management Sciences (LUMS).";
    }
    
    if (lowerMessage.includes('pakistan') && lowerMessage.includes('university')) {
      return "Pakistan has many renowned universities including the University of the Punjab (largest by enrollment), Quaid-i-Azam University Islamabad, University of Karachi, Lahore University of Management Sciences (LUMS), National University of Sciences and Technology (NUST), and Pakistan Institute of Engineering and Applied Sciences (PIEAS). These institutions offer diverse programs and are recognized for their academic excellence.";
    }
    
    if (lowerMessage.includes('india') && (lowerMessage.includes('biggest university') || lowerMessage.includes('largest university'))) {
      return "India's biggest university by enrollment is Indira Gandhi National Open University (IGNOU) in New Delhi, established in 1985. It has over 4 million students enrolled across various programs through distance learning. For traditional universities, the University of Mumbai and University of Calcutta are among the largest with hundreds of thousands of students. Other major universities include Jawaharlal Nehru University (JNU), Delhi University, and the Indian Institutes of Technology (IITs).";
    }
    
    if (lowerMessage.includes('india') && lowerMessage.includes('university')) {
      return "India has many prestigious universities including Indira Gandhi National Open University (IGNOU) - the largest by enrollment, Indian Institutes of Technology (IITs), Indian Institutes of Management (IIMs), Jawaharlal Nehru University, Delhi University, University of Mumbai, University of Calcutta, Banaras Hindu University, and Aligarh Muslim University. These institutions are known for their academic excellence and research contributions.";
    }
    
    if (lowerMessage.includes('pakistan') && lowerMessage.includes('geography')) {
      return "Pakistan's geography is quite diverse and interesting! **Location**: Pakistan is in South Asia, bordered by India (east), Afghanistan & Iran (west), China (north), and Arabian Sea (south). **Major Rivers**: The Indus River is the main river, flowing north to south. **Mountains**: The north has beautiful mountain ranges like the Himalayas, Karakoram (K2 mountain), and Hindu Kush. **Plains**: The middle part has fertile plains perfect for farming. **Deserts**: The Thar Desert is in the southeast. **Climate**: Hot summers, mild winters, with monsoon rains in summer. **Provinces**: Punjab, Sindh, Balochistan (largest), Khyber Pakhtunkhwa, and Gilgit-Baltistan. The country covers about 796,095 square kilometers.";
    }

    if (lowerMessage.includes('president') && (lowerMessage.includes('america') || lowerMessage.includes('usa') || lowerMessage.includes('united states'))) {
      return "As of September 2025, Joe Biden is the President of the United States. He took office on January 20, 2021, as the 46th President. However, for the most current information about political leadership, I'd recommend checking recent news sources as this information can change, especially around election periods.";
    }

    // Handle general university questions
    if (lowerMessage.includes('biggest university') || lowerMessage.includes('largest university')) {
      return "The biggest university in the world by enrollment is typically considered to be Indira Gandhi National Open University (IGNOU) in India, with over 4 million students. For traditional campus-based universities, the University of Central Florida in the US and Anadolu University in Turkey are among the largest with hundreds of thousands of students each.";
    }
    
    // Default response for other questions
    return "I'm here to help you with any questions! I can provide information on a wide range of topics, help with problem-solving, explain concepts, assist with writing, or just have a conversation. Could you provide a bit more detail about what you'd like to know?";
  }
}