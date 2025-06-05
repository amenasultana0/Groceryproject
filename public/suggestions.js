// Configuration - REPLACE WITH YOUR ACTUAL API KEY
const GEMINI_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE'; // ⚠️ Replace this with your real API key
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Global variables
let ingredients = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for Enter key in ingredient input
    const ingredientInput = document.getElementById('ingredientInput');
    if (ingredientInput) {
        ingredientInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addIngredient();
            }
        });
    }
    
    // Load saved ingredients from memory
    loadSavedIngredients();
    
    // Check API key setup
    if (GEMINI_API_KEY === 'YOUR_ACTUAL_API_KEY_HERE') {
        console.warn('⚠️ WARNING: Please set your actual Gemini API key in script.js');
        showApiKeyWarning();
    } else {
        console.log('✅ API Key configured');
    }
    
    // Add search functionality
    initializeSearch();
});

// Show API key warning
function showApiKeyWarning() {
    const container = document.getElementById('recipesContainer');
    if (container) {
        container.innerHTML = `
            <div class="error-container">
                <i class="fas fa-key"></i>
                <h3>API Key Required</h3>
                <p>Please set your Gemini API key in the script.js file to use recipe generation.</p>
                <div class="troubleshooting api-key">
                    <strong>Steps to fix:</strong>
                    <ul>
                        <li>Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
                        <li>Replace 'YOUR_ACTUAL_API_KEY_HERE' with your actual key in script.js</li>
                        <li>Refresh the page</li>
                    </ul>
                </div>
                <div class="error-actions">
                    <button onclick="displayRecipes(getMockRecipes())" class="mock-btn">
                        Use Sample Recipes Instead
                    </button>
                </div>
            </div>
        `;
    }
}

// Add ingredient function
function addIngredient() {
    const input = document.getElementById('ingredientInput');
    if (!input) return;
    
    const ingredient = input.value.trim();
    
    if (!ingredient) return;
    
    if (ingredient.length < 2) {
        alert('Please enter at least 2 characters');
        return;
    }
    
    // Check for duplicates (case insensitive)
    if (ingredients.some(item => item.toLowerCase() === ingredient.toLowerCase())) {
        alert('This ingredient is already added');
        input.value = '';
        return;
    }
    
    ingredients.push(ingredient);
    input.value = '';
    updateIngredientTags();
    saveIngredients();
}

// Remove ingredient function
function removeIngredient(ingredient) {
    ingredients = ingredients.filter(item => item !== ingredient);
    updateIngredientTags();
    saveIngredients();
}

// Update ingredient tags display
function updateIngredientTags() {
    const container = document.getElementById('ingredientTags');
    if (!container) return;
    
    container.innerHTML = '';
    
    ingredients.forEach(ingredient => {
        const tag = document.createElement('div');
        tag.className = 'ingredient-tag';
        tag.innerHTML = `
            <span>${ingredient}</span>
            <button class="remove-btn" onclick="removeIngredient('${ingredient.replace(/'/g, "\\'")}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(tag);
    });
}

// Save ingredients to memory
function saveIngredients() {
    window.savedIngredients = ingredients;
}

// Load saved ingredients from memory
function loadSavedIngredients() {
    if (window.savedIngredients) {
        ingredients = window.savedIngredients;
        updateIngredientTags();
    }
}

// Modal functions
function showIngredientModal() {
    const modal = document.getElementById('ingredientModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeIngredientModal() {
    const modal = document.getElementById('ingredientModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function selectInventoryItem(ingredient) {
    const item = event.target.closest('.inventory-item');
    
    if (ingredients.includes(ingredient)) {
        removeIngredient(ingredient);
        if (item) item.classList.remove('selected');
    } else {
        ingredients.push(ingredient);
        if (item) item.classList.add('selected');
        updateIngredientTags();
        saveIngredients();
    }
}

// Main recipe generation function
async function generateRecipes() {
    if (ingredients.length === 0) {
        alert('Please add some ingredients first!');
        return;
    }
    
    console.log('🚀 Starting recipe generation with ingredients:', ingredients);
    
    const generateBtn = document.getElementById('generateBtn');
    const loadingState = document.getElementById('loadingState');
    const recipesContainer = document.getElementById('recipesContainer');
    
    // Show loading state
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    }
    if (loadingState) {
        loadingState.style.display = 'block';
    }
    if (recipesContainer) {
        recipesContainer.innerHTML = '';
    }
    
    try {
        const recipes = await fetchRecipesFromGemini(ingredients);
        displayRecipes(recipes);
        console.log('✅ Recipes generated successfully');
    } catch (error) {
        console.error('❌ Error generating recipes:', error);
        showDetailedError(error);
    } finally {
        // Hide loading state
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Recipe Suggestions';
        }
        if (loadingState) {
            loadingState.style.display = 'none';
        }
    }
}

// Enhanced Gemini API function
async function fetchRecipesFromGemini(ingredients) {
    console.log('🔍 API Debug Info:');
    console.log('- Using Gemini 1.5 Flash model');
    console.log('- API Key configured:', GEMINI_API_KEY !== 'YOUR_ACTUAL_API_KEY_HERE');
    console.log('- Ingredients:', ingredients);
    
    // Check if API key is set
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_ACTUAL_API_KEY_HERE') {
        console.log('⚠️ API key not configured, using mock data');
        return getMockRecipes();
    }

    const prompt = `You are a helpful cooking assistant. Based on these available ingredients: ${ingredients.join(', ')}, please suggest 4-6 practical and delicious recipes.

For each recipe, provide:
- A clear, appealing name
- Difficulty level (Easy, Medium, or Hard)  
- Cooking time in minutes
- Number of servings
- A brief description (1-2 sentences)
- List of ingredients needed (focus on the provided ingredients but you can include common pantry items)
- Step-by-step cooking instructions

Return your response as a JSON array with this exact structure:
[
    {
        "name": "Recipe Name",
        "difficulty": "Easy",
        "cookingTime": 30,
        "servings": 4,
        "description": "Brief description of the dish",
        "ingredients": ["ingredient1", "ingredient2", "ingredient3"],
        "instructions": ["Step 1 instruction", "Step 2 instruction", "Step 3 instruction"]
    }
]

Important: Return ONLY the JSON array, no other text, explanations, or formatting.`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
        },
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH", 
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
    };
    
    console.log('📤 Sending request to Gemini API...');
    
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('🚨 API Error Response:', errorText);
            
            let errorMessage = `API request failed (${response.status})`;
            
            try {
                const errorData = JSON.parse(errorText);
                if (errorData.error && errorData.error.message) {
                    errorMessage = errorData.error.message;
                }
            } catch (e) {
                if (errorText) {
                    errorMessage = errorText;
                }
            }
            
            // Provide specific error messages
            if (response.status === 400) {
                throw new Error(`Bad Request: ${errorMessage}. Please check your API key and request format.`);
            } else if (response.status === 403) {
                throw new Error(`Access Denied: ${errorMessage}. Your API key may be invalid or doesn't have permission to use the Gemini API.`);
            } else if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again.');
            } else {
                throw new Error(errorMessage);
            }
        }
        
        const data = await response.json();
        console.log('📊 Full API Response:', data);
        
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error('No response generated by the API');
        }
        
        const candidate = data.candidates[0];
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            throw new Error('Empty response from API');
        }
        
        const responseText = candidate.content.parts[0].text;
        console.log('📝 Raw response text:', responseText);
        
        // Clean the response text to extract JSON
        let cleanedResponse = responseText.trim();
        
        // Remove any markdown code blocks
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Find the JSON array in the response
        const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.error('❌ No JSON array found in response');
            throw new Error('Invalid response format from API');
        }
        
        const jsonString = jsonMatch[0];
        console.log('🔍 Extracted JSON:', jsonString);
        
        try {
            const recipes = JSON.parse(jsonString);
            
            if (!Array.isArray(recipes)) {
                throw new Error('Response is not an array');
            }
            
            // Validate recipe structure
            const validRecipes = recipes.filter(recipe => {
                return recipe.name && recipe.difficulty && recipe.cookingTime && 
                       recipe.servings && recipe.description && 
                       Array.isArray(recipe.ingredients) && Array.isArray(recipe.instructions);
            });
            
            if (validRecipes.length === 0) {
                throw new Error('No valid recipes found in response');
            }
            
            console.log(`✅ Successfully parsed ${validRecipes.length} recipes`);
            return validRecipes;
            
        } catch (parseError) {
            console.error('❌ JSON parsing error:', parseError);
            console.log('🔍 Attempting to use mock data as fallback');
            return getMockRecipes();
        }
        
    } catch (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        throw fetchError;
    }
}

// Display recipes function
function displayRecipes(recipes) {
    const container = document.getElementById('recipesContainer');
    if (!container) return;
    
    if (!recipes || recipes.length === 0) {
        container.innerHTML = `
            <div class="no-recipes">
                <i class="fas fa-utensils"></i>
                <h3>No recipes found</h3>
                <p>Try adding different ingredients or check your API connection.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recipes.map(recipe => `
        <div class="recipe-card">
            <div class="recipe-header">
                <h3 class="recipe-title">${recipe.name}</h3>
                <div class="recipe-meta">
                    <span class="difficulty ${recipe.difficulty.toLowerCase()}">${recipe.difficulty}</span>
                    <span class="time"><i class="fas fa-clock"></i> ${recipe.cookingTime} min</span>
                    <span class="servings"><i class="fas fa-users"></i> ${recipe.servings} servings</span>
                </div>
            </div>
            
            <div class="recipe-description">
                <p>${recipe.description}</p>
            </div>
            
            <div class="recipe-content">
                <div class="ingredients-section">
                    <h4><i class="fas fa-list"></i> Ingredients</h4>
                    <ul class="ingredients-list">
                        ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="instructions-section">
                    <h4><i class="fas fa-clipboard-list"></i> Instructions</h4>
                    <ol class="instructions-list">
                        ${recipe.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                    </ol>
                </div>
            </div>
        </div>
    `).join('');
}

// Mock recipes for testing/fallback
function getMockRecipes() {
    return [
        {
            name: "Quick Vegetable Stir Fry",
            difficulty: "Easy",
            cookingTime: 15,
            servings: 2,
            description: "A colorful and nutritious stir fry that's ready in minutes.",
            ingredients: ["Mixed vegetables", "Soy sauce", "Garlic", "Ginger", "Oil"],
            instructions: [
                "Heat oil in a large pan or wok over high heat",
                "Add minced garlic and ginger, stir for 30 seconds",
                "Add vegetables and stir fry for 5-7 minutes",
                "Add soy sauce and toss to combine",
                "Serve immediately over rice"
            ]
        },
        {
            name: "Simple Pasta Aglio e Olio",
            difficulty: "Easy",
            cookingTime: 20,
            servings: 4,
            description: "Classic Italian pasta with garlic and olive oil.",
            ingredients: ["Spaghetti", "Garlic", "Olive oil", "Red pepper flakes", "Parsley"],
            instructions: [
                "Cook spaghetti according to package directions",
                "Heat olive oil in a large pan",
                "Add sliced garlic and red pepper flakes",
                "Add cooked pasta and pasta water",
                "Toss with fresh parsley and serve"
            ]
        },
        {
            name: "Classic Chicken Sandwich",
            difficulty: "Medium",
            cookingTime: 25,
            servings: 2,
            description: "Juicy grilled chicken breast served on fresh bread with crisp vegetables.",
            ingredients: ["Chicken breast", "Bread", "Lettuce", "Tomato", "Mayo", "Salt", "Pepper"],
            instructions: [
                "Season chicken breast with salt and pepper",
                "Grill chicken for 6-7 minutes per side until cooked through",
                "Toast bread slices until golden",
                "Spread mayo on bread",
                "Layer lettuce, tomato, and chicken",
                "Serve immediately"
            ]
        }
    ];
}

// Error handling function
function showDetailedError(error) {
    const container = document.getElementById('recipesContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-container">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Oops! Something went wrong</h3>
            <p class="error-message">${error.message}</p>
            <div class="troubleshooting">
                <strong>Troubleshooting tips:</strong>
                <ul>
                    <li>Check your internet connection</li>
                    <li>Verify your API key is correct</li>
                    <li>Make sure you have API quota remaining</li>
                    <li>Try again in a few moments</li>
                </ul>
            </div>
            <div class="error-actions">
                <button onclick="generateRecipes()" class="retry-btn">
                    <i class="fas fa-redo"></i> Try Again
                </button>
                <button onclick="displayRecipes(getMockRecipes())" class="mock-btn">
                    Use Sample Recipes
                </button>
            </div>
        </div>
    `;
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const recipeCards = document.querySelectorAll('.recipe-card');
            
            recipeCards.forEach(card => {
                const title = card.querySelector('.recipe-title');
                const description = card.querySelector('.recipe-description');
                const ingredients = card.querySelector('.ingredients-list');
                
                if (title && description && ingredients) {
                    const titleText = title.textContent.toLowerCase();
                    const descText = description.textContent.toLowerCase();
                    const ingText = ingredients.textContent.toLowerCase();
                    
                    if (titleText.includes(searchTerm) || descText.includes(searchTerm) || ingText.includes(searchTerm)) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    }
}

// Clear all ingredients
function clearAllIngredients() {
    ingredients = [];
    updateIngredientTags();
    saveIngredients();
}

// Export/Print recipe function
function printRecipe(recipeIndex) {
    window.print();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('ingredientModal');
    if (modal && event.target === modal) {
        closeIngredientModal();
    }
}