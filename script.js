document.addEventListener('DOMContentLoaded', () => {
    // 遊戲物件定義
    const items = [
        { name: '幽靈', color: 'white', id: 'ghost', svgPath: './images/ghost.svg' },
        { name: '瓶子', color: 'green', id: 'bottle', svgPath: './images/bottle.svg' },
        { name: '書', color: 'blue', id: 'book', svgPath: './images/book.svg' },
        { name: '椅子', color: 'red', id: 'chair', svgPath: './images/chair.svg' },
        { name: '老鼠', color: 'grey', id: 'mouse', svgPath: './images/mouse.svg' }
    ];

    // 顏色代碼映射
    const colorHexMap = {
        white: '#FFFFFF', green: '#2ecc71', blue: '#3498db', red: '#e74c3c', grey: '#95a5a6'
    };
    
    // SVG 快取
    const svgCache = new Map();

    // DOM 元素
    const messageEl = document.getElementById('message');
    const cardDisplayEl = document.getElementById('card-display');
    const itemsContainerEl = document.getElementById('items-container');
    const rulesModal = document.getElementById('rules-modal');
    const modalStartButton = document.getElementById('modal-start-button');
    const correctCountEl = document.getElementById('correct-count');
    const totalCountEl = document.getElementById('total-count');
    const accuracyRateEl = document.getElementById('accuracy-rate');

    // 遊戲狀態
    let correctCount = 0;
    let totalCount = 0;
    let gameActive = false;
    let currentCorrectItem = null;

    // 異步函數：載入並快取 SVG 檔案
    async function loadSVG(path) {
        if (svgCache.has(path)) return svgCache.get(path);
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`SVG not found: ${path}`);
            const svgText = await response.text();
            svgCache.set(path, svgText);
            return svgText;
        } catch (error) {
            console.error(error);
            return '<svg viewBox="0 0 100 100"><text x="10" y="50">Error</text></svg>';
        }
    }
    
    // 異步函數：設定物件的 SVG 內容
    async function setItemSVG(element, item, color) {
        const svgText = await loadSVG(item.svgPath);
        element.innerHTML = svgText;
        element.style.color = color;
    }

    // 初始化遊戲物件
    function initItems() {
        itemsContainerEl.innerHTML = '';
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.id = item.id;
            itemDiv.className = 'item';
            setItemSVG(itemDiv, item, colorHexMap[item.color]);
            itemDiv.addEventListener('click', () => handleItemClick(item));
            itemsContainerEl.appendChild(itemDiv);
        });
    }

    // 開始遊戲
    function startGame() {
        correctCount = 0;
        totalCount = 0;
        gameActive = true;
        updateStats();
        rulesModal.classList.add('hidden');
        nextRound();
    }

    // 進入下一回合
    function nextRound() {
        if (!gameActive) return;
        const highlightedItem = document.querySelector('.item.correct-answer-highlight');
        if (highlightedItem) {
            highlightedItem.classList.remove('correct-answer-highlight');
        }
        messageEl.textContent = '快找出正確的物件！';
        generateCard();
    }

    // 產生卡牌
    async function generateCard() {
        cardDisplayEl.innerHTML = '';
        let itemPool = [...items];
        const itemInfo1 = itemPool.splice(Math.floor(Math.random() * itemPool.length), 1)[0];
        const itemInfo2 = itemPool.splice(Math.floor(Math.random() * itemPool.length), 1)[0];
        const isDirectMatch = Math.random() > 0.5;
        let cardContent = [];
        let correctItem;

        if (isDirectMatch) {
            const correctIdx = Math.floor(Math.random() * 2);
            const item1 = correctIdx === 0 ? itemInfo1 : itemInfo2;
            const item2 = correctIdx === 0 ? itemInfo2 : itemInfo1;
            cardContent.push({ name: item1.name, color: item1.color });
            correctItem = item1;
            let availableColors = items.map(i => i.color).filter(c => c !== item2.color && c !== item1.color);
            let randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
            cardContent.push({ name: item2.name, color: randomColor });
        } else {
            let availableColors1 = items.map(i => i.color).filter(c => c !== itemInfo1.color && c !== itemInfo2.color);
            let color1 = availableColors1.splice(Math.floor(Math.random() * availableColors1.length), 1)[0];
            let color2 = availableColors1[Math.floor(Math.random() * availableColors1.length)];
            cardContent.push({ name: itemInfo1.name, color: color1 });
            cardContent.push({ name: itemInfo2.name, color: color2 });
            const cardNames = cardContent.map(c => c.name);
            const cardColors = cardContent.map(c => c.color);
            correctItem = items.find(i => !cardNames.includes(i.name) && !cardColors.includes(i.color));
        }

        const renderPromises = cardContent.map(async (card) => {
            const objectShape = items.find(i => i.name === card.name);
            const cardItemDiv = document.createElement('div');
            cardItemDiv.className = 'card-item';
            await setItemSVG(cardItemDiv, objectShape, colorHexMap[card.color]);
            return cardItemDiv;
        });

        const renderedElements = await Promise.all(renderPromises);
        renderedElements.forEach(el => cardDisplayEl.appendChild(el));
        const containerWidth = cardDisplayEl.offsetWidth;
        const containerHeight = cardDisplayEl.offsetHeight;
        renderedElements.forEach(el => {
            const itemWidth = el.offsetWidth;
            const itemHeight = el.offsetHeight;
            const maxLeft = containerWidth - itemWidth;
            const maxTop = containerHeight - itemHeight;
            el.style.left = `${Math.random() * maxLeft}px`;
            el.style.top = `${Math.random() * maxTop}px`;
        });
        currentCorrectItem = correctItem;
    }

    // 處理物件點擊
    function handleItemClick(clickedItem) {
        if (!gameActive || !currentCorrectItem) return;
        
        totalCount++;
        const circleSVG = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="#2ecc71" stroke-width="12" fill="none" /></svg>`;
        const crossSVG = `<svg viewBox="0 0 100 100"><line x1="20" y1="20" x2="80" y2="80" stroke="#e74c3c" stroke-width="12" /><line x1="80" y1="20" x2="20" y2="80" stroke="#e74c3c" stroke-width="12" /></svg>`;

        if (clickedItem.id === currentCorrectItem.id) {
            correctCount++;
            messageEl.innerHTML = circleSVG;
        } else {
            messageEl.innerHTML = crossSVG;
            document.getElementById(currentCorrectItem.id).classList.add('correct-answer-highlight');
        }
        
        updateStats();
        currentCorrectItem = null;
        setTimeout(nextRound, 1500);
    }

    // 更新計分板函式
    function updateStats() {
        correctCountEl.textContent = correctCount;
        totalCountEl.textContent = totalCount;
        const accuracy = totalCount > 0 ? ((correctCount / totalCount) * 100).toFixed(0) : 0;
        accuracyRateEl.textContent = `${accuracy}%`;
    }

    // --- 初始設定 ---
    initItems();
    modalStartButton.addEventListener('click', startGame);
});