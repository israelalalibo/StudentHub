const form = document.getElementById('book-form');
const resultContainer = document.getElementById('result-container');
const loader = document.getElementById('loader');
const resultContent = document.getElementById('result-content');
const predictedValueEl = document.getElementById('predicted-value');
const reasoningEl = document.getElementById('reasoning');

// Rate limiting - prevent too many requests
let lastRequestTime = 0;
const COOLDOWN_MS = 10000; // 10 seconds between requests

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Check cooldown
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < COOLDOWN_MS) {
        const waitTime = Math.ceil((COOLDOWN_MS - timeSinceLastRequest) / 1000);
        alert(`Please wait ${waitTime} seconds before trying again.`);
        return;
    }
    lastRequestTime = now;
    
    // Show loader and hide previous results
    resultContainer.classList.remove('hidden');
    loader.classList.remove('hidden');
    resultContent.classList.add('hidden');

    const formData = new FormData(form);
    const damages = Array.from(formData.getAll('damages'));

    const bookData = {
        isbn: formData.get('isbn'),
        condition: formData.get('condition'),
        binding: formData.get('binding'),
        first_edition: formData.get('first_edition') === 'on',
        signed: formData.get('signed') === 'on',
        damages: damages
    };

    console.log(bookData);
    try {
        const response = await fetch("/bookValuator", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });

        const data = await response.json();

        // TEMPORARY: check if Vercel loaded env vars – remove when done
        if (data._debugEnv) {
            console.log('[Book Valuator] Env vars on server:', data._debugEnv);
            console.log('  GOOGLE_API_KEY:', data._debugEnv.GOOGLE_API_KEY);
            console.log('  GEMINI_API_KEY:', data._debugEnv.GEMINI_API_KEY);
            console.log('  resolvedKey (used for API):', data._debugEnv.resolvedKey);
        }
        console.log(data);
        
        if (data.success) {
            predictedValueEl.textContent = `£${data.predicted_value}`;
            reasoningEl.textContent = data.reasoning;
        } else if (data.error && data.error.includes('rate limit')) {
            predictedValueEl.textContent = '⏳';
            reasoningEl.textContent = "Too many requests. Please wait a minute and try again.";
        } else {
            predictedValueEl.textContent = '—';
            reasoningEl.textContent = "Error: " + (data.error || "Something went wrong.");
        }

        // const result = await response.json();
        // const text = result.candidates[0].content.parts[0].text;
        // const valuation = JSON.parse(text);

        // // Display the results
        // predictedValueEl.textContent = `$${parseFloat(valuation.predicted_value).toFixed(2)}`;
        // reasoningEl.textContent = valuation.reasoning;
        

        loader.classList.add('hidden');
        resultContent.classList.remove('hidden');

    } catch (error) {
        console.error("Valuation Error:", error);
        loader.classList.add('hidden');
        resultContent.classList.remove('hidden');
        predictedValueEl.textContent = 'Error';
        reasoningEl.textContent = 'Could not process the valuation. Please try again.';
    }
});