// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let fireworks = []; // 儲存所有煙火物件的陣列
let gravity; // 用於模擬重力的向量

window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        
        console.log("新的分數已接收:", `最終成績分數: ${finalScore}/${maxScore}`); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 & 啟用動畫
        // ----------------------------------------
        let percentage = (finalScore / maxScore) * 100;

        if (percentage >= 99.9 && isLooping() === false) { // 滿分，開始動畫迴圈
             loop(); 
        } else if (percentage < 99.9 && isLooping() === true) { // 非滿分，停止動畫迴圈
             noLoop(); 
        }

        // 確保至少繪製一次以更新分數顯示
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    // 統一使用 HSB 顏色模式 (色相 0-360, 飽和度 0-100, 亮度 0-100)
    colorMode(HSB, 360, 100, 100); 
    gravity = createVector(0, 0.2); // 模擬重力向下
    noLoop(); // 初始時停止 draw 迴圈
} 

function draw() { 
    // 設定半透明背景以產生拖影效果，透明度調低讓拖影更不明顯，增強視覺對比
    background(255, 5); 
    textAlign(CENTER);

    // -----------------------------------------------------------------
    // A. 處理初始等待狀態
    // -----------------------------------------------------------------
    if (finalScore === 0 && maxScore === 0) {
        textSize(80); 
        fill(0, 0, 60); // 灰色
        text("等待 H5P 成績中...", width / 2, height / 2);
        return; 
    }
    
    // -----------------------------------------------------------------
    // B. 處理已接收到分數的狀態
    // -----------------------------------------------------------------
    let percentage = (finalScore / maxScore) * 100;
    let promptY = height / 2 - 50; // 提示文本位置
    let scoreY = height / 2 + 50; // 分數顯示位置

    textSize(80); 
    
    // -------------------------------------------------------------
    // 【強化點】滿分煙火邏輯
    // -------------------------------------------------------------
    if (percentage >= 99.9) { 
        fill(120, 100, 80); // 綠色
        text("🎉 完美！100% 滿分！ 🎉", width / 2, promptY);

        // 【強化點 1】增加煙火發射頻率：每 15 幀生成一個 (從 30 幀減少到 15 幀)
        if (frameCount % 15 === 0) { 
            fireworks.push(new Firework(random(width), height)); 
        }

        // 更新和顯示所有煙火
        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            fireworks[i].show();
            if (fireworks[i].done()) {
                fireworks.splice(i, 1); // 移除已完成的煙火
            }
        }
        
    } else if (percentage >= 90) {
        fill(120, 80, 80); // 綠色 
        text("恭喜！優異成績！", width / 2, promptY);
        
    } else if (percentage >= 60) {
        fill(40, 80, 80); // 黃色
        text("成績良好，請再接再厲。", width / 2, promptY);
        
    } else { // percentage > 0 且 < 60
        fill(0, 80, 80); // 紅色
        text("需要加強努力！", width / 2, promptY);
    }
    
    // 顯示具體分數
    textSize(50);
    fill(0, 0, 30); // 深灰色
    text(`得分: ${finalScore}/${maxScore}`, width / 2, scoreY);
    
    
    // -----------------------------------------------------------------
    // C. 根據分數觸發不同的幾何圖形反映 
    // -----------------------------------------------------------------
    
    if (percentage >= 90 && percentage < 99.9) { 
        fill(120, 80, 80, 0.5); // 半透明綠色
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        fill(40, 80, 80, 0.5); // 半透明黃色
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
}


// =================================================================
// 步驟三：新增 Firework 和 Particle 類別 (強化版)
// -----------------------------------------------------------------

// 粒子類別 (Particle Class)
class Particle {
    constructor(x, y, hu, isFirework) {
        this.pos = createVector(x, y);
        this.isFirework = isFirework; // 如果是發射中的煙火，為 true
        this.lifespan = 255;
        this.hu = hu; // 顏色色相 (Hue)

        if (this.isFirework) {
            this.vel = createVector(0, random(-10, -15)); // 向上發射
        } else {
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(1, 8)); // 爆炸後向四周擴散
        }
        this.acc = createVector(0, 0);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.isFirework) {
            this.vel.mult(0.95); // 爆炸粒子速度減緩
            this.lifespan -= 4; // 爆炸粒子逐漸消失
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    show() {
        // 【強化點 3】增加光暈效果 (Shadow Blur)
        const c = color(this.hu, 100, 100, this.lifespan);
        
        drawingContext.shadowBlur = this.isFirework ? 10 : 8; // 粒子光暈
        drawingContext.shadowColor = c;
        
        strokeWeight(this.isFirework ? 5 : 3); // 【強化點 4】增加線條粗細
        stroke(c); 
        point(this.pos.x, this.pos.y);
        
        // 畫完後重設，避免影響其他繪圖
        drawingContext.shadowBlur = 0;
        drawingContext.shadowColor = 'rgba(0,0,0,0)';
    }

    done() {
        return this.lifespan < 0; // 判斷粒子是否消亡
    }
}

// 煙火類別 (Firework Class)
class Firework {
    constructor(x, y) {
        this.hu = random(360); // 隨機顏色
        this.firework = new Particle(x, y, this.hu, true); // 發射粒子
        this.exploded = false;
        this.particles = [];
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity);
            this.firework.update();

            if (this.firework.vel.y >= 0 && this.firework.pos.y < height * 0.7) { 
                this.exploded = true;
                this.explode();
            }
        }

        // 更新爆炸粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(gravity);
            this.particles[i].update();
            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        // 【強化點 2】增加爆炸粒子數量 (從 100 增加到 200)
        for (let i = 0; i < 200; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        }

        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].show();
        }
    }

    done() {
        return this.exploded && this.particles.length === 0;
    }
}
