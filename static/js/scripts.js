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

const conversation = {
    user_id: 'default_user',
    ai_id: 'default_ai',
    messages: []
};

// 发送消息到后端
function sendMessage() {
    const input = document.getElementById('input');
    const message = input.value;
    input.value = '';

    // 保存到会话记录中
    conversation.messages.push({
        role: 'user',
        content: message
    });

    // 显示用户消息
    const userMessage = document.createElement('div');
    userMessage.textContent = message;
    userMessage.className = 'message user-message show';
    document.getElementById('chat-container').appendChild(userMessage);

    // 发送消息到后端
    axios.post('/chat', { message: message })
        .then(response => {
            // 创建一个AI消息元素
            const aiMessage = document.createElement('div');
            aiMessage.textContent = response.data.response;
            aiMessage.className = 'message ai-message show';
            document.getElementById('chat-container').appendChild(aiMessage);

            // 保存AI响应到会话记录中
            conversation.messages.push({
                role: 'assistant',
                content: response.data.response
            });
        })
        .catch(error => {
            console.error(error);
        });
}

// 保存对话记录的函数
function saveConversation() {
    axios.post('/chat/record', conversation)
        .then(response => {
            console.log('Conversation saved successfully:', response.data);
            // 清空当前会话
            conversation.messages = [];
            // 重新加载历史记录
            loadHistory();
        })
        .catch(error => {
            console.error('Failed to save conversation:', error);
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

    console.log(`Displaying records:`, records); // 调试信息

    records.forEach(record => {
        const messageElement = document.createElement('div');
        messageElement.textContent = record.content; // 确保显示的是对话内容
        messageElement.className = 'message ai-message show'; // 确保使用 ai-message 类名
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
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                listItem.innerHTML = `
                    ${record.timestamp}
                    <button class="btn btn-danger btn-sm" onclick="deleteConversation(${record.id}, event)">Delete</button>
                `;
                listItem.onclick = (event) => {
                    if (event.target.tagName !== 'BUTTON') {
                        console.log(`Clicked on conversation with ID: ${record.id}`); // 调试信息
                        loadConversation(record.id);
                    }
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

// 删除会话记录的函数
function deleteConversation(conversationId, event) {
    event.stopPropagation(); // 防止触发父元素的点击事件
    console.log(`Deleting conversation with ID: ${conversationId}`); // 调试信息
    axios.delete(`/chat/record/${conversationId}`)
        .then(response => {
            console.log('Chat record deleted successfully:', response.data);
            // 重新加载历史记录
            loadHistory();
        })
        .catch(error => {
            console.error('Failed to delete chat record:', error);
        });
}

// 页面加载时加载历史会话
window.onload = function() {
    loadHistory();
};
