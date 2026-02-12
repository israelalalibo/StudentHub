const form = document.getElementById('book-form');
const resultContainer = document.getElementById('result-container');
const loader = document.getElementById('loader');
const resultContent = document.getElementById('result-content');
const predictedValueEl = document.getElementById('predicted-value');
const reasoningEl = document.getElementById('reasoning');

// Mode toggle
let currentMode = 'book';

function setMode(mode) {
    currentMode = mode;
    document.getElementById('appraisal-mode').value = mode;

    const bookFields = document.getElementById('book-fields');
    const itemFields = document.getElementById('item-fields');
    const modeBookBtn = document.getElementById('mode-book');
    const modeItemBtn = document.getElementById('mode-item');

    if (mode === 'book') {
        bookFields.classList.remove('hidden');
        itemFields.classList.add('hidden');
        modeBookBtn.classList.add('bg-indigo-600', 'text-white');
        modeBookBtn.classList.remove('text-gray-700');
        modeItemBtn.classList.remove('bg-indigo-600', 'text-white');
        modeItemBtn.classList.add('text-gray-700');
        document.getElementById('isbn').required = true;
        document.getElementById('item-name').required = false;
    } else {
        bookFields.classList.add('hidden');
        itemFields.classList.remove('hidden');
        modeItemBtn.classList.add('bg-indigo-600', 'text-white');
        modeItemBtn.classList.remove('text-gray-700');
        modeBookBtn.classList.remove('bg-indigo-600', 'text-white');
        modeBookBtn.classList.add('text-gray-700');
        document.getElementById('isbn').required = false;
        document.getElementById('item-name').required = true;
    }
}

// Expose to global scope for onclick handlers
window.setMode = setMode;

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

    try {
        let response;

        if (currentMode === 'book') {
            // Existing book appraisal logic
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

            response = await fetch("/bookValuator", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });
        } else {
            // General item appraisal - multipart for image support
            const itemFormData = new FormData();
            itemFormData.append('item_name', document.getElementById('item-name').value);
            itemFormData.append('item_description', document.getElementById('item-description').value || '');
            itemFormData.append('item_condition', document.getElementById('item-condition').value);
            itemFormData.append('item_category', document.getElementById('item-category').value);

            const imageFile = document.getElementById('item-image').files[0];
            if (imageFile) {
                itemFormData.append('item_image', imageFile);
            }

            response = await fetch("/itemValuator", {
                method: 'POST',
                body: itemFormData
            });
        }

        const data = await response.json();

        if (data.success) {
            predictedValueEl.textContent = `£${data.predicted_value}`;
            reasoningEl.textContent = data.reasoning;
        } else if (data.error && (data.error.toLowerCase().includes('quota') || data.error.toLowerCase().includes('resource_exhausted'))) {
            predictedValueEl.textContent = '❌';
            reasoningEl.textContent = "API quota exceeded. Please check your Google AI Studio billing and quota limits. Visit https://ai.google.dev/gemini-api/docs/quota for more information.";
        } else if (data.error && data.error.toLowerCase().includes('rate limit')) {
            predictedValueEl.textContent = '⏳';
            reasoningEl.textContent = "Too many requests. Please wait a minute and try again.";
        } else {
            predictedValueEl.textContent = '—';
            reasoningEl.textContent = "Error: " + (data.error || "Something went wrong.");
        }

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
