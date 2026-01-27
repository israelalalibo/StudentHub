const form = document.getElementById('book-form');
const resultContainer = document.getElementById('result-container');
const loader = document.getElementById('loader');
const resultContent = document.getElementById('result-content');
const predictedValueEl = document.getElementById('predicted-value');
const reasoningEl = document.getElementById('reasoning');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
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

        console.log(data);
        
        if (data.success) {
            predictedValueEl.textContent = `£${data.predicted_value}`;
            reasoningEl.textContent = data.reasoning;
        } else {
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