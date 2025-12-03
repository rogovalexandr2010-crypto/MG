// game.js — логика MineGame (обновлённая версия)
// Списки руд и кирок — сбалансированы и готовы к использованию в интерфейсе

const RUDE_LIST = [
  { id: "stone", name: "Камень", value: 1, chance: 0.50 },
  { id: "coal", name: "Уголь", value: 3, chance: 0.30 },
  { id: "iron", name: "Железо", value: 8, chance: 0.12 },
  { id: "gold", name: "Золото", value: 15, chance: 0.06 },
  { id: "diamond", name: "Алмаз", value: 40, chance: 0.02 }
];

const PICKAXE_LIST = [
  { id: "wood", name: "Деревянная кирка", power: 1, price: 0 },
  { id: "stone", name: "Каменная кирка", power: 1.5, price: 50 },
  { id: "iron", name: "Железная кирка", power: 2, price: 150 },
  { id: "gold", name: "Золотая кирка", power: 3, price: 400 },
  { id: "diamond", name: "Алмазная кирка", power: 5, price: 1000 }
];

// Вспомогательные функции
function weightedPick(list) {
  // list items have .chance with sum = 1 (approx)
  const r = Math.random();
  let acc = 0;
  for (const item of list) {
    acc += item.chance;
    if (r <= acc) return item;
  }
  // fallback
  return list[list.length - 1];
}

function formatNumber(n){ return Math.round(n*100)/100; }

// State и сохранение
const STORAGE_KEY = 'minegame_v2_state';
let state = {
  balance: 0,
  pickaxeIndex: 0,
  inventory: {}, // {oreId: count}
  log: []
};

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) state = JSON.parse(raw);
  }catch(e){ console.warn('load failed', e); }
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  document.getElementById('saveState').innerText = 'Автоматически (сохранено)';
}

// UI обновления
function updateUI(){
  document.getElementById('balance').innerText = 'Монет: ' + formatNumber(state.balance);
  document.getElementById('pickaxe').innerText = 'Кирка: ' + PICKAXE_LIST[state.pickaxeIndex].name;
  // inventory
  const inv = document.getElementById('inventoryList');
  inv.innerHTML = '';
  for(const r of RUDE_LIST){
    const cnt = state.inventory[r.id] || 0;
    const el = document.createElement('div');
    el.innerHTML = `<div>${r.name} × ${cnt}</div><div>${r.value}💰</div>`;
    inv.appendChild(el);
  }
  // shop
  const shop = document.getElementById('shopList');
  shop.innerHTML = '';
  PICKAXE_LIST.forEach((p, idx)=>{
    const canBuy = state.balance >= p.price && idx > state.pickaxeIndex; // only buy higher tier
    const row = document.createElement('div');
    row.innerHTML = `<div>${p.name} — ${p.price}💰 (x${p.power})</div>`;
    const btn = document.createElement('button');
    btn.className = 'small-btn';
    btn.innerText = idx === state.pickaxeIndex ? 'Текущая' : (canBuy ? 'Купить' : 'Недоступно');
    if(canBuy){
      btn.onclick = ()=>buyPickaxe(idx);
    } else {
      btn.disabled = true;
    }
    row.appendChild(btn);
    shop.appendChild(row);
  });

  // log (keep small)
  const logEl = document.getElementById('log');
  logEl.innerHTML = state.log.slice(-6).map(s=>'<div>'+s+'</div>').join('');
}

function addLog(text){
  state.log.push(`${new Date().toLocaleTimeString()} — ${text}`);
  if(state.log.length>200) state.log.shift();
}

// Игровая механика добычи
function mineOnce(){
  const pick = PICKAXE_LIST[state.pickaxeIndex];
  // pick.power влияет на количество "хитов" по одной кнопке
  // используем дробную power: шанс дополнительной попытки
  const baseAttempts = Math.floor(pick.power);
  let extra = Math.random() < (pick.power - baseAttempts) ? 1 : 0;
  const attempts = baseAttempts + extra;

  let gained = 0;
  let drops = {};
  for(let i=0;i<attempts;i++){
    const ore = weightedPick(RUDE_LIST);
    // количество руды за выпадение = 1 для простоты, можно масштабировать
    state.inventory[ore.id] = (state.inventory[ore.id] || 0) + 1;
    gained += ore.value;
    drops[ore.name] = (drops[ore.name] || 0) + 1;
  }
  // добавляем монеты (множитель тоже зависит от силы кирки)
  const earned = gained * (pick.power * 0.6 + 0.4); // сила увеличивает доход не линейно
  state.balance += earned;

  let dropsText = Object.entries(drops).map(([k,v])=>`${k}×${v}`).join(', ');
  addLog(`Добыто: ${dropsText}. Получено ${formatNumber(earned)}💰`);
  saveState();
  updateUI();
}

// Покупка кирки
function buyPickaxe(idx){
  const p = PICKAXE_LIST[idx];
  if(idx <= state.pickaxeIndex) return;
  if(state.balance < p.price){ addLog('Недостаточно монет для покупки'); updateUI(); return; }
  state.balance -= p.price;
  state.pickaxeIndex = idx;
  addLog(`Куплена ${p.name} за ${p.price}💰`);
  saveState();
  updateUI();
}

// Инициализация
function init(){
  loadState();
  // ensure inventory keys exist
  RUDE_LIST.forEach(r=>{ if(!(r.id in state.inventory)) state.inventory[r.id]=0; });
  // normalize chances if needed
  const sum = RUDE_LIST.reduce((s,r)=>s+r.chance,0);
  if(Math.abs(sum-1) > 0.0001){
    RUDE_LIST.forEach(r=> r.chance = r.chance / sum);
  }
  document.getElementById('mineBtn').addEventListener('click', ()=>{
    mineOnce();
  });
  updateUI();
  addLog('Игра загружена. Удачной добычи!');
  saveState();
}

window.addEventListener('load', init);
