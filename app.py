from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import logging
from openai import OpenAI
import httpx
import os

app = Flask(__name__)

# 设置数据库路径指向 instance 目录中的 chat.db 文件
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.instance_path, 'chat.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 确保 instance 文件夹存在
os.makedirs(app.instance_path, exist_ok=True)

db = SQLAlchemy(app)

logging.basicConfig(level=logging.DEBUG)

client = OpenAI(
    base_url="https://api.xiaoai.plus/v1",
    api_key="sk-jysWU3A0FyYzOQfE490eB2151c974423AdD56830B86b9dC8",
    http_client=httpx.Client(
        base_url="https://api.xiaoai.plus/v1",
        follow_redirects=True,
    ),
)

# 定义对话记录的模型
class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), nullable=False)
    ai_id = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def get_content(self):
        return self.content

    def get_timestamp(self):
        return (self.timestamp + timedelta(hours=8)).strftime('%Y-%m-%d %H:%M:%S')

with app.app_context():
    db.create_all()
    logging.debug("Database tables created")
    logging.debug(f"Database file path: {os.path.abspath(os.path.join(app.instance_path, 'chat.db'))}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message')
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": user_message}
    ]
    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages
    )
    response = completion.choices[0].message.content
    return jsonify({'response': response})

@app.route('/chat/history', methods=['GET'])
def chat_history():
    search_term = request.args.get('searchTerm')
    records = Chat.query.filter(Chat.content.contains(search_term)).all()
    return jsonify({'records': [r.get_content() for r in records]})

@app.route('/chat/history/list', methods=['GET'])
def chat_history_list():
    records = Chat.query.order_by(Chat.timestamp.desc()).all()
    return jsonify({'records': [{'id': r.id, 'timestamp': r.get_timestamp()} for r in records]})

@app.route('/chat/history/<int:conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    records = Chat.query.filter_by(id=conversation_id).all()
    return jsonify({'records': [{'content': r.get_content(), 'timestamp': r.get_timestamp()} for r in records]})

@app.route('/chat/record', methods=['POST'])
def save_record():
    data = request.get_json()
    logging.debug(f"Received data: {data}")
    chat_record = Chat(
        user_id=data.get('user_id', 'default_user'),
        ai_id=data.get('ai_id', 'default_ai'),
        content=data.get('content'),
        timestamp=datetime.utcnow()
    )
    db.session.add(chat_record)
    db.session.commit()
    logging.debug(f"Saved record: {chat_record.id}")
    return jsonify({'message': 'Chat record saved successfully', 'id': chat_record.id})


if __name__ == '__main__':
    app.run(debug=True)
