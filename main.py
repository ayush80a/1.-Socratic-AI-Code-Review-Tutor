from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

# --- 1. GEMINI AI SETUP ---
# YAHAN APNI GOOGLE AI STUDIO KI API KEY DAALEIN
API_KEY = "AIzaSyABCSDb_ViM2u28meaxcHKxq6V0aMJrqS4"
genai.configure(api_key=API_KEY)

# Hum fast aur efficient model use karenge
model = genai.GenerativeModel('gemini-2.5-flash')

app = FastAPI(title="Socratic AI Backend")

# --- 2. CORS SETUP (Frontend ko allow karne ke liye) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeSubmission(BaseModel):
    language: str
    code: str

# --- 3. REAL AI API ENDPOINT ---
@app.post("/api/review")
async def review_code(submission: CodeSubmission):
    code = submission.code
    lang = submission.language

    # Yeh PROMPT sabse zaroori hai HackBMU ke rules follow karne ke liye
    prompt = f"""
    You are an expert computer science teaching assistant. 
    The student has submitted {lang} code.
    
    CRITICAL RULES:
    1. UNDER NO CIRCUMSTANCES should you provide the corrected code or the direct answer.
    2. Analyze the code for bugs, syntax errors, or logical flaws.
    3. Generate a Socratic, guiding question that leads the student to realize their mistake themselves.
    4. Keep your response conversational, encouraging, and under 3-4 sentences.
    5. You must respond in completely pure english
    
    Student's Code:
    {code}
    """

    try:
        # AI ko prompt bhejna aur response lena
        response = model.generate_content(prompt)
        ai_reply = response.text
        
        return {
            "status": "success",
            "reply": ai_reply
        }
    except Exception as e:
        # Agar net nahi chal raha ya API key galat hai
        return {
            "status": "error",
            "reply": "Lagta hai AI engine se connection toot gaya hai. Kripya apna internet ya API key check karein. Error: " + str(e)
        }