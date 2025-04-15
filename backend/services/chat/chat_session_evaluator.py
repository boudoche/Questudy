from openai import OpenAI
from services.query_chatbot import query_chatbot



def build_chat_evaluation_prompt(chat_history):
    prompt = f"""
    Based on the following chat history:

    {chat_history}

    Evaluate the user's performance concisely. Focus on:
    1. Content accuracy
    2. Key strengths
    3. Areas for improvement

    Limit your feedback to 3-4 sentences. Include a title. Format your response in HTML. Make it schematic. Do not write ```html ``` tags. 
    """
    return prompt


def evaluate_chat(chat_history):
    prompt = build_chat_evaluation_prompt(chat_history)
    response = query_chatbot("you're a helpful assistant", prompt)
    return response