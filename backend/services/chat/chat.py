import json
from typing import Optional, List, Tuple, Dict
from openai import OpenAI
import copy
import time
from services.chat.question_node import QuestionNode
from services.chat.question_evaluator import evaluate_core_answer, evaluate_multiple_refinement_answers
from services.chat.chat_manager import ChatManager
from services.chat.rewrite_answers import rewrite_hint
from services.chat.create_questions import create_multiple_refinement_questions
from services.chat.chat_session_evaluator import evaluate_chat

client = OpenAI()

class Chat:
    def __init__(self, initial_questions: List[dict]):
        self.chat_manager = ChatManager(initial_questions)
        self.chat = []


    def process_and_evaluate_answer(self, answer: str) -> dict:
        current_question = self.chat_manager.get_current_question()
        current_question.answer = answer
        
        if current_question.question_type == "basic":
            score, full_evaluation = evaluate_core_answer(current_question)
        elif current_question.question_type == "refinement": 
            score, full_evaluation = evaluate_multiple_refinement_answers(current_question)

        self.chat.append({
            "question": current_question.question,
            "answer": answer,
            "score": score,
            "feedback": full_evaluation
        })
        
        current_question.feedbacks_given.append(full_evaluation)
        
        result = {
            "score": score,
            "feedback": full_evaluation, 
            "move_to_next": False,
            "improperly_answered": False, 
        }
        
        if score != "correct" and score != "perfect":
            if current_question.question_type == "basic":
                # processing core questions
                multiple_refinement_questions = create_multiple_refinement_questions(current_question, answer, full_evaluation)
                print("questions\n", multiple_refinement_questions, "\n\n")
                self.chat_manager.add_multiple_refinement_questions(current_question, multiple_refinement_questions)
                result['move_to_next'] = True
            elif len(current_question.feedbacks_given) == 2 and current_question.question_type == "refinement":
                 # question can't be answered, thus moving to next question and says it
                result["improperly_answered"] = True
                result["move_to_next"] = True
            elif len(current_question.feedbacks_given) ==1 and current_question.question_type == "refinement":
                # question already has a feedback, asking it another time with reference text
                result["text"] = rewrite_hint(current_question.question, current_question.answer, current_question.text)
        else:
            # if correct or perfect, simply pass to next question
            result["move_to_next"] = True
        
        if result["move_to_next"]:
            self.chat_manager.move_to_next_question()
    
        
        return result
    
    def get_chat_history(self) -> List[dict]:
        return self.chat
    
    def get_chat_history_json(self) -> str:
        return json.dumps(self.get_chat_history())
    
    def get_chat_evaluation(self) -> str:
        return evaluate_chat(self.get_chat_history_json())

    def run_chat_cmd(self):
        """Run chat from cmd only for testing"""
        while not self.chat_manager.is_finished():
            question_node = self.chat_manager.get_current_question()
            print("Current Question:", question_node.question)
            # print("Reference Text:", question_node.text)
            answer = input("Your answer: ")
            # print('wake up')
            score, full_evaluation = self.process_and_evaluate_answer(answer)
            print("Feedback:", full_evaluation)

        print("Learning session complete.")



def load_data_json(filepath='data/best_chunks.json'):
    with open(filepath, 'r') as file:
        data_json = json.load(file)
    return data_json


if __name__ == "__main__":
    with open("data/e1d2f3d1-7729-4549-b3a9-8331de62299f_chunks.json") as f:
        initial_questions = json.load(f)
    chat = Chat(initial_questions)
    chat.run_chat_cmd()



