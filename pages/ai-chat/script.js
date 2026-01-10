import { auth, API_BASE } from "/backend/js/auth.js";

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const loadingBar = document.getElementById('loading-bar');
const welcomeMessage = document.getElementById('welcome-message');

// Sidebar Elements
const historyContainer = document.getElementById('history-container');
const sidebarUserImg = document.getElementById('sidebar-user-img');
const sidebarUserInitials = document.getElementById('sidebar-user-initials');
const sidebarUserName = document.getElementById('sidebar-user-name');

let conversationHistory = [];
let currentUser = null;

// Auth Listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        updateUserProfile(user);
        await loadHistory();
    } else {
        // Redirect to login if needed, or show guest state
        window.location.href = '/login/?redirect=/ai-chat/';
    }
});

function updateUserProfile(user) {
    if (user.photoURL) {
        sidebarUserImg.src = user.photoURL;
        sidebarUserImg.classList.remove('hidden');
        sidebarUserInitials.classList.add('hidden');
    } else {
        sidebarUserImg.classList.add('hidden');
        sidebarUserInitials.classList.remove('hidden');
        sidebarUserInitials.textContent = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
    }
    sidebarUserName.textContent = user.displayName || user.email.split('@')[0];
}

async function loadHistory() {
    if (!currentUser) return;

    try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`${API_BASE}/api/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load history');

        const history = await response.json();
        renderHistory(history);

    } catch (error) {
        console.error('History load error:', error);
        historyContainer.innerHTML = `<p class="text-xs text-red-500 text-center">Failed to load history</p>`;
    }
}

function renderHistory(items) {
    if (!items || items.length === 0) {
        historyContainer.innerHTML = `<p class="text-xs text-gray-400 text-center italic py-4">No study sessions yet.</p>`;
        return;
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isSameDay = (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

    const todayItems = items.filter(i => isSameDay(new Date(i.createdAt), today));
    const olderItems = items.filter(i => !isSameDay(new Date(i.createdAt), today));

    let html = '';

    if (todayItems.length > 0) {
        html += `<h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Today</h4><div class="space-y-1 mb-6">`;
        todayItems.forEach(item => {
            html += createHistoryItem(item);
        });
        html += `</div>`;
    }

    if (olderItems.length > 0) {
        html += `<h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Previous</h4><div class="space-y-1">`;
        olderItems.forEach(item => {
            html += createHistoryItem(item);
        });
        html += `</div>`;
    }

    historyContainer.innerHTML = html;
}

function createHistoryItem(item) {
    return `
    <button class="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-600 text-sm font-medium flex items-center gap-2 transition-colors truncate group" onclick="window.loadSession('${item.id}', '${item.title}')">
        <span class="material-icons-round text-base text-gray-400 group-hover:text-primary transition-colors">chat_bubble_outline</span>
        <span class="truncate">${item.title}</span>
    </button>`;
}

// Global functions for HTML access
window.startNewSession = function() {
    chatContainer.innerHTML = '';
    conversationHistory = [];
    chatContainer.appendChild(welcomeMessage);
    welcomeMessage.classList.remove('hidden');
    
    // Reset active states in sidebar if desired?
};

window.loadSession = async function(id, title) {
    if (!currentUser) return;
    
    try {
        setLoading(true);
        const token = await currentUser.getIdToken();
        const response = await fetch(`${API_BASE}/api/generations/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load session');

        const data = await response.json();
        const plan = data.studyPlan;
        
        // Fetch historical conversation
        const historyRes = await fetch(`${API_BASE}/api/chat/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const historyData = await historyRes.json();
        
        if (historyData.messages && historyData.messages.length > 0) {
            // Load existing chat
            historyData.messages.forEach(msg => {
                // Determine if we should save to history (avoid duplicates if we push later)
                // Actually, appendMessage pushes to conversationHistory, and we just wiped it.
                // So yes, we want to populate it.
                appendMessage(msg.role, msg.content, true);
            });
        } else {
            // New chat context
            conversationHistory.push({
                role: 'system',
                content: `You are now assisting the user with their study material: "${title}".
                Here is the summary of the material: ${plan.summary}
                The main topics are: ${plan.concept_map?.subtopics?.join(', ') || 'N/A'}.
                Use this context to answer the user's questions.`
            });

            // Show a "welcome" message from the AI for this specific material
            // We set saveToHistory: false so it doesn't break Perplexity's alternation rule
            appendMessage('assistant', `I've loaded your notes for **${title}**. What would you like to clarify or quiz yourself on?`, false);
        }

        // Store the current generation ID for saving later
        window.currentGenerationId = id;

    } catch (error) {
        console.error('Load session error:', error);
        alert('Failed to load this study session.');
    } finally {
        setLoading(false);
    }
};

// UI Interactions
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.value.trim() === '') {
        this.style.height = 'auto';
    }
});

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

async function sendMessage() {
    if (sendBtn.disabled) return; // Prevent double submission
    
    const text = userInput.value.trim();
    if (!text) return;

    if (!welcomeMessage.classList.contains('hidden')) {
        welcomeMessage.classList.add('hidden');
    }

    appendMessage('user', text);
    userInput.value = '';
    userInput.style.height = 'auto';
    
    setLoading(true);

    const messages = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
    }));

    try {
        // Use auth token if available? server.js endpoint /api/chat we made PUBLIC or OPTIONAL
        // But if we want to secure it later, we should pass the token.
        // req.headers.authorization = ...
        
        const headers = { 'Content-Type': 'application/json' };
        if (currentUser) {
            const token = await currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ messages })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || 'Failed to fetch response');
        }

        const data = await response.json();
        appendMessage('assistant', data.content);

        // Update local credits display if it exists in dashboard or profile
        // For now, let's just log it or update a global if we had one.
        console.log(`Remaining credits: ${data.creditsRemaining}`);

        // SAVE CONVERSATION TO FIRESTORE
        if (window.currentGenerationId && currentUser) {
            const token = await currentUser.getIdToken();
            fetch(`${API_BASE}/api/chat/${window.currentGenerationId}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ messages: conversationHistory })
            }).catch(e => console.error('Failed to save chat:', e));
        }

    } catch (error) {
        console.error(error);
        appendMessage('assistant', `Sorry, I encountered an error: ${error.message}. Please try again.`);
    } finally {
        setLoading(false);
    }
}

function appendMessage(role, content, saveToHistory = true) {
    const isUser = role === 'user';
    if (saveToHistory) {
        conversationHistory.push({ role, content });
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = `flex w-full ${isUser ? 'justify-end' : 'justify-start'} message-enter`;
    
    // User Avatar (uses real profile img if available, else initial)
    let userAvatar = '';
    if (isUser) {
        if (currentUser && currentUser.photoURL) {
            userAvatar = `<img src="${currentUser.photoURL}" class="w-8 h-8 rounded-full ml-3 order-2 object-cover">`;
        } else {
             userAvatar = `<div class="w-8 h-8 rounded-full bg-dark text-white flex items-center justify-center flex-shrink-0 ml-3 order-2">
                <span class="material-icons-round text-sm">person</span>
             </div>`;
        }
    }

    const aiAvatar = `<div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 mr-3 shadow-lg shadow-blue-500/30">
            <span class="material-icons-round text-sm">auto_awesome</span>
         </div>`;

    const bubble = document.createElement('div');
    bubble.className = isUser ? 
        `bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-sm max-w-[85%] md:max-w-[70%] shadow-lg shadow-blue-500/20 text-sm leading-relaxed` :
        `bg-white border border-gray-100 text-dark px-6 py-5 rounded-2xl rounded-tl-sm max-w-[90%] md:max-w-[75%] shadow-sm prose text-sm`;
    
    if (!isUser) {
        let formatted = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/^\s*-\s+(.*)/gm, '<li class="ml-4">$1</li>');
        
        // SANITIZE with DOMPurify
        bubble.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(formatted) : formatted;
    } else {
        bubble.textContent = content;
    }

    msgDiv.innerHTML = isUser ? `${bubble.outerHTML}${userAvatar}` : `${aiAvatar}${bubble.outerHTML}`;
    
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
}

function setLoading(isLoading) {
    sendBtn.disabled = isLoading;
    if (loadingBar) loadingBar.classList.toggle('hidden', !isLoading);
    sendBtn.innerHTML = isLoading ? 
        '<span class="material-icons-round text-sm animate-spin">refresh</span>' : 
        '<span class="material-icons-round text-sm">arrow_upward</span>';
}

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const isHidden = sidebar.classList.contains('hidden');
    
    // Mobile toggle logic
    if (window.innerWidth < 768) {
         if (isHidden) {
             sidebar.classList.remove('hidden');
             sidebar.classList.add('absolute', 'inset-0', 'z-50', 'w-full');
         } else {
             sidebar.classList.add('hidden');
             sidebar.classList.remove('absolute', 'inset-0', 'z-50', 'w-full');
         }
    }
}
