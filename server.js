const express = require('express');
const cors = require('cors');

const app = express();

// Middleware: Taaki frontend API ko call kar sake
app.use(cors());
app.use(express.json()); // JSON data parse karne ke liye

// In-Memory Database (Track karne ke liye)
const studentDb = {};

// ---------------------------------------------------------
// MOCK AI FUNCTION (Yahan aap asli Gemini/OpenAI API lagayenge)
// ---------------------------------------------------------
async function callSocraticAIAgent(code, language) {
    // LLM ka system prompt logic yahan simulate kiya gaya hai
    if (code.includes('<=') && code.includes('len(')) {
        // FORMAT 2: The AI JSON (What LLM returns)
        return {
            has_bug: true,
            mistake_category: "Off-By-One Error",
            socratic_question: "Aapka logic kaafi hadd tak sahi hai! Par zara loop ki condition ko dhyan se dekhiye. Jab `i` array ki length ke barabar hoga, tab kya array index out of bounds nahi ho jayega?"
        };
    }
    
    return {
        has_bug: false,
        mistake_category: "None",
        socratic_question: "Great job! Code bilkul theek lag raha hai."
    };
}

// ---------------------------------------------------------
// MAIN API ENDPOINT
// ---------------------------------------------------------
app.post('/api/review-code', async (req, res) => {
    try {
        // FORMAT 1: The Request JSON (What frontend sends)
        const { student_id, code, language } = req.body;

        if (!student_id || !code) {
            return res.status(400).json({ error: "student_id aur code mandatory hain" });
        }

        // Step 1: Code AI ke paas bhejo
        const aiResponse = await callSocraticAIAgent(code, language);

        // Agar code mein koi galti nahi hai
        if (!aiResponse.has_bug) {
            return res.json({ 
                status: "success", 
                message: aiResponse.socratic_question 
            });
        }

        const mistake = aiResponse.mistake_category;

        // Step 2: Database mein student ki mistake track karo
        if (!studentDb[student_id]) {
            studentDb[student_id] = {};
        }

        const currentCount = (studentDb[student_id][mistake] || 0) + 1;
        studentDb[student_id][mistake] = currentCount;

        // Step 3: TA Escalation Logic Check karo
        if (currentCount >= 3) {
            // FORMAT 3a: The Response JSON (Escalated State)
            return res.json({
                status: "escalated",
                mistake_pattern: mistake,
                mistake_count: currentCount,
                message: "System Note: Lagatar 3 baar wahi galti karne par TA ko notify kar diya gaya hai."
            });
        }

        // FORMAT 3b: The Response JSON (Normal Socratic State)
        return res.json({
            status: "needs_revision",
            mistake_pattern: mistake,
            mistake_count: currentCount,
            socratic_question: aiResponse.socratic_question
        });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Server Start Karein
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Socratic AI Backend running on http://localhost:${PORT}`);
});