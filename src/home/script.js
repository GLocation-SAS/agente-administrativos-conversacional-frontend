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

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1200;

const FALLBACK_MESSAGE =
  'Lo siento, no pude obtener una respuesta en este momento. ' +
  '¿Podrías intentarlo de nuevo en unos instantes?';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractBotText(reply) {
  if (!reply || reply.length === 0) return null;
  for (const msg of reply) {
    if (msg.text?.text?.length > 0) return msg.text.text[0];
  }
  return null;
}

async function fetchAgentReply(text, sessionId) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sessionId }),
  });

  if (!res.ok) {
    const err = new Error('HTTP_ERROR');
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  return data.reply;
}

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

  let botText = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (currentId !== requestId) {
      showTyping(false);
      return;
    }

    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS);
      if (currentId !== requestId) {
        showTyping(false);
        return;
      }
    }

    try {
      const reply = await fetchAgentReply(text, sessionId);
      botText = extractBotText(reply);
      if (botText) break;
    } catch (err) {
      if (err.message === 'HTTP_ERROR') {
        if (currentId !== requestId) {
          showTyping(false);
          return;
        }
        showTyping(false);
        addMessage(
          `Ocurrió un error al contactar al servidor (${err.status}). Intenta de nuevo más tarde.`,
          'bot',
        );
        sendBtn.disabled = false;
        sendBtn.classList.remove('loading');
        return;
      }

      if (attempt === MAX_RETRIES) {
        if (currentId !== requestId) {
          showTyping(false);
          return;
        }
        showTyping(false);
        addMessage(
          'No pude conectarme al servidor. Verifica tu conexión e intenta de nuevo.',
          'bot',
        );
        sendBtn.disabled = false;
        sendBtn.classList.remove('loading');
        return;
      }
    }
  }

  if (currentId !== requestId) {
    showTyping(false);
    return;
  }

  showTyping(false);
  addMessage(botText ?? FALLBACK_MESSAGE, 'bot');
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
