// game.js - MineGame Advanced
const RUDE_LIST = [
  {id:"stone",name:"Камень",value:1},
  {id:"coal",name:"Уголь",value:3},
  {id:"iron",name:"Железо",value:8},
  {id:"gold",name:"Золото",value:15},
  {id:"diamond",name:"Алмаз",value:40}
];

const MONSTERS = [
  {name:"Пещерный медведь", chance:0.05},
  {name:"Паук", chance:0.08}
];

const PICKAXE_LIST=[
  {id:"wood",name:"Деревянная кирка",power:1,price:0},
  {id:"stone",name:"Каменная кирка",power:1.5,price:50},
  {id:"iron",name:"Железная кирка",power:2,price:150},
  {id:"gold",name:"Золотая кирка",power:3,price:400},
  {id:"diamond",name:"Алмазная кирка",power:5,price:1000}
];

let state = {
  balance:0,
  inventory:{},
  pickaxeIndex:0,
  energy:20,
  maxEnergy:20,
  mining:false,
  timer:0
};

function saveState(){localStorage.setItem('minegame_adv',JSON.stringify(state));document.getElementById('saveState').innerText='Автоматически (сохранено)';}
function loadState(){const s=localStorage.getItem('minegame_adv');if(s) state=JSON.parse(s);}

function updateUI(){
  document.getElementById('balance').innerText='Монет: '+Math.round(state.balance);
  document.getElementById('pickaxe').innerText='Кирка: '+PICKAXE_LIST[state.pickaxeIndex].name;
  document.getElementById('energy').innerText='Энергия: '+state.energy+'/'+state.maxEnergy;
  const inv=document.getElementById('inventoryList'); inv.innerHTML=''; RUDE_LIST.forEach(r=>{const cnt=state.inventory[r.id]||0; const el=document.createElement('div'); el.innerText=r.name+' × '+cnt; inv.appendChild(el);});
}

function addLog(msg){
  const log=document.getElementById('eventLog'); log.innerHTML=msg+'<br>'+log.innerHTML;
}

function tickMining(){
  if(state.timer>0){state.timer--; document.getElementById('timer').innerText='Время копки: '+state.timer; return;}
  state.mining=false;
  document.getElementById('timer').innerText='Время копки: 0';
  // начисляем ресурсы
  const pick=PICKAXE_LIST[state.pickaxeIndex];
  const amount=Math.floor(pick.power + Math.random()*2);
  const ore=RUDE_LIST[Math.floor(Math.random()*RUDE_LIST.length)];
  state.inventory[ore.id]=(state.inventory[ore.id]||0)+amount;
  addLog('Добыто '+amount+'× '+ore.name);
  // шанс монстра
  MONSTERS.forEach(m=>{if(Math.random()<m.chance) addLog('Встретился монстр: '+m.name+'!');});
  saveState(); updateUI();
}

function dig(){
  if(state.mining){addLog('Копка уже идет!'); return;}
  if(state.energy<1){addLog('Недостаточно энергии для копки'); return;}
  state.energy--; state.mining=true; state.timer=Math.max(3,5-MICKAXE_LIST[state.pickaxeIndex].power); // чем мощнее кирка, меньше таймер
  document.getElementById('timer').innerText='Время копки: '+state.timer;
  addLog('Начата копка...');
}

function sell(){
  let total=0;
  for(const r of RUDE_LIST){const cnt=state.inventory[r.id]||0; total+=cnt*r.value; state.inventory[r.id]=0;}
  state.balance+=total; addLog('Продано на '+total+'💰');
  saveState(); updateUI();
}

function init(){
  loadState(); RUDE_LIST.forEach(r=>{if(!state.inventory[r.id]) state.inventory[r.id]=0;});
  document.getElementById('digBtn').addEventListener('click',dig);
  document.getElementById('sellBtn').addEventListener('click',sell);
  setInterval(()=>{if(state.mining) tickMining();},1000);
  setInterval(()=>{if(state.energy<state.maxEnergy) state.energy++; updateUI();},60000);
  updateUI(); addLog('Игра загружена.');
  saveState();
}

window.addEventListener('load',init);
