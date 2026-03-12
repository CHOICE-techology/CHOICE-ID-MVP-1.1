import { getVault } from '../vault/localVault';

const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';

export const calculateSovereignScore = async () => {
  const db = await getVault();
  
  // 1. Extract local "DNA" for analysis
  const identityData = await db.query('SELECT * FROM identity_vault');
  const metadata = identityData.rows.map((r: any) => r.raw_metadata);

  // 2. Construct the "Reputation Prompt"
  const prompt = `
    Analyze the following user metadata and provide a Reputation Score (0-100).
    Use this weighting:
    - 25% Wallet Trust (Age/Diversity)
    - 35% Social Authority (GitHub/LinkedIn)
    - 20% Authenticity (OAuth Verification)
    - 20% Consistency (Activity signals)
    
    Metadata: ${JSON.stringify(metadata)}
    
    Return ONLY a JSON object: {"score": number, "reasoning": "short string"}
  `;

  // 3. Call Local Ollama Instance
  try {
    const response = await fetch(OLLAMA_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        model: 'llama3', // or 'deepseek-coder'
        prompt: prompt,
        stream: false,
        format: 'json'
      }),
    });

    const result = await response.json();
    const parsed = JSON.parse(result.response);
    
    // 4. Update the Local Journal
    await db.query(
      'INSERT INTO reputation_journal (score_type, value) VALUES ($1, $2)',
      ['total_sovereign_score', parsed.score]
    );

    return parsed;
  } catch (error) {
    console.error("Ollama connection failed. Ensure 'ollama serve' is running.");
    return { score: 0, reasoning: "Local AI offline" };
  }
};
