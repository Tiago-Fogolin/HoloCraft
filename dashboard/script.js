// script.js - HoloCraft Dashboard

// Elementos DOM
const colorPicker = document.getElementById('color-picker');
const clearButton = document.getElementById('clear-canvas');
const sendLiveButton = document.getElementById('send-live');
const drawingCanvas = document.getElementById('drawing-canvas');
const ctx = drawingCanvas.getContext('2d');
const constructionsList = document.getElementById('constructions-list');

// Estado do desenho
let isDrawing = false;
let currentColor = colorPicker.value;
let pixels = new Map(); // Map de 'x,y' para color {r,g,b} reais

// Função para converter hex para RGB565
function hexToRgb565(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const r5 = Math.round(r * 31 / 255);
    const g6 = Math.round(g * 63 / 255);
    const b5 = Math.round(b * 31 / 255);
    const rgb565 = (r5 << 11) | (g6 << 5) | b5;
    return rgb565.toString(16).padStart(4, '0');
}

// Função para converter RGB565 para hex
function rgb565ToHex(rgb565) {
    const val = parseInt(rgb565, 16);
    const r = Math.round(((val >> 11) & 0x1F) * 255 / 31);
    const g = Math.round(((val >> 5) & 0x3F) * 255 / 63);
    const b = Math.round((val & 0x1F) * 255 / 31);
    return `rgb(${r}, ${g}, ${b})`;
}

// Inicializar canvas
function initCanvas() {
    ctx.fillStyle = '#F5F5DC';
    ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

// Eventos do mouse
drawingCanvas.addEventListener('mousedown', startDrawing);
drawingCanvas.addEventListener('mousemove', draw);
drawingCanvas.addEventListener('mouseup', stopDrawing);
drawingCanvas.addEventListener('mouseout', stopDrawing);

// Eventos de toque para mobile
drawingCanvas.addEventListener('touchstart', handleTouch);
drawingCanvas.addEventListener('touchmove', handleTouch);
drawingCanvas.addEventListener('touchend', stopDrawing);

function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    const rect = drawingCanvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    if (x >= 0 && x < drawingCanvas.width && y >= 0 && y < drawingCanvas.height) {
        paintPixel(x, y, currentColor);
    }
}

function stopDrawing() {
    isDrawing = false;
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = drawingCanvas.getBoundingClientRect();
    const x = Math.floor(touch.clientX - rect.left);
    const y = Math.floor(touch.clientY - rect.top);
    if (e.type === 'touchstart') {
        isDrawing = true;
    }
    if (isDrawing) {
        paintPixel(x, y, currentColor);
    }
}

function paintPixel(x, y, color) {
    ctx.fillStyle = color; // Ainda usa hex para desenhar no canvas
    ctx.fillRect(x, y, 1, 1);
    // converter hex para componentes individuais
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    pixels.set(`${x},${y}`, { r, g, b });
}

// Limpar canvas
clearButton.addEventListener('click', () => {
    initCanvas();
    pixels.clear();
});

// Mudar cor
colorPicker.addEventListener('change', (e) => {
    currentColor = e.target.value;
});

// Enviar para live
sendLiveButton.addEventListener('click', async () => {
    const items = Array.from(pixels.entries()).map(([key, color]) => {
        const [x, y] = key.split(',').map(Number);
        return { x, y, color }; // color already {r,g,b}
    });
    try {
        const response = await fetch('https://verbose-bassoon-66q44wx4gxgh5rw7-8000.app.github.dev/api/constructions/live', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
        });
        if (response.ok) {
            alert('Construção enviada para live!');
        } else {
            alert('Erro ao enviar.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro de conexão.');
    }
});

// Carregar construções salvas
async function loadSavedConstructions() {
    try {
        const response = await fetch('https://verbose-bassoon-66q44wx4gxgh5rw7-8000.app.github.dev/api/constructions');
        const constructions = await response.json();
        constructionsList.innerHTML = ''; // Limpa a lista antes de renderizar
        
        constructions.forEach(construction => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'construction-item';
            
            const canvas = document.createElement('canvas');
            const scale = 2; // ampliar para 640x480
            canvas.width = 320 * scale;
            canvas.height = 240 * scale;
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = '#F5F5DC';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            construction.items.forEach(item => {
                let hex;
                if (typeof item.color === 'string') {
                    hex = rgb565ToHex(item.color);
                } else {
                    hex = `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})`;
                }
                ctx.fillStyle = hex;
                ctx.fillRect(item.x * scale, item.y * scale, scale, scale);
            });
            
            itemDiv.appendChild(canvas);
            
            // CORREÇÃO: Cria o parágrafo via DOM em vez de innerHTML
            const timeParagraph = document.createElement('p');
            timeParagraph.textContent = new Date(construction.timestamp).toLocaleString();
            itemDiv.appendChild(timeParagraph);
            
            constructionsList.appendChild(itemDiv);
        });
    } catch (error) {
        console.error('Erro ao carregar construções:', error);
    }
}

// Inicializar
initCanvas();
loadSavedConstructions();