const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  try {
    const result = await model.generateContent("Hello");
    console.log("gemini-1.5-flash works:", result.response.text());
  } catch (e) {
    console.log("gemini-1.5-flash failed:", e.message);
  }

  try {
    console.log("Listing models...");
    // For Node.js, we might need to use the model manager if available, 
    // but the SDK structure is specific. 
    // Let's just try to list models if the method exists on the client or similar.
    // Actually, the SDK doesn't have a direct listModels on the client instance in all versions.
    // But we can try to just test a few known models.
  } catch (e) {
    console.log(e);
  }
}

run();
