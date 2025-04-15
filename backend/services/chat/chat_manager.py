from typing import List, Optional, Dict, Any
from services.chat.question_node import QuestionNode

class ChatManager:
    """
    The ChatManager class manages a flow of questions and responses,  
    and keeps track of the level at which we are in the tree.
    """
    def __init__(self, initial_questions: List[dict]):
        # Initialize a list of QuestionNode objects from the initial questions
        self.questions: List[QuestionNode] = [QuestionNode(q['text'], q['question'], question_type='basic') for q in initial_questions]
        
        # Link the questions together to form a linked list
        for i in range(len(self.questions) - 1):
            self.questions[i].next_question = self.questions[i + 1] 
         
        # Set the current node to the first question in the list
        self.root_question = self.current_node = self.questions[0] if self.questions else None
        
        # Initialize the level counter
        self.level = 0
        
        # Additional variables to keep track of the state
        self.total_questions = len(self.questions)  # Total number of questions
        self.current_core_question_index = 0  # Index of the current question being considered
        self.current_child_index = 0  # Index of the current child question being considered
        self.current_child_count = 0

    def get_current_question(self) -> Optional[QuestionNode]:
        return self.current_node
 
    def move_to_next_question(self):
        """
        Moves to the next question in the tree based on the rules:
        1. If the current node has children, move to the first child.
        2. If not, move to the `next_question`.
        3. If there's no `next_question`, move to the parent's `next_question`.
        4. Repeat until we reach a node that has no children, no next, and no parent. 
        """
        if self.current_node.first_child:
            # Move to the first child if available
            self.current_node = self.current_node.first_child
            self.level += 1  # Moving deeper into the tree (increment level)
            
        elif self.current_node.next_question:
            # Move to the next question if available
            self.current_node = self.current_node.next_question
            if self.current_node.question_type == "refinement": 
                self.current_child_index += 1
            else:
                self.current_core_question_index += 1  # Increment the current question index
        else:
            # Traverse upwards to find the next available question
            while self.current_node.parent and not self.current_node.next_question:
                self.current_node = self.current_node.parent
                self.level -= 1  # Moving back up the tree (decrement level)
            self.current_node = self.current_node.next_question

            self.current_core_question_index += 1
            self.current_child_count = 0
         
        if self.current_node is None:
            print("Reached the end of the question tree.")

    def add_refinement_question(self, current_question: QuestionNode, refinement_question: str) -> None:
        """Refinement questions are asked to get the user closer to the correct answer. They don't have a refer"""
        
        if current_question.question_type == "basic":
            refinement_node = QuestionNode(current_question.text, refinement_question, parent=current_question, question_type="refinement")
            current_question.add_child(refinement_node)
            
        elif current_question.question_type == "refinement":  # only allow one layer of refinement questions, parent is the same for all refinement questions
            refinement_node = QuestionNode(current_question.text, refinement_question, parent=current_question.parent, question_type="refinement")
            current_question.next_question = refinement_node

        else: 
            raise ValueError("Invalid question type for adding a refinement question.")
        
    def add_multiple_refinement_questions(self, current_question: QuestionNode, multiple_refinement_questions: List[str]) -> None:
        """Add multiple refinement questions to the current question node."""
        for n, refinement_question in enumerate(multiple_refinement_questions):
            if current_question and refinement_question: 
                self.add_refinement_question(current_question, refinement_question)
                if n == 0: 
                    current_question = current_question.first_child
                else: 
                    current_question = current_question.next_question

        self.current_child_count = len(multiple_refinement_questions)

    def is_finished(self) -> bool:
        return self.current_node is None

    def get_level(self) -> int:
        """Returns the current level in the question tree."""
        return self.level
    
    def get_total_questions(self) -> int:
        """Returns the total number of questions in the tree."""
        return self.total_questions

    def get_current_question_index(self) -> int:
        """Returns the index of the current question being considered."""
        return self.current_core_question_index

    def get_current_child_count(self) -> int:
        """Returns the number of child questions for the current question."""
        return self.current_child_count

    def get_current_child_index(self) -> int:
        """Returns the index of the current child question being considered."""
        return self.current_child_index
