const agree = document.getElementById('agree');
const disagree = document.getElementById('disagree');
const modal = document.getElementById('modal');
const congrats = document.getElementById('congrats');
const canvas = document.getElementById('fireworks');

// 1) 不同意按鈕：當滑鼠接近不到 5cm 時，平滑往滑鼠相反方向移動並保持 5cm 距離
const container = document.querySelector('.buttons');
let btnOrigX = null, btnOrigY = null; // 原始位置（視窗座標 left/top）
let currentTX = 0, currentTY = 0; // 目前 translate
let targetTX = 0, targetTY = 0; // 目標 translate
let mouseX = -9999, mouseY = -9999;

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

// convert cm to pixels (approx for 96dpi)
const CM = 96/2.54; // ~37.79px
const KEEP_DIST = 5 * CM; // 要保持的距離 5cm

function computeTarget(){
  // use viewport coords
  const btnRect = disagree.getBoundingClientRect();
  // 設定原始位置（視窗 left/top）並將按鈕改為 fixed
  if (btnOrigX === null){
    // position disagree next to the agree button initially
    const agreeRect = agree.getBoundingClientRect();
    const gap = 12; // px gap between buttons
    btnOrigX = Math.round(agreeRect.right + gap);
    btnOrigY = Math.round(agreeRect.top);
    // clamp inside viewport
    btnOrigX = clamp(btnOrigX, 0, window.innerWidth - btnRect.width);
    btnOrigY = clamp(btnOrigY, 0, window.innerHeight - btnRect.height);
    disagree.style.left = btnOrigX + 'px';
    disagree.style.top = btnOrigY + 'px';
    disagree.style.position = 'fixed';
    disagree.style.margin = '0';
    // reset transforms
    currentTX = 0; currentTY = 0; targetTX = 0; targetTY = 0;
  }

  const mx = mouseX; // clientX
  const my = mouseY; // clientY

  // current center (based on original + current translate)
  const currCenterX = btnOrigX + currentTX + btnRect.width/2;
  const currCenterY = btnOrigY + currentTY + btnRect.height/2;

  // vector from mouse to button center
  const vx = currCenterX - mx;
  const vy = currCenterY - my;
  const dist = Math.hypot(vx, vy);

  if(dist < KEEP_DIST){
    // unit vector away from mouse
    let ux = 0, uy = 0;
    if(dist === 0){
      const a = Math.random()*Math.PI*2; ux = Math.cos(a); uy = Math.sin(a);
    } else { ux = vx/dist; uy = vy/dist; }

    // desired center position is mouse + unit * KEEP_DIST
    const desiredCenterX = mx + ux * KEEP_DIST;
    const desiredCenterY = my + uy * KEEP_DIST;

    // convert desired center -> desired top-left (viewport coords)
    let desiredLeft = desiredCenterX - btnRect.width/2;
    let desiredTop = desiredCenterY - btnRect.height/2;

    // clamp inside viewport
    const minLeft = 0;
    const maxLeft = window.innerWidth - btnRect.width;
    const minTop = 0;
    const maxTop = window.innerHeight - btnRect.height;
    desiredLeft = clamp(desiredLeft, minLeft, maxLeft);
    desiredTop = clamp(desiredTop, minTop, maxTop);

    targetTX = desiredLeft - btnOrigX;
    targetTY = desiredTop - btnOrigY;
  } else {
    // 超出範圍，回原位
    targetTX = 0;
    targetTY = 0;
  }
}

window.addEventListener('mousemove', (e)=>{
  mouseX = e.clientX; mouseY = e.clientY;
  computeTarget();
});

// 平滑動畫循環
(function animate(){
  const ease = 0.14; // 平滑係數，數值越小越慢
  currentTX += (targetTX - currentTX) * ease;
  currentTY += (targetTY - currentTY) * ease;
  if(Math.abs(targetTX - currentTX) < 0.3) currentTX = targetTX;
  if(Math.abs(targetTY - currentTY) < 0.3) currentTY = targetTY;
  disagree.style.transform = `translate(${currentTX}px, ${currentTY}px)`;
  requestAnimationFrame(animate);
})();

// 禁止直接點擊不同意（以防快速點擊）
// 確保「不同意」無法被點擊或透過鍵盤觸發
disagree.disabled = true;
disagree.setAttribute('tabindex', '-1');
disagree.addEventListener('click', (e)=>{ e.preventDefault(); });

// 同意按鈕：顯示恭喜並啟動煙火
agree.addEventListener('click', ()=>{
  modal.classList.add('hidden');
  congrats.classList.remove('hidden');
  startFireworks();
});

// --- 簡單煙火系統 ---
function startFireworks(){
  const ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const particles = [];

  function random(a,b){return a + Math.random()*(b-a)}

  function launch(x,y){
    const hue = Math.floor(random(0,360));
    for(let i=0;i<120;i++){
      const speed = random(1,6);
      const angle = random(0,Math.PI*2);
      particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:random(60,120),hue,alpha:1});
    }
  }

  let frames = 0;
  function loop(){
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life--; p.alpha *= 0.997;
      if(p.life<=0 || p.alpha<0.02) { particles.splice(i,1); continue; }
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue},90%,60%,${p.alpha})`;
      ctx.arc(p.x,p.y,2.2,0,Math.PI*2);
      ctx.fill();
    }
    frames++;
    if(frames % 30 === 0){
      const lx = random(100, canvas.width-100);
      const ly = random(100, canvas.height/2);
      launch(lx,ly);
    }
    if(frames < 600 || particles.length>0) requestAnimationFrame(loop);
  }
  loop();

  function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}
