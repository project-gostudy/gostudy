/**
 * Sequential Study Module
 * Manages step-by-step progression through study plan sections
 * with smooth transitions and JSON output structure
 */

export class SequentialStudy {
  constructor(studyPlanData) {
    this.data = studyPlanData;
    this.currentSectionIndex = 0;
    this.sections = this.buildSections();
    this.container = null;
    this.onComplete = null;
  }

  /**
   * Build sections array from study plan data
   * Structure: Explanation → Examples → Mini-Quiz
   */
  buildSections() {
    const sections = [];

    // 1. explanation section (summary + concept map)
    sections.push({
      title: "Understanding the Concept",
      type: "explanation",
      content: {
        summary: this.data.summary || "",
        conceptMap: this.data.concept_map || null,
        objectives: this.data.learning_objectives || []
      },
      next_button: {
        text: "Continue to Examples",
        enabled: true
      }
    });

    // 2. example section (worked examples)
    if (this.data.worked_examples && this.data.worked_examples.length > 0) {
      sections.push({
        title: "See It in Action",
        type: "example",
        content: {
          examples: this.data.worked_examples
        },
        next_button: {
          text: "Continue to Quiz",
          enabled: true
        }
      });
    }

    // 3. mini-quiz section (3 questions max for quick assessment)
    if (this.data.active_recall && this.data.active_recall.length > 0) {
      const quizQuestions = this.data.active_recall.slice(0, 3);
      sections.push({
        title: "Test Your Understanding",
        type: "quiz",
        content: {
          questions: quizQuestions,
          currentQuestion: 0,
          score: 0
        },
        next_button: {
          text: "Finish Section",
          enabled: false // enabled after completing quiz
        }
      });
    }

    return sections;
  }

  /**
   * Get current section as JSON
   */
  getCurrentSection() {
    return this.sections[this.currentSectionIndex] || null;
  }

  /**
   * Get all sections as JSON array
   */
  getAllSectionsJSON() {
    return JSON.stringify(this.sections, null, 2);
  }

  /**
   * Move to next section with fade transition
   */
  async nextSection() {
    if (this.currentSectionIndex >= this.sections.length - 1) {
      if (this.onComplete) {
        this.onComplete();
      }
      return;
    }

    // fade out current section
    await this.fadeOut();
    
    // update index
    this.currentSectionIndex++;
    
    // fade in new section
    await this.fadeIn();
  }

  /**
   * Render current section to container
   */
  render(containerElement) {
    this.container = containerElement;
    this.renderSection();
  }

  /**
   * Render the current section's content
   */
  renderSection() {
    if (!this.container) return;

    const section = this.getCurrentSection();
    if (!section) return;

    let contentHTML = '';

    // render based on section type
    switch (section.type) {
      case 'explanation':
        contentHTML = this.renderExplanation(section.content);
        break;
      case 'example':
        contentHTML = this.renderExample(section.content);
        break;
      case 'quiz':
        contentHTML = this.renderQuiz(section.content);
        break;
    }

    this.container.innerHTML = `
      <div class="sequential-section" data-section="${section.type}">
        <!-- progress indicator -->
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-2">
            ${this.sections.map((s, idx) => `
              <div class="h-1.5 rounded-full transition-all duration-300 ${
                idx === this.currentSectionIndex 
                  ? 'w-12 bg-blue-600' 
                  : idx < this.currentSectionIndex 
                    ? 'w-8 bg-blue-400' 
                    : 'w-8 bg-gray-200'
              }"></div>
            `).join('')}
          </div>
          <span class="text-xs font-bold text-gray-400 uppercase tracking-wide">
            Step ${this.currentSectionIndex + 1} of ${this.sections.length}
          </span>
        </div>

        <!-- section header -->
        <div class="mb-10">
          <h2 class="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
            ${section.title}
          </h2>
          <div class="h-1 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
        </div>

        <!-- section content -->
        <div class="section-content mb-10">
          ${contentHTML}
        </div>

        <!-- continue button -->
        <div class="flex justify-end">
          <button 
            id="continue-btn"
            class="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 ${
              !section.next_button.enabled ? 'opacity-50 cursor-not-allowed' : ''
            }"
            ${!section.next_button.enabled ? 'disabled' : ''}
          >
            <span>${section.next_button.text}</span>
            <span class="material-icons-round">arrow_forward</span>
          </button>
        </div>
      </div>
    `;

    // attach event listener to continue button
    const continueBtn = this.container.querySelector('#continue-btn');
    if (continueBtn && section.next_button.enabled) {
      continueBtn.addEventListener('click', () => this.nextSection());
    }

    // initialize quiz if needed
    if (section.type === 'quiz') {
      this.initializeQuiz();
    }
  }

  /**
   * Render explanation section
   */
  renderExplanation(content) {
    let objectivesHTML = '';
    if (content.objectives && content.objectives.length > 0) {
      objectivesHTML = `
        <div class="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-6">
          <h4 class="text-sm font-bold text-blue-900 uppercase tracking-wide mb-4 flex items-center gap-2">
            <span class="material-icons-round text-lg">flag</span>
            Learning Objectives
          </h4>
          <ul class="space-y-2">
            ${content.objectives.map(obj => `
              <li class="flex items-start gap-3 text-gray-700">
                <span class="material-icons-round text-blue-600 text-sm mt-0.5">check_circle</span>
                <span class="text-sm leading-relaxed">${obj}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    let conceptMapHTML = '';
    if (content.conceptMap) {
      conceptMapHTML = `
        <div class="bg-purple-50/50 border border-purple-100 rounded-2xl p-8 mb-6">
          <h4 class="text-sm font-bold text-purple-900 uppercase tracking-wide mb-6 flex items-center gap-2">
            <span class="material-icons-round text-lg">hub</span>
            Concept Map
          </h4>
          <div id="concept-map-container" class="flex justify-center"></div>
        </div>
      `;
    }

    return `
      <div class="glass-panel p-8 rounded-3xl shadow-soft mb-6">
        <div class="flex items-center gap-3 mb-6">
          <span class="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
            <span class="material-icons-round">lightbulb</span>
          </span>
          <h3 class="text-xl font-bold text-gray-900">Summary</h3>
        </div>
        <div class="prose prose-lg max-w-none text-gray-700 leading-relaxed">
          ${content.summary}
        </div>
      </div>
      ${objectivesHTML}
      ${conceptMapHTML}
    `;
  }

  /**
   * Render example section
   */
  renderExample(content) {
    if (!content.examples || content.examples.length === 0) {
      return '<p class="text-gray-500 italic">No examples available.</p>';
    }

    return `
      <div class="space-y-6">
        ${content.examples.map((example, idx) => `
          <div class="glass-panel p-8 rounded-3xl shadow-soft hover:shadow-lg transition-all duration-300">
            <div class="flex items-center gap-3 mb-4">
              <span class="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center font-bold text-sm">
                ${idx + 1}
              </span>
              <h4 class="text-lg font-bold text-gray-900">${example.title || `Example ${idx + 1}`}</h4>
            </div>
            <div class="bg-gray-50 rounded-xl p-6 mb-4 font-mono text-sm text-gray-800 border border-gray-200">
              ${example.problem || example.content || ''}
            </div>
            ${example.solution ? `
              <div class="mt-4">
                <p class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Solution:</p>
                <div class="text-gray-700 leading-relaxed">
                  ${example.solution}
                </div>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render quiz section
   */
  renderQuiz(content) {
    const question = content.questions[content.currentQuestion];
    
    return `
      <div id="quiz-container" class="glass-panel p-8 rounded-3xl shadow-soft">
        <div class="mb-6 flex items-center justify-between">
          <span class="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Question ${content.currentQuestion + 1} of ${content.questions.length}
          </span>
          <div class="flex gap-1">
            ${Array(question.difficulty_rating || 3).fill(0).map(() => 
              '<span class="material-icons-round text-yellow-400 text-sm">star</span>'
            ).join('')}
          </div>
        </div>
        
        <h4 class="text-xl font-bold text-gray-900 mb-6 leading-tight">
          ${question.question}
        </h4>
        
        <div id="quiz-options" class="space-y-3 mb-6">
          ${question.type === 'multiple_choice' && question.options ? 
            question.options.map((option, idx) => `
              <button 
                class="quiz-option w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                data-answer="${option}"
              >
                <div class="flex items-center gap-3">
                  <span class="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    ${String.fromCharCode(65 + idx)}
                  </span>
                  <span class="text-gray-800 font-medium">${option}</span>
                </div>
              </button>
            `).join('') 
            : `
              <textarea 
                id="quiz-short-answer" 
                class="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 min-h-[120px] text-gray-800"
                placeholder="Type your answer here..."
              ></textarea>
              <button 
                id="submit-short-answer"
                class="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Submit Answer
              </button>
            `
          }
        </div>
        
        <div id="quiz-feedback" class="hidden"></div>
      </div>
    `;
  }

  /**
   * Initialize quiz interaction
   */
  initializeQuiz() {
    const section = this.getCurrentSection();
    if (section.type !== 'quiz') return;

    const options = this.container.querySelectorAll('.quiz-option');
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        const answer = e.currentTarget.dataset.answer;
        this.submitQuizAnswer(answer);
      });
    });

    const shortAnswerBtn = this.container.querySelector('#submit-short-answer');
    if (shortAnswerBtn) {
      shortAnswerBtn.addEventListener('click', () => {
        const answer = this.container.querySelector('#quiz-short-answer').value.trim();
        if (answer) {
          this.submitQuizAnswer(answer);
        }
      });
    }
  }

  /**
   * Submit quiz answer and show feedback
   */
  submitQuizAnswer(userAnswer) {
    const section = this.getCurrentSection();
    const question = section.content.questions[section.content.currentQuestion];
    
    const isCorrect = userAnswer.toLowerCase().trim() === question.answer.toLowerCase().trim();
    
    if (isCorrect) {
      section.content.score++;
    }

    // show feedback
    const feedbackDiv = this.container.querySelector('#quiz-feedback');
    feedbackDiv.classList.remove('hidden');
    feedbackDiv.innerHTML = `
      <div class="p-6 rounded-2xl ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
        <div class="flex items-center gap-3 mb-3">
          <span class="material-icons-round ${isCorrect ? 'text-green-600' : 'text-red-600'}">
            ${isCorrect ? 'check_circle' : 'cancel'}
          </span>
          <span class="font-bold ${isCorrect ? 'text-green-900' : 'text-red-900'}">
            ${isCorrect ? 'Correct!' : 'Not quite right'}
          </span>
        </div>
        <p class="text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'} mb-4">
          ${isCorrect ? 'Great job!' : `The correct answer is: ${question.answer}`}
        </p>
        <button 
          id="next-quiz-question" 
          class="px-6 py-2 bg-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all ${isCorrect ? 'text-green-700' : 'text-red-700'}"
        >
          ${section.content.currentQuestion < section.content.questions.length - 1 ? 'Next Question' : 'See Results'}
        </button>
      </div>
    `;

    // disable options
    this.container.querySelectorAll('.quiz-option').forEach(opt => opt.disabled = true);

    // handle next question
    const nextBtn = this.container.querySelector('#next-quiz-question');
    nextBtn.addEventListener('click', () => {
      if (section.content.currentQuestion < section.content.questions.length - 1) {
        section.content.currentQuestion++;
        this.renderSection();
      } else {
        this.showQuizResults();
      }
    });
  }

  /**
   * Show quiz results and enable continue button
   */
  showQuizResults() {
    const section = this.getCurrentSection();
    const score = section.content.score;
    const total = section.content.questions.length;
    const percentage = Math.round((score / total) * 100);

    this.container.querySelector('.section-content').innerHTML = `
      <div class="glass-panel p-10 rounded-3xl shadow-soft text-center">
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <span class="material-icons-round text-white text-4xl">emoji_events</span>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h3>
        <p class="text-gray-600 mb-8">You scored ${score} out of ${total} questions correctly</p>
        
        <div class="max-w-xs mx-auto">
          <div class="flex justify-between text-sm font-bold text-gray-600 mb-2">
            <span>Score</span>
            <span>${percentage}%</span>
          </div>
          <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000" style="width: ${percentage}%"></div>
          </div>
        </div>
      </div>
    `;

    // enable continue button
    section.next_button.enabled = true;
    const continueBtn = this.container.querySelector('#continue-btn');
    if (continueBtn) {
      continueBtn.disabled = false;
      continueBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      continueBtn.addEventListener('click', () => this.nextSection());
    }
  }

  /**
   * Fade out transition
   */
  fadeOut() {
    return new Promise(resolve => {
      if (!this.container) {
        resolve();
        return;
      }

      this.container.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
      this.container.style.opacity = '0';
      this.container.style.transform = 'translateY(-20px)';
      
      setTimeout(() => {
        resolve();
      }, 400);
    });
  }

  /**
   * Fade in transition
   */
  fadeIn() {
    return new Promise(resolve => {
      if (!this.container) {
        resolve();
        return;
      }

      this.renderSection();
      
      this.container.style.opacity = '0';
      this.container.style.transform = 'translateY(20px)';
      
      // trigger reflow
      this.container.offsetHeight;
      
      this.container.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
      this.container.style.opacity = '1';
      this.container.style.transform = 'translateY(0)';
      
      setTimeout(() => {
        resolve();
      }, 500);
    });
  }

  /**
   * Set completion callback
   */
  setOnComplete(callback) {
    this.onComplete = callback;
  }
}
