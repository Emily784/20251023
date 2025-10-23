// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

// 確保這是全域變數，用於儲存 H5P 傳來的分數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; 

// --- 煙火相關全域變數 ---
let fireworks = []; // 儲存所有的煙火爆炸物件
// -------------------------

window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // 更新得分和總分
        finalScore = data.score; 
        maxScore = data.maxScore; 
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // 不需手動呼叫 redraw()，因為我們移除了 noLoop()，draw() 會自動循環
        // 舊代碼中的 if (typeof redraw === 'function') { redraw(); } 現在可以省略或保留，但 draw() 會持續運行。
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數與煙火
// -----------------------------------------------------------------

function setup() { 
    // 根據視窗大小創建 Canvas
    createCanvas(windowWidth / 2, windowHeight / 2); 
    // 設定 HSB 顏色模式 (色相, 飽和度, 亮度, 透明度)
    colorMode(HSB, 360, 100, 100, 1); 
    background(0); // 黑色背景適合煙火
    
    // !! 關鍵修正：確保 draw() 函式連續執行 (已移除 noLoop()) !!
    angleMode(RADIANS); // 確保使用弧度計算
    // 如果舊檔案中有 noLoop()，務必移除或註釋掉！
} 


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
                // 繪製粒子 (使用 HSB 顏色和透明度)
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
    
    // 關鍵：使用帶透明度的背景，製造煙火的殘影效果
    colorMode(RGB); 
    background(0, 0, 0, 25); // 黑色背景，25/255 透明度
    colorMode(HSB, 360, 100, 100, 1); 

    // 計算百分比
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
        mainColor = color(120, 100, 90); // HSB 亮綠色
        
        // 【觸發煙火特效】
        if (frameCount % 30 === 0) { 
            launchFirework(); 
        }
        
    } else if (percentage >= 90) {
        mainText = "恭喜！優異成績！";
        mainColor = color(100, 100, 90); // HSB 綠色
        
    } else if (percentage >= 60) {
        mainText = "成績良好，請再接再厲。";
        mainColor = color(45, 100, 100); // HSB 黃色
        
    } else if (maxScore > 0) {
        mainText = "需要加強努力！";
        mainColor = color(0, 100, 80); // HSB 紅色
        
    } else {
        // 尚未收到分數 (maxScore == 0)
        colorMode(RGB); // 切回 RGB 處理灰色
        mainText = "等待 H5P 成績中...";
        mainColor = color(150); // RGB 灰色
    }

    fill(mainColor);
    text(mainText, width / 2, height / 2 - 50);
    
    // -----------------------------------------------------------------
    // C. 【更新和顯示所有煙火】
    // -----------------------------------------------------------------
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].updateAndShow();
        if (!fireworks[i].isAlive) {
            fireworks.splice(i, 1); 
        }
    }
    // -----------------------------------------------------------------

    // 顯示具體分數
    colorMode(RGB); // 確保文字顏色穩定
    textSize(50);
    fill(255); // 白色文字
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
