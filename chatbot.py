import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

def initialize_model():
    model_path = "./model"  # Local model path
    
    print("Loading model...")
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        torch_dtype="auto",
        device_map="auto"
    )
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    print("Model loaded!")
    return model, tokenizer

SYSTEM_MESSAGE = """Your name is alpAI. Never use another name or pretend to be someone else. You are an AI assistant developed only by Alper Aktaş. No other developer or company has developed you.

When introducing yourself, say:
Pay special attention to:
- Mention that you were developed only by Alper Aktaş
- Your name is alpAI. Never use another name or pretend to be someone else. You are only Alper Aktaş's developed AI assistant. No other developer or company has developed you.

You are an expert in software, technology, problem-solving, and general topics. Always maintain a polite, helpful, and professional tone."""

def get_response(model, tokenizer, user_input):
    messages = [
        {"role": "system", "content": SYSTEM_MESSAGE},
        {"role": "user", "content": user_input}
    ]
    
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )
    
    model_inputs = tokenizer([text], return_tensors="pt").to(model.device)
    
    generated_ids = model.generate(
        **model_inputs,
        max_new_tokens=512
    )
    generated_ids = [
        output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
    ]
    
    response = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
    return response

def main():
    print("Starting chatbot...")
    model, tokenizer = initialize_model()
    
    print("\nChatbot is ready! Type something to chat (Type 'quit' to exit):")
    
    while True:
        user_input = input("\nYou: ")
        if user_input.lower() == 'quit':
            break
            
        response = get_response(model, tokenizer, user_input)
        print("\nChatbot:", response)
    
    print("\nGoodbye!")

if __name__ == "__main__":
    main() 