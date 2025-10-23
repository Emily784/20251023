// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字
let fireworks = []; // 【新增】儲存所有煙火物件的陣列
let gravity; // 【新增】用於模擬重力的向量

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
    colorMode(HSB, 360, 100, 100); // 使用 HSB 顏色模式方便控制煙火顏色
    gravity = createVector(0, 0.2); // 模擬重力向下
    noLoop(); // 初始時停止 draw 迴圈
} 

function draw() { 
    // 設定半透明背景以產生拖影效果 (僅在動畫啟動時明顯)
    background(255, 10); // 清除背景，微弱的透明度用於拖影
    
    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;
    let scoreDisplayY = height / 2 + 50;

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 99.9) { // 【修改】針對滿分(100%)觸發煙火
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(100, 80, 80); // 綠色
        text("🎉 完美！100% 滿分！ 🎉", width / 2, height / 2 - 50);

        // -------------------------------------------------------------
        // 【新增】滿分時觸發煙火
        // -------------------------------------------------------------
        if (frameCount % 30 === 0) { // 每隔 30 幀生成一個新的煙火 (約 0.5 秒)
            // 從底部隨機位置發射
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
        fill(0, 200, 50); // 綠色 
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        fill(150);
        text(scoreText, width / 2, height / 2);
        scoreDisplayY = height / 2; // 如果是初始文本，分數位置需要調整
    }

    // 顯示具體分數
    textSize(50);
    fill(50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, scoreDisplayY);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90 && percentage < 99.9) { // 【修改】避免與滿分煙火衝突
        // 畫一個大圓圈代表完美 
        fill(0, 200, 50, 150); 
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    // 滿分時移除幾何圖形，讓畫面更集中於煙火
}


// =================================================================
// 步驟三：新增 Firework 和 Particle 類別 (簡化版)
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
        colorMode(HSB);
        strokeWeight(this.isFirework ? 4 : 2); // 發射中的煙火線條較粗
        stroke(this.hu, 100, 100, this.lifespan);
        point(this.pos.x, this.pos.y);
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
                // 當向上速度轉為向下，且達到一定高度時爆炸
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
        // 創建大量爆炸粒子
        for (let i = 0; i < 100; i++) {
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
        // 煙火完成條件：已爆炸且所有爆炸粒子都已消亡
        return this.exploded && this.particles.length === 0;
    }
}
