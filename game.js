// game.js - логика MineGame v2
const RUDE_LIST = [
  { id: "stone", name: "Камень", value: 1, chance: 0.5 },
  { id: "coal", name: "Уголь", value: 3, chance: 0.3 },
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

const STORAGE_KEY = 'minegame_v2_state';
let state = { balance:0, pickaxeIndex:0, inventory:{}, log:[] };

function loadState(){ const raw = localStorage.getItem(STORAGE_KEY); if(raw) state=JSON.parse(raw); }
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); document.getElementById('saveState').innerText='Автоматически (сохранено)'; }

function updateUI(){
  document.getElementById('balance').innerText='Монет: '+Math.round(state.balance);
  document.getElementById('pickaxe').innerText='Кирка: '+PICKAXE_LIST[state.pickaxeIndex].name;
  const inv = document.getElementById('inventoryList'); inv.innerHTML=''; RUDE_LIST.forEach(r=>{
    const cnt=state.inventory[r.id]||0;
    const el=document.createElement('div'); el.innerText=r.name+' × '+cnt; inv.appendChild(el);
  });
  const shop=document.getElementById('shopList'); shop.innerHTML=''; PICKAXE_LIST.forEach((p,idx)=>{
    const canBuy=state.balance>=p.price && idx>state.pickaxeIndex;
    const row=document.createElement('div'); row.innerText=p.name+' — '+p.price+'💰';
    const btn=document.createElement('button'); btn.className='small-btn'; btn.innerText=idx===state.pickaxeIndex?'Текущая':(canBuy?'Купить':'Недоступно');
    if(canBuy){ btn.onclick=()=>buyPickaxe(idx); } else { btn.disabled=true; } row.appendChild(btn); shop.appendChild(row);
  });
  const logEl=document.getElementById('log'); logEl.innerHTML=state.log.slice(-6).map(s=>'<div>'+s+'</div>').join('');
}

function addLog(text){ state.log.push(new Date().toLocaleTimeString()+' — '+text); if(state.log.length>200) state.log.shift(); }

function weightedPick(list){ const r=Math.random(); let acc=0; for(const item of list){ acc+=item.chance; if(r<=acc) return item; } return list[list.length-1]; }

function mineOnce(){
  const pick=PICKAXE_LIST[state.pickaxeIndex];
  const base=Math.floor(pick.power); const extra=Math.random()<(pick.power-base)?1:0; const attempts=base+extra;
  let drops={};
  for(let i=0;i<attempts;i++){ const ore=weightedPick(RUDE_LIST); state.inventory[ore.id]=(state.inventory[ore.id]||0)+1; drops[ore.name]=(drops[ore.name]||0)+1; }
  addLog('Добыто: '+Object.entries(drops).map(([k,v])=>k+'×'+v).join(', ')+'. Монеты не начисляются — продай руду!');
  saveState(); updateUI();
}

function buyPickaxe(idx){ const p=PICKAXE_LIST[idx]; if(idx<=state.pickaxeIndex) return; if(state.balance<p.price){ addLog('Недостаточно монет'); updateUI(); return; } state.balance-=p.price; state.pickaxeIndex=idx; addLog('Куплена '+p.name+' за '+p.price+'💰'); saveState(); updateUI(); }

function sellAll(){ let total=0; for(const ore of RUDE_LIST){ const cnt=state.inventory[ore.id]||0; if(cnt>0){ total+=cnt*ore.value; state.inventory[ore.id]=0; } } if(total===0){ addLog('Нечего продавать.'); } else{ state.balance+=total; addLog('Продано руды на сумму '+total+'💰'); } saveState(); updateUI(); }

function init(){
  loadState(); RUDE_LIST.forEach(r=>{ if(!(r.id in state.inventory)) state.inventory[r.id]=0; });
  const sum=RUDE_LIST.reduce((s,r)=>s+r.chance,0); if(Math.abs(sum-1)>0.0001) RUDE_LIST.forEach(r=>r.chance/=sum);
  document.getElementById('mineBtn').addEventListener('click',()=>mineOnce());
  document.getElementById('sellAllBtn').addEventListener('click',()=>sellAll());
  updateUI(); addLog('Игра загружена. Удачной добычи!');
  saveState();
}

window.addEventListener('load', init);
