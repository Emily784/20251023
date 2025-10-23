// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; 
let fireworks = []; 
let canvasParent; // 儲存 Canvas 父容器的 DOM 元素
let isScoreReceived = false; // 新增旗標：標記是否已收到成績

window.addEventListener('message', function (event) {
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        finalScore = data.score; 
        maxScore = data.maxScore; 
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // 關鍵：收到成績後，第一次執行 showCanvas()
        if (!isScoreReceived) {
            isScoreReceived = true;
            showCanvas();
        }
    }
}, false);

// -----------------------------------------------------------------
// 新增函式：顯示 Canvas (將 opacity 從 0 變為 1)
// -----------------------------------------------------------------
function showCanvas() {
    if (canvasParent) {
        canvasParent.style('opacity', 1);
        canvasParent.style('pointer-events', 'auto'); // 顯示後開放滑鼠互動
    }
}


// =================================================================
// 步驟二：使用 p5.js 繪製分數與煙火
// -----------------------------------------------------------------

function setup() { 
    // 關鍵修正：將 Canvas 附加到指定的容器
    canvasParent = select('#p5-canvas-container');
    
    // 取得 H5P 容器的寬高，作為 Canvas 的尺寸
    let h5pContainer = select('#h5pContainer');
    let w = h5pContainer.width;
    let h = h5pContainer.height;
    
    // 創建 Canvas 並附加到指定的容器中
    let canvas = createCanvas(w, h); 
    canvas.parent(canvasParent);

    colorMode(HSB, 360, 100, 100, 1); 
    background(0); 
    angleMode(RADIANS); 

    // 關鍵：在收到成績前，我們讓 Canvas 內容完全透明（防止一閃而過）
    canvasParent.style('opacity', 0); 
    canvasParent.style('pointer-events', 'none'); 

    // 初始化時讓 draw() 保持執行，以便我們可以接收成績後立即啟動動畫
    // 為了保險，我們在 draw() 裡面檢查 isScoreReceived 決定是否繪製內容。
} 

// 由於篇幅限制，以下為煙火和 draw() 函式的程式碼，與上一份回覆相同，請確保它們完整保留：

// --- 簡化版的煙火發射函式 ---
function launchFirework() {
    // 讓煙火在畫面上方隨機位置爆炸
    let centerX = random(width * 0.2, width * 0.8);
    let centerY = random(height * 0.3, height * 0.6); 

    let particleCount = 60; 
    let hue = random(360); 
    let maxSpeed = 8;
    
    // 創建一個爆炸物件
    let explosion = {
        particles: [],
        color: hue,
        isAlive: true,
        
        init: function() {
            for (let i = 0; i < particleCount; i++) {
                let angle = map(i, 0, particleCount, 0, TWO_PI); 
                let speed = random(maxSpeed * 0.5, maxSpeed);
                
                this.particles.push({
                    x: centerX,
                    y: centerY,
                    vx: cos(angle) * speed * random(0.5, 1.5), 
                    vy: sin(angle) * speed * random(0.5, 1.5),
                    life: 255, 
                    size: random(2, 5)
                });
            }
        },
        
        updateAndShow: function() {
            if (!this.isAlive) return;

            let gravity = createVector(0, 0.1); 

            for (let i = this.particles.length - 1; i >= 0; i--) {
                let p = this.particles[i];
                
                p.vy += gravity.y; 
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 5; 
                
                noStroke();
                fill(this.color, 100, 100, p.life / 255); 
                ellipse(p.x, p.y, p.size);
                
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
            
            if (this.particles.length === 0) {
                this.isAlive = false;
            }
        }
    };
    
    explosion.init(); 
    fireworks.push(explosion); 
}

// -----------------------------------------------------------

function draw() { 
    
    // 只有在收到成績後才繪製內容，否則 Canvas 會持續刷新（透明背景）
    if (!isScoreReceived) {
        // 如果還沒收到成績，只需用透明背景覆蓋，等待 H5P 內容完成。
        background(0, 0, 0, 0); 
        return; // 停止繪圖，直到收到成績
    }


    // ********* 收到成績後才執行以下繪圖邏輯 *********
    
    // 使用帶透明度的背景，製造煙火的殘影效果
    colorMode(RGB); 
    background(0, 0, 0, 25); 
    colorMode(HSB, 360, 100, 100, 1); 

    let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;
    let isPerfectScore = (finalScore === maxScore && maxScore > 0); 

    // -----------------------------------------------------------------
    // A. 顯示鼓勵文本
    // -----------------------------------------------------------------
    textSize(80); 
    textAlign(CENTER);
    
    let mainText = "";
    let mainColor;
    
    if (isPerfectScore) {
        mainText = "滿分！太棒了！";
        mainColor = color(120, 100, 90); 
        
        // 【觸發煙火特效】
        if (frameCount % 30 === 0) { 
            launchFirework(); 
        }
        
    } else if (percentage >= 90) {
        mainText = "恭喜！優異成績！";
        mainColor = color(100, 100, 90); 
        
    } else if (percentage >= 60) {
        mainText = "成績良好，請再接再厲。";
        mainColor = color(45, 100, 100); 
        
    } else { // 包含 0 < percentage < 60 的情況
        mainText = "需要加強努力！";
        mainColor = color(0, 100, 80); 
    }

    fill(mainColor);
    text(mainText, width / 2, height / 2 - 50);
    
    // -----------------------------------------------------------------
    // C. 更新和顯示所有煙火
    // -----------------------------------------------------------------
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].updateAndShow();
        if (!fireworks[i].isAlive) {
            fireworks.splice(i, 1); 
        }
    }
    
    // -----------------------------------------------------------------

    // 顯示具體分數
    colorMode(RGB); 
    textSize(50);
    fill(255); 
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映
    // -----------------------------------------------------------------
    colorMode(HSB, 360, 100, 100, 1); 
    
    if (percentage >= 90) {
        fill(100, 80, 80, 0.5); 
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        fill(45, 80, 80, 0.5); 
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
}
