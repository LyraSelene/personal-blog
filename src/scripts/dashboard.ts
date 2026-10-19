const root=document.documentElement;
const theme=document.querySelector<HTMLButtonElement>('[data-dashboard-theme]');
const caption=document.querySelector<HTMLElement>('[data-theme-caption]');
const labels:Record<string,string>={light:'浅色模式',dark:'深色模式',system:'跟随系统'};
const updateTheme=()=>{const preference=root.dataset.preference||'system';if(theme)theme.textContent=root.dataset.theme==='dark'?'切换为浅色':'切换为深色';if(caption)caption.textContent=labels[preference];};
if(theme){theme.hidden=false;theme.addEventListener('click',()=>{const next=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('lyra-theme',next);}catch{}root.dataset.theme=next;root.dataset.preference=next;updateTheme();});new MutationObserver(updateTheme).observe(root,{attributes:true,attributeFilter:['data-theme','data-preference']});updateTheme();}
const clock=document.querySelector<HTMLTimeElement>('[data-live-clock]');
const tick=()=>{if(clock){const now=new Date();clock.textContent=now.toLocaleTimeString('en-GB',{timeZone:'Asia/Shanghai',hour12:false});clock.dateTime=now.toISOString();}};
if(clock){tick();const timer=window.setInterval(()=>{if(!document.hidden)tick();},1000);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});}
const particles=document.querySelector<HTMLButtonElement>('[data-particles-toggle]');
if(particles){const reduce=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>{const active=root.dataset.effects!=='off'&&!reduce.matches;particles.textContent=reduce.matches?'舞台浮尘 · 已减少动态':`舞台浮尘 · ${active?'开':'关'}`;particles.setAttribute('aria-pressed',String(active));particles.disabled=reduce.matches;};particles.hidden=false;particles.addEventListener('click',()=>{const next=root.dataset.effects==='off'?'on':'off';root.dataset.effects=next;try{localStorage.setItem('lyra-effects',next);}catch{}update();});reduce.addEventListener('change',update);update();}
