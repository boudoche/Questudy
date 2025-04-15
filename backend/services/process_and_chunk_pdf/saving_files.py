import os
import json
import uuid

def generate_unique_id() -> str:
    return str(uuid.uuid4())

def save_file(file, unique_id: str) -> str:
    file_format = file.filename.split('.')[-1]
    filepath = os.path.join('data', f'{unique_id}.{file_format}')
    file.save(filepath)
    return filepath

def remove_file(filepath: str) -> None:
    os.remove(filepath)

def save_chunks(chunks: list, unique_id: str) -> None:
    with open(os.path.join('data', f'{unique_id}_chunks.json'), 'w') as f:
        json.dump(chunks, f, indent=4)
