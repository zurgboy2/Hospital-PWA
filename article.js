import { makeRequest } from "./api.js";

export let currentArticles = []; // Declare a variable to store the current articles

export async function loadArticles() {
    const articles = await fetchArticles();
    displayArticles(articles);
    
    // Cache the articles for offline use
    if ('caches' in window) {
        const cache = await caches.open('articles-cache');
        await cache.put('articles', new Response(JSON.stringify(articles)));
    }
}

export function displayArticles(articles) {
    currentArticles = articles; // Store the articles for later use
    const articlesList = document.getElementById('articlesList');
    if (!Array.isArray(articles)) {
        console.error('Articles is not an array:', articles);
        articlesList.innerHTML = '<p>No articles available at the moment.</p>';
        return;
    }
    articlesList.innerHTML = articles.map((article, index) => `
        <div class="article-item">
            <div class="article-content">
                <h4>${article.title}</h4>
                <p>${truncateText(article.fullText, 100)}</p>
            </div>
            <div class="article-footer">
                <button onclick="openArticleModal(${index})">Read more</button>
            </div>
        </div>
    `).join('');
}

export function openArticleModal(index) {
    const article = currentArticles[index]; // Use currentArticles instead of articles
    const modal = document.getElementById('articleModal');
    const modalContent = document.getElementById('articleModalContent');
    
    modalContent.innerHTML = `
        <h2>${article.title}</h2>
        <p>${article.fullText}</p>
    `;
    
    modal.style.display = 'block';
}

export function closeArticleModal() {
    const modal = document.getElementById('articleModal');
    modal.style.display = 'none';
}

export async function fetchArticles() {
    try {
        const response = await makeRequest('fetchArticles');

        let articles;
        if (response && typeof response === 'object') {
            if (Array.isArray(response)) {
                articles = response;
            } else if (response.articles && Array.isArray(response.articles)) {
                articles = response.articles;
            } else {
                console.error('Unexpected response structure:', response);
                articles = [];
            }
        } else {
            console.error('Invalid response:', response);
            articles = [];
        }

        // Cache the new articles
        localStorage.setItem('cachedArticles', JSON.stringify({ articles }));

        return articles;
    } catch (error) {
        console.error('Failed to fetch articles:', error);
        // In case of error, try to use cached data
        const cachedArticles = localStorage.getItem('cachedArticles');
        const parsedData = cachedArticles ? JSON.parse(cachedArticles) : { articles: [] };
        return parsedData.articles || [];
    }
}

export function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}
// Event listener for closing modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('articleModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}