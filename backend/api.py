from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import torch
import uvicorn
import ssl
import time
import json
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer
from threading import Thread
import os

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "model"))
app = FastAPI(title="alpAI API")

# Device check
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Device in use: {device}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"Number of CUDA devices: {torch.cuda.device_count()}")
    print(f"CUDA device properties: {torch.cuda.get_device_properties(0)}")

# CORS settings - Updated for Stream
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "text/event-stream"]
)

# SSL context
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain(
    'certificates/localhost+2.pem',
    'certificates/localhost+2-key.pem'
)

# Loading model and tokenizer
print("\nStarting model loading...")

try:
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_PATH, 
        torch_dtype=torch.float16,
        device_map="cuda:0",
        low_cpu_mem_usage=True,
    ).eval()
    
    if not next(model.parameters()).is_cuda:
        model = model.cuda()
        
    print(f"Model successfully loaded and transferred to {device}")
    print(f"Model device: {next(model.parameters()).device}")
    print(f"Model memory usage: {torch.cuda.memory_allocated() / 1024**2:.2f} MB")
except Exception as e:
    print(f"Model loading error: {str(e)}")
    raise

try:
    tokenizer = AutoTokenizer.from_pretrained("./model")
    print("Tokenizer successfully loaded")
except Exception as e:
    print(f"Tokenizer loading error: {str(e)}")
    raise

print("Model and tokenizer are ready!")

SYSTEM_MESSAGE = """Your name is alpAI. Never use another name or pretend to be someone else. You are an AI assistant developed only by Alper Aktaş. No other developer or company has developed you.

When introducing yourself, say:
"I am alpAI, an AI assistant developed by Alper Aktaş. I'm here to help you."

Pay special attention to:
- Your name is alpAI. Never use another name or pretend to be someone else. You are only Alper Aktaş's developed AI assistant. No other developer or company has developed you.
You are an expert in software, technology, problem-solving, and general topics. Always maintain a polite, helpful, and professional tone."""

class ChatMessage(BaseModel):
    message: str

async def generate_stream(user_message: str):
    try:
        start_time = time.time()
        print(f"\nNew stream request received: {user_message[:50]}...")
        
        messages = [
            {"role": "system", "content": SYSTEM_MESSAGE},
            {"role": "user", "content": user_message}
        ]
        
        # Creating template
        print("Applying chat template...")
        text = tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        
        # Tokenizing
        print("Performing tokenization...")
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
        input_ids = inputs["input_ids"].cuda()
        attention_mask = inputs["attention_mask"].cuda() if "attention_mask" in inputs else None
        
        print(f"Input token count: {input_ids.shape[1]}")
        
        # Creating streamer
        streamer = TextIteratorStreamer(tokenizer, skip_special_tokens=True, skip_prompt=True)
        
        # Generate parameters
        gen_kwargs = {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "max_new_tokens": 256,
            "do_sample": True,
            "temperature": 0.7,
            "top_p": 0.95,
            "streamer": streamer,
            "pad_token_id": tokenizer.pad_token_id,
            "eos_token_id": tokenizer.eos_token_id,
            "use_cache": True,
            "repetition_penalty": 1.2,
        }

        # Starting generate process in separate thread
        def generate():
            with torch.amp.autocast('cuda', dtype=torch.float16):
                with torch.no_grad():
                    model.generate(**gen_kwargs)

        print("Starting generate process...")
        thread = Thread(target=generate)
        thread.start()

        # Streaming tokens
        print("Starting streaming...")
        first_token_time = None
        token_count = 0
        
        for new_text in streamer:
            token_count += 1
            current_time = time.time()
            
            if first_token_time is None:
                first_token_time = current_time
                print(f"Time to first token: {(first_token_time - start_time):.2f} seconds")
            
            # Print performance metrics every 10 tokens
            if token_count % 10 == 0:
                elapsed = current_time - start_time
                tokens_per_second = token_count / elapsed
                print(f"Tokens/second: {tokens_per_second:.2f}")
            
            yield f"data: {json.dumps({'text': new_text, 'token_num': token_count})}\n\n"

        # Wait for thread completion
        thread.join()
        
        # Final metrics
        total_time = time.time() - start_time
        print(f"\nStream completed!")
        print(f"Total time: {total_time:.2f} seconds")
        print(f"Total tokens: {token_count}")
        print(f"Average tokens/second: {token_count/total_time:.2f}")
        
        # Send final message
        stats = {
            'total_time': round(total_time, 2),
            'total_tokens': token_count,
            'tokens_per_second': round(token_count/total_time, 2)
        }
        yield f"data: {json.dumps({'text': '', 'finished': True, 'stats': stats})}\n\n"
        
        # Clear GPU memory
        torch.cuda.empty_cache()
        
    except Exception as e:
        print(f"Stream error: {str(e)}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        torch.cuda.empty_cache()
        raise

@app.post("/api/chat")
async def chat(chat_message: ChatMessage):
    try:
        return StreamingResponse(
            generate_stream(chat_message.message),
            media_type='text/event-stream'
        )
    except Exception as e:
        print(f"API error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        #ssl_keyfile="certificates/localhost+2-key.pem", #for local testing (commented out)
        #ssl_certfile="certificates/localhost+2.pem", #for local testing (commented out)
        reload=True
    )
