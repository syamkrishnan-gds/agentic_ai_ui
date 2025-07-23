from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
import asyncio
import os

app = FastAPI()

# CORS middleware configuration to allow requests from your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Change this if your frontend URL differs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Specify the sample file path
SAMPLE_FILE_PATH = "output.txt"  # Ensure this file exists in the same directory as your script

@app.get("/stream")
async def stream_response():
    if not os.path.isfile(SAMPLE_FILE_PATH):
        raise HTTPException(status_code=404, detail="File not found")

    async def event_generator():
        with open(SAMPLE_FILE_PATH, 'r') as file:
            for line in file:
                await asyncio.sleep(1)  # Simulate processing delay
                yield line.strip()  # Yield each line directly as a string

    return EventSourceResponse(event_generator())




# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from sse_starlette.sse import EventSourceResponse
# import asyncio

# app = FastAPI()

# # CORS middleware configuration to allow requests from your React frontend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173"],  # Change this if your frontend URL differs
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# @app.get("/stream")
# async def stream_response(intent: str):
#     async def event_generator():
#         # Simulated streaming response chunks
#         chunks = [
#             f"🔍 Processing intent: {intent}",
#             "✅ Found user: John Doe",
#             "🏦 Account Type: Savings",
#             "💰 Balance: $15,000",
#             "📅 Last transaction: May 20, 2025",
#             "✅ Done."
#         ]
#         for chunk in chunks:
#             await asyncio.sleep(1)  # Simulate processing delay
#             yield {
#                 "event": "message",
#                 "data": chunk
#             }

#     return EventSourceResponse(event_generator())
