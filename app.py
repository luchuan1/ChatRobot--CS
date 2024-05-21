# # from flask import Flask, request, jsonify,render_template
# # from openai import OpenAI
# # import httpx
# # app = Flask(__name__)
# #
# # client = OpenAI(
# #     base_url="https://api.xiaoai.plus/v1",
# #     api_key="sk-jysWU3A0FyYzOQfE490eB2151c974423AdD56830B86b9dC8",
# #     http_client=httpx.Client(
# #         base_url="https://api.xiaoai.plus/v1",
# #         follow_redirects=True,
# #     ),
# # )
# #
# # @app.route('/')
# # def index():
# #     return render_template('index.html')
# #
# # @app.route('/chat', methods=['POST'])
# # def chat():
# #     data = request.get_json()
# #     user_message = data.get('message')
# #     messages = [
# #         {"role": "system", "content": "You are a helpful assistant."},
# #         {"role": "user", "content": user_message}
# #     ]
# #     completion = client.chat.completions.create(
# #         model="gpt-3.5-turbo",
# #         messages=messages
# #     )
# #     response = completion.choices[0].message.content
# #     return jsonify({'response': response})
# #
# # if __name__ == '__main__':
# #     app.run(debug=True)
# from flask import Flask, request, jsonify, render_template
# from flask_sqlalchemy import SQLAlchemy
# from datetime import datetime
# import httpx
# from openai import OpenAI
# app = Flask(__name__)
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat.db'
# db = SQLAlchemy(app)
# client = OpenAI(
#     base_url="https://api.xiaoai.plus/v1",
#     api_key="sk-jysWU3A0FyYzOQfE490eB2151c974423AdD56830B86b9dC8",
#     http_client=httpx.Client(
#         base_url="https://api.xiaoai.plus/v1",
#         follow_redirects=True,
#     ),
# )
# # 定义对话记录的模型
# class Chat(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(db.String(50), nullable=False)
#     ai_id = db.Column(db.String(50), nullable=False)
#     content = db.Column(db.Text, nullable=False)
#     timestamp = db.Column(db.DateTime, default=datetime.utcnow)
#
#     # 定义一个方法来返回对话内容
#     def get_content(self):
#         return self.content
#
#     # 定义一个方法来返回对话的创建时间
#     def get_timestamp(self):
#         return self.timestamp.strftime('%Y-%m-%d %H:%M:%S')
#
# # 创建表
#
# @app.route('/')
# def index():
#     return render_template('index.html')
#
# @app.route('/chat', methods=['POST'])
# def chat():
#     data = request.get_json()
#     user_message = data.get('message')
#     messages = [
#         {"role": "system", "content": "You are a helpful assistant."},
#         {"role": "user", "content": user_message}
#     ]
#     completion = client.chat.completions.create(
#         model="gpt-3.5-turbo",
#         messages=messages
#     )
#     response = completion.choices[0].message.content
#     chat_record = Chat(user_id='user_id', ai_id='ai_id', content=user_message, timestamp=datetime.utcnow())
#     db.session.add(chat_record)
#     db.session.commit()
#     return jsonify({'response': response})
# with app.app_context():
# 	db.create_all()
#
# if __name__ == '__main__':
#     app.run(debug=True)
from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from openai import OpenAI
import httpx
import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat.db'
db = SQLAlchemy(app)
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

    # 定义一个方法来返回对话内容
    def get_content(self):
        return self.content

    # 定义一个方法来返回对话的创建时间
    def get_timestamp(self):
        return self.timestamp.strftime('%Y-%m-%d %H:%M:%S')

with app.app_context():
	db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

# 语音识别结果处理路由
@app.route('/voice', methods=['POST'])
def voice_input():
    data = request.get_json()
    message = data.get('message')

    # 处理语音识别结果，例如，将文本转换为可以与AI交互的形式
    # 这里只是一个示例，你需要根据实际情况进行处理
    processed_message = message.upper()  # 将文本转换为大写

    # 发送消息到AI
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": processed_message}
    ]
    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages
    )
    response = completion.choices[0].message.content

    # 保存对话记录
    chat_record = Chat(user_id='user_id', ai_id='ai_id', content=processed_message, timestamp=datetime.utcnow())
    db.session.add(chat_record)
    db.session.commit()

    # 返回AI的响应
    return jsonify({'response': response})

# 聊天路由
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

# 历史记录查询路由
@app.route('/chat/history', methods=['GET'])
def chat_history():
    search_term = request.args.get('searchTerm')
    # 这里你需要实现查询历史记录的逻辑
    # 例如，从数据库中检索与搜索词匹配的对话记录
    records = get_matching_records(search_term)
    return jsonify({'records': records})

# 假设这个函数用于从数据库中检索匹配的记录
def get_matching_records(search_term):
    # 这里需要实现查询逻辑
    # 例如，使用SQL查询来检索与搜索词匹配的记录
    records = Chat.query.filter(Chat.content.contains(search_term)).all()
    return records

if __name__ == '__main__':
    app.run(debug=True)#123
