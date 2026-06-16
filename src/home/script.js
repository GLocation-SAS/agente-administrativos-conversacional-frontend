const renderer = new marked.Renderer();
const linkRenderer = renderer.link;
renderer.link = (href, title, text) => {
  const html = linkRenderer.call(renderer, href, title, text);
  return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
};
marked.setOptions({ renderer: renderer });

let hasMessages = false;
let quickQuestions = {};
let requestId = 0;

fetch('../quick-questions/quick-questions.json')
  .then((res) => res.json())
  .then((data) => {
    quickQuestions = data;
  })
  .catch((err) => {
    console.error('Error loading quick-questions.json:', err);
  });

document.getElementById('msg').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    const sendBtn = document.querySelector('.send-btn');
    if (!sendBtn.disabled) {
      send();
    }
  }
});

let sessionId =
  'session-' + Date.now() + '-' + Math.floor(Math.random() * 100000);

async function send() {
  const text = document.getElementById('msg').value.trim();
  if (!text) return;

  const sendBtn = document.querySelector('.send-btn');

  if (sendBtn.disabled) return;

  const currentId = ++requestId;

  sendBtn.disabled = true;
  sendBtn.classList.add('loading');

  if (!hasMessages) {
    document.querySelector('.chat-header').style.display = 'none';
    document.querySelector('.sugerencias').style.display = 'none';
    document.getElementById('messages').classList.add('full-height');
    document.querySelector('.new-conversation-btn').classList.add('visible');
    hasMessages = true;
  }

  addMessage(text, 'user');
  document.getElementById('msg').value = '';
  showTyping(true);

  let res;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sessionId }),
    });
  } catch (err) {
    if (currentId !== requestId) {
      showTyping(false);
      return;
    }

    showTyping(false);
    addMessage('No se pudo conectar con el servidor', 'bot');
    sendBtn.disabled = false;
    sendBtn.classList.remove('loading');
    return;
  }

  if (!res.ok) {
    if (currentId !== requestId) {
      showTyping(false);
      return;
    }

    showTyping(false);
    addMessage('Error ' + res.status, 'bot');
    sendBtn.disabled = false;
    sendBtn.classList.remove('loading');
    return;
  }

  const data = await res.json();

  if (currentId !== requestId) {
    showTyping(false);
    return;
  }

  showTyping(false);

  let botText = 'Sin respuesta del agente';
  if (data.reply && data.reply.length > 0) {
    const msg = data.reply[0];
    if (msg.text?.text?.length > 0) {
      botText = msg.text.text[0];
    }
  }

  addMessage(botText, 'bot');

  sendBtn.disabled = false;
  sendBtn.classList.remove('loading');
}

function addMessage(text, sender) {
  const messages = document.getElementById('messages');

  const bubble = document.createElement('div');
  bubble.className = 'msg ' + sender;

  const icon = document.createElement('img');
  icon.className = 'msg-icon';

  if (sender === 'user') {
    icon.src = 'icons/user-message.svg';
  } else {
    icon.src = 'icons/patroclo-message.svg';
  }

  icon.alt = sender;

  const textSpan = document.createElement('span');

  textSpan.innerHTML = marked.parse(text);

  bubble.appendChild(icon);
  bubble.appendChild(textSpan);

  messages.appendChild(bubble);

  messages.scrollTo({
    top: messages.scrollHeight,
    behavior: 'smooth',
  });
}

function showTyping(state) {
  document.getElementById('typing').style.display = state ? 'block' : 'none';
}

function sendQuick(tag) {
  const questions = quickQuestions[tag];
  if (questions && Array.isArray(questions) && questions.length > 0) {
    const randomIndex = Math.floor(Math.random() * questions.length);
    const question = questions[randomIndex];
    document.getElementById('msg').value = question;
  } else {
    document.getElementById('msg').value = tag;
  }
  send();
}

function clearChat() {
  requestId++;
  sessionId =
    'session-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
  showTyping(false);
  const sendBtn = document.querySelector('.send-btn');
  sendBtn.disabled = false;
  sendBtn.classList.remove('loading');
  document.getElementById('messages').innerHTML = '';
  document.querySelector('.chat-header').style.display = 'flex';
  document.querySelector('.sugerencias').style.display = 'block';
  document.getElementById('messages').classList.remove('full-height');
  document.querySelector('.new-conversation-btn').classList.remove('visible');
  document.getElementById('msg').value = '';
  hasMessages = false;
}
