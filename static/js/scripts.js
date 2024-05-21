//function sendMessage() {
//   const input = document.getElementById('input');
//   const message = input.value;
//   input.value = '';
//
//   const messages = document.getElementById('chat-container');
//   const userMessage = document.createElement('div');
//   userMessage.textContent = 'You: ' + message;
//   userMessage.className = 'message user-message';
//   messages.appendChild(userMessage);
//
//   // 显示用户消息
//   setTimeout(() => userMessage.classList.add('show'), 10);
//
//   axios.post('/chat', { message: message })
//       .then(response => {
//           const aiMessage = document.createElement('div');
//           aiMessage.textContent = 'AI: ' + response.data.response;
//           aiMessage.className = 'message ai-message';
//           messages.appendChild(aiMessage);
//
//           // 显示AI消息
//           setTimeout(() => aiMessage.classList.add('show'), 10);
//       })
//       .catch(error => {
//           console.error(error);
//       })
//       .finally(() => {
//           // 滚动到底部
//           messages.scrollTop = messages.scrollHeight;
//       });
//}
// 初始化语音识别
const recognition = new SpeechRecognition();
recognition.lang = 'en-US'; // 设置为英文
recognition.interimResults = true; // 设置为true，以便在识别中显示中间结果

// 开始语音识别
function startVoiceRecognition() {
    recognition.start();
}

// 语音识别回调函数
recognition.onresult = function(event) {
    const interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            const input = document.getElementById('input');
            input.value += transcript;
            sendMessage(); // 发送消息到后端
        } else {
            interimTranscript += transcript;
        }
    }
};

// 发送消息到后端
function sendMessage() {
    const input = document.getElementById('input');
    const message = input.value;
    input.value = '';

    // 创建一个对话记录对象
    const chatRecord = {
        user_id: 'user_id', // 需要替换为实际的用户ID
        ai_id: 'ai_id', // 需要替换为实际的AI ID
        content: message,
        timestamp: new Date().toISOString()
    };

    // 保存对话记录
    saveChatRecord(chatRecord);

    // 显示用户消息
    const userMessage = document.createElement('div');
    userMessage.textContent = message;
    userMessage.className = 'message user-message';
    setTimeout(() => userMessage.classList.add('show'), 10);
    document.getElementById('chat-container').appendChild(userMessage);

    // 发送消息到后端
    axios.post('/chat', { message: message })
        .then(response => {
            // 创建一个AI消息元素
            const aiMessage = document.createElement('div');
            aiMessage.textContent = response.data.response;
            aiMessage.className = 'message ai-message';
            setTimeout(() => aiMessage.classList.add('show'), 10);
            document.getElementById('chat-container').appendChild(aiMessage);
        })
        .catch(error => {
            console.error(error);
        });
}

// 保存对话记录的函数
function saveChatRecord(chatRecord) {
    axios.post('/chat/record', chatRecord)
        .then(response => {
            console.log('Chat record saved successfully:', response.data);
        })
        .catch(error => {
            console.error('Failed to save chat record:', error);
        });
}

// 查询历史记录的函数
function searchChatHistory() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput.value;
    searchInput.value = '';

    axios.get('/chat/history', { params: { searchTerm: searchTerm } })
        .then(response => {
            // 假设响应中有一个名为 'records' 的数组
            const records = response.data.records;
            displayChatHistory(records);
        })
        .catch(error => {
            console.error('Failed to search chat history:', error);
        });
}

// 显示历史记录的函数
function displayChatHistory(records) {
    const historyContainer = document.getElementById('chat-container');
    historyContainer.innerHTML = ''; // 清空现有内容

    records.forEach(record => {
        const messageElement = document.createElement('div');
        messageElement.textContent = record.content;
        messageElement.className = 'message';
        historyContainer.appendChild(messageElement);
    });
}
