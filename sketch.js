// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// let scoreText = "成績分數: " + finalScore + "/" + maxScore;
// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// --- 【新增：煙火相關全域變數】 ---
let fireworks = []; // 儲存所有的煙火物件
// ------------------------------------

window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    colorMode(HSB, 360, 100, 100, 1); // 使用 HSB 顏色模式方便隨機顏色
    background(0); // 黑色背景更適合煙火
    //noLoop(); // 移除 noLoop() 以允許 draw 函式連續執行來模擬動畫效果
} 


// --- 【新增：簡化版的煙火類別和函式】 ---

// 為了簡化，這裡僅用一個物件來代表煙火爆炸後產生的所有粒子
// 真實的 p5.js 煙火通常需要 Particle 和 Firework 兩個 Class
function launchFirework() {
    let centerX = width / 2;
    let centerY = height / 2;
    let particleCount = 60; // 爆炸粒子數量
    let hue = random(360); // 隨機顏色
    let maxSpeed = 8;
    
    // 創建一個爆炸物件
    let explosion = {
        particles: [],
        color: hue,
        isAlive: true,
        
        // 初始化爆炸粒子
        init: function() {
            for (let i = 0; i < particleCount; i++) {
                let angle = map(i, 0, particleCount, 0, TWO_PI);
                let speed = random(maxSpeed * 0.5, maxSpeed);
                
                this.particles.push({
                    x: centerX,
                    y: centerY,
                    vx: cos(angle) * speed * random(0.5, 1.5),
                    vy: sin(angle) * speed * random(0.5, 1.5),
                    life: 255, // 粒子壽命 (用來控制透明度)
                    size: random(2, 5)
                });
            }
        },
        
        // 更新和繪製粒子
        updateAndShow: function() {
            if (!this.isAlive) return;

            let gravity = createVector(0, 0.1); // 簡化重力

            for (let i = this.particles.length - 1; i >= 0; i--) {
                let p = this.particles[i];
                
                // 應用重力 (簡化為直接修改 vy)
                p.vy += gravity.y; 
                
                // 更新位置
                p.x += p.vx;
                p.y += p.vy;
                
                // 減少壽命 (淡出效果)
                p.life -= 5; 
                
                // 繪製粒子
                noStroke();
                // HSB 顏色：色相(this.color), 飽和度(100), 亮度(100), 透明度(p.life/255)
                fill(this.color, 100, 100, p.life / 255); 
                ellipse(p.x, p.y, p.size);
                
                // 檢查粒子是否死亡
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
            
            // 如果所有粒子都消失，則煙火物件死亡
            if (this.particles.length === 0) {
                this.isAlive = false;
            }
        }
    };
    
    explosion.init(); // 初始化粒子
    fireworks.push(explosion); // 將新煙火加入陣列
}

// -----------------------------------------------------------


function draw() { 
    // background(255); // 清除背景
    // 使用帶透明度的背景，製造殘影效果 (更像煙火)
    colorMode(RGB); // 切回 RGB 處理背景透明度
    background(0, 0, 0, 25); // 黑色背景，25/255 透明度
    colorMode(HSB, 360, 100, 100, 1); // 切回 HSB 處理煙火顏色

    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;
    let isPerfectScore = (finalScore === maxScore && maxScore > 0); // 檢查是否滿分

    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    textSize(80); 
    textAlign(CENTER);
    
    if (isPerfectScore) {
        // 滿分：顯示鼓勵文本，使用鮮豔顏色
        fill(120, 100, 90); // 亮綠色
        text("滿分！太棒了！", width / 2, height / 2 - 50);
        
        // -----------------------------------------------------------------
        // C. 【新增：滿分時觸發煙火特效】
        // -----------------------------------------------------------------
        // 每隔一段時間（例如 30 幀）發射一個新的煙火
        if (frameCount % 30 === 0) { 
            launchFirework(); 
        }
        
    } else if (percentage >= 90) {
        // 高分：顯示鼓勵文本，使用鮮豔顏色
        fill(100, 100, 90); // 綠色 
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色 
        fill(45, 100, 100); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色 
        fill(0, 100, 80); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        colorMode(RGB); // 切回 RGB 處理灰色
        fill(150);
        text(scoreText, width / 2, height / 2);
    }
    
    // -----------------------------------------------------------------
    // C. 【新增：更新和顯示所有煙火】
    // -----------------------------------------------------------------
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].updateAndShow();
        if (!fireworks[i].isAlive) {
            fireworks.splice(i, 1); // 移除已死亡的煙火
        }
    }
    // -----------------------------------------------------------------

    // 顯示具體分數 (使用 RGB 模式)
    colorMode(RGB);
    textSize(50);
    fill(255); // 白色文字，在黑色背景上突出
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    colorMode(HSB, 360, 100, 100, 1); // 切回 HSB 繪圖
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美 [7]
        fill(100, 80, 80, 0.5); // 綠色, 帶透明度
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 [4]
        fill(45, 80, 80, 0.5); // 黃色, 帶透明度
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    // 如果您想要更複雜的視覺效果，還可以根據分數修改線條粗細 (strokeWeight) 
    // 或使用 sin/cos 函數讓圖案的動畫效果有所不同 [8, 9]。
}
