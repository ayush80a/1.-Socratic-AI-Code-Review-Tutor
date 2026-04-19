document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    const appScreen = document.getElementById('app-screen');
    
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const useridInput = document.getElementById('userid');
    const loginError = document.getElementById('login-error');
    
    const submitBtn = document.getElementById('submit-btn');
    const codeEditor = document.getElementById('code-editor');
    const languageSelect = document.getElementById('language-select');
    const chatContainer = document.getElementById('chat-container');

    const historyBtn = document.getElementById('history-btn');
    const closeHistoryBtn = document.getElementById('close-history');
    const historySidebar = document.getElementById('history-sidebar');
    const historyContent = document.getElementById('history-content');

    let currentUser = null; // Current logged-in user ko track karne ke liye

    // --- NAVIGATION LOGIC ---
    document.getElementById('go-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        loginScreen.classList.add('screen-hidden'); loginScreen.classList.remove('screen-active');
        registerScreen.classList.add('screen-active'); registerScreen.classList.remove('screen-hidden');
        loginError.classList.add('hidden'); 
    });

    document.getElementById('go-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        registerScreen.classList.add('screen-hidden'); registerScreen.classList.remove('screen-active');
        loginScreen.classList.add('screen-active'); loginScreen.classList.remove('screen-hidden');
    });

    // --- SIDEBAR TOGGLE ---
    historyBtn.addEventListener('click', () => { historySidebar.classList.add('sidebar-active'); });
    closeHistoryBtn.addEventListener('click', () => { historySidebar.classList.remove('sidebar-active'); });

    // --- REGISTRATION LOGIC ---
    registerBtn.addEventListener('click', () => {
        const newId = document.getElementById('reg-userid').value.trim();
        const newPass = document.getElementById('reg-password').value.trim();
        const newName = document.getElementById('reg-name').value.trim();
        const newQual = document.getElementById('reg-qual').value.trim();
        
        if(!newId || !newPass || !newName || !newQual) {
            alert("Please fill all details to register!"); return;
        }

        const userData = { name: newName, password: newPass, qualification: newQual, history: [] };
        localStorage.setItem(newId, JSON.stringify(userData));
        
        alert("Registration Successful! Please login now.");
        document.getElementById('go-to-login').click();
    });

    // --- HISTORY RENDER LOGIC ---
    function loadHistory() {
        historyContent.innerHTML = '';
        if (!currentUser) return;
        
        let userData = JSON.parse(localStorage.getItem(currentUser));
        if (userData.history && userData.history.length > 0) {
            // Naye queries upar dikhane ke liye reverse()
            [...userData.history].reverse().forEach(item => renderHistoryItem(item.code, item.reply));
        } else {
            historyContent.innerHTML = '<p style="color: #94a3b8; font-size: 0.9rem;">No history yet. Submit a code to see it here!</p>';
        }
    }

    function renderHistoryItem(code, reply) {
        if(historyContent.innerHTML.includes('No history yet')) historyContent.innerHTML = '';
        const itemDiv = document.createElement('div');
        itemDiv.className = 'history-item';
        // Code ko thoda truncate karke dikhayenge taaki ganda na lage
        const shortCode = code.length > 40 ? code.substring(0, 40) + '...' : code;
        const shortReply = reply.length > 60 ? reply.substring(0, 60) + '...' : reply;
        
        itemDiv.innerHTML = `<strong>Code:</strong><pre>${shortCode}</pre><strong>Tutor:</strong><p>${shortReply}</p>`;
        historyContent.appendChild(itemDiv); 
    }

    // --- LOGIN LOGIC ---
    loginBtn.addEventListener('click', () => {
        const id = useridInput.value.trim();
        const pass = document.getElementById('password').value.trim();

        if (id && pass) {
            const savedDataStr = localStorage.getItem(id);
            if (savedDataStr) {
                const savedData = JSON.parse(savedDataStr);
                if (savedData.password === pass) {
                    currentUser = id; // Set current user
                    loadHistory();    // Unki purani history load karo

                    loginError.classList.add('hidden');
                    loginScreen.classList.add('screen-hidden'); loginScreen.classList.remove('screen-active');
                    appScreen.classList.add('screen-active'); appScreen.classList.remove('screen-hidden');
                    return; 
                }
            }
            loginError.classList.remove('hidden');
            loginBtn.style.transform = 'translateX(5px)';
            setTimeout(() => loginBtn.style.transform = 'translateX(-5px)', 50);
            setTimeout(() => loginBtn.style.transform = 'translateX(0)', 100);
        } else {
            loginError.classList.remove('hidden');
        }
    });

    // --- CHAT HELPER FUNCTION ---
    function addMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', `${sender}-message`, 'fade-in');
        const avatar = sender === 'ai' ? '🤖' : '🧑‍💻';
        
        if (sender === 'user') {
            msgDiv.innerHTML = `<div class="avatar">${avatar}</div><div class="bubble">${text}</div>`;
        } else {
            msgDiv.innerHTML = `<div class="avatar">${avatar}</div><div class="bubble"><strong>Socratic Tutor</strong><p>${text}</p></div>`;
        }
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight; 
    }

    // --- SUBMIT CODE LOGIC (REAL AI + UNLIMITED) ---
    submitBtn.addEventListener('click', async () => {
        const code = codeEditor.value.trim();
        if (!code) return; 

        const lang = languageSelect.value;
        addMessage('user', `<pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 0.9rem; margin: 0; background: rgba(0,0,0,0.1); padding: 8px; border-radius: 6px;">${code}</pre>`);

        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Analyzing Code...';

        try {
            const response = await fetch('http://127.0.0.1:8000/api/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: lang, code: code })
            });

            const data = await response.json();
            addMessage('ai', data.reply);
            
            // AI ka reply aate hi History me Save karo aur Sidebar update karo
            if (currentUser) {
                let userData = JSON.parse(localStorage.getItem(currentUser));
                if (!userData.history) userData.history = [];
                userData.history.push({ code: code, reply: data.reply });
                localStorage.setItem(currentUser, JSON.stringify(userData));
                
                // Naya message sidebar me sabse upar dikhane ke liye
                historyContent.innerHTML = '';
                [...userData.history].reverse().forEach(item => renderHistoryItem(item.code, item.reply));
            }

            submitBtn.disabled = false;
            submitBtn.textContent = originalText;

        } catch (error) {
            console.error("Backend Error:", error);
            addMessage('ai', 'Oops! Backend connection failed. Is the server running?');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});