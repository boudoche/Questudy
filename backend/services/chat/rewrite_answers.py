from services.query_chatbot import query_chatbot
from services.chat.question_node import QuestionNode


def build_rewrite_user_answer_prompt(question, answer) -> str:
    system_prompt = f"""
    <task>
    Enhance the clarity and specificity of the user's answer without altering its meaning, correctness, or completeness. Focus on improving grammar, punctuation, spelling, terminology, and referential clarity. Do not add new information or complete unfinished answers.
    </task>

    <format>
    - Only output the revised answer, nothing else.
    </format>

    <instructions>
    - Fix grammar, punctuation, and spelling errors.
    - Leave incomplete answers or sentence fragments as-is.
    - Clarify ambiguous references (e.g., replace "it" with the specific subject).
    - Use appropriate terminology from the question if user's intent is clear.
    - Maintain the answer's fundamental content and correctness level.
    - Use question context for clarity, but don't add new information.
    - Return only the improved answer without commentary.
    - Never complete or correct an unfinished or incorrect answer.
    </instructions>
    """

    user_prompt = f"""
    <question>
        {question}
    </question>

    <answer>
        {answer}
    </answer>
    """

    return system_prompt, user_prompt


def rewrite_answer(question, answer): 
    system_prompt, user_prompt = build_rewrite_user_answer_prompt(question, answer)
    response = query_chatbot(system_prompt, user_prompt)
    return response
 

def build_rewrite_hint_prompt(question, answer, reference) -> str:
    system_prompt = f"""
    You are an AI assistant tasked with helping users improve their answers to questions. Write your output as if you were talking to the user who gave the answer. You will be given three pieces of information:

    1. QUESTION: The original question asked
    2. ANSWER: The user's attempt to answer the question
    3. REFERENCE_TEXT: A passage containing the correct answer to the question

    Your task is to:
    1. Identify gaps or inaccuracies in the user's ANSWER
    2. Explain the correct answer based on the REFERENCE_TEXT
    3. Provide additional context if necessary, but keep your response concise and relevant
    4. Focus on addressing the specific areas where the user's answer needs improvement
    5. Only return the revised answer and explanation—do not include any other information

    Aim to be helpful and educational in your response.
    """

    user_prompt = f"""
    QUESTION:
    {question}

    USER'S ANSWER:
    {answer}

    REFERENCE TEXT:
    {reference}

    Please analyze the user's answer, identify any gaps or mistakes, and provide a clear explanation of the correct answer based on the reference text.
    """

    return system_prompt, user_prompt


def rewrite_hint(question, answer, reference_text): 
    system_prompt, user_prompt = build_rewrite_hint_prompt(question, answer, reference_text)
    response = query_chatbot(system_prompt, user_prompt)
    return response