// 初始化语音识别对象
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    console.error("This browser does not support SpeechRecognition.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN'; // 设置为中文
    recognition.interimResults = true; // 设置为true，以便在识别中显示中间结果

    let recognizing = false;
    let finalTranscript = '';

    // 开始语音识别
    function startVoiceRecognition() {
        if (!recognizing) {
            recognition.start();
            recognizing = true;
        }
    }

    // 语音识别回调函数
    recognition.onresult = function(event) {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        const input = document.getElementById('input');
        input.value = finalTranscript + interimTranscript; // 实时更新文本框
    };

    recognition.onend = function() {
        recognizing = false;
    };

    recognition.onerror = function(event) {
        console.error("SpeechRecognition error", event.error);
        recognizing = false;
    };
}

// 发送消息到后端
function sendMessage() {
    const input = document.getElementById('input');
    const message = input.value;
    input.value = '';

    // 创建一个对话记录对象
    const chatRecord = {
        user_id: 'default_user', // 默认用户ID
        ai_id: 'default_ai', // 默认AI ID
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
            // 重新加载历史记录
            loadHistory();
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
        messageElement.textContent = record.content; // 确保显示的是对话内容
        messageElement.className = 'message';
        historyContainer.appendChild(messageElement);
    });
}

// 加载历史会话列表
function loadHistory() {
    axios.get('/chat/history/list')
        .then(response => {
            const historyList = document.getElementById('history-list');
            historyList.innerHTML = ''; // 清空现有内容

            response.data.records.forEach(record => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item';
                listItem.textContent = record.timestamp;
                listItem.onclick = () => {
                    console.log(`Clicked on conversation with ID: ${record.id}`); // 调试信息
                    loadConversation(record.id);
                };
                historyList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Failed to load chat history:', error);
        });
}

// 加载特定会话
function loadConversation(conversationId) {
    console.log(`Loading conversation with ID: ${conversationId}`); // 调试信息
    axios.get(`/chat/history/${conversationId}`)
        .then(response => {
            console.log(`Received conversation data:`, response.data); // 调试信息
            displayChatHistory(response.data.records); // 确保数据传递给 displayChatHistory 函数
        })
        .catch(error => {
            console.error('Failed to load conversation:', error);
        });
}

// 显示历史记录的函数
function displayChatHistory(records) {
    const historyContainer = document.getElementById('chat-container');
    historyContainer.innerHTML = ''; // 清空现有内容

    console.log(`Displaying records:`, records); // 调试信息

    records.forEach(record => {
        const messageElement = document.createElement('div');
        messageElement.textContent = record.content; // 确保显示的是对话内容
        messageElement.className = 'message';
        historyContainer.appendChild(messageElement);
    });
}

// 页面加载时加载历史会话
window.onload = function() {
    loadHistory();
};
