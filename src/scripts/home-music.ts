const player = document.querySelector<HTMLElement>('[data-music-player]');
const audio = player?.querySelector<HTMLAudioElement>('[data-home-audio]');
if (player && audio) {
  const tracks: { title:string; artist:string; audio:string; cover:string|null }[] = JSON.parse(player.querySelector('[data-music-tracks]')?.textContent || '[]');
  const play = player.querySelector<HTMLButtonElement>('[data-music-play]')!;
  const seek = player.querySelector<HTMLInputElement>('#home-music-seek')!;
  const feedback = player.querySelector<HTMLElement>('[data-music-feedback]')!;
  let index = 0;
  const format = (seconds:number) => Number.isFinite(seconds) ? `${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}` : '--:--';
  const begin = () => audio.play().catch(() => { feedback.textContent='暂时无法播放，请检查音频地址。'; });
  const updateButton = () => { play.textContent=audio.paused?'▶':'Ⅱ'; play.setAttribute('aria-label',audio.paused?'播放音乐':'暂停音乐'); player.classList.toggle('is-playing',!audio.paused); };
  const load = (offset:number) => {
    index=(index+offset+tracks.length)%tracks.length;
    const track=tracks[index]; audio.src=track.audio; feedback.textContent='';
    player.querySelector('[data-track-title]')!.textContent=track.title;
    player.querySelector('[data-track-artist]')!.textContent=track.artist;
    const disc=player.querySelector('.home-disc')!;disc.replaceChildren();
    if(track.cover){const img=document.createElement('img');img.src=track.cover;img.alt='';img.width=76;img.height=76;disc.append(img);}else{const span=document.createElement('span');span.textContent='♪';disc.append(span);}
    seek.value='0';seek.disabled=true;player.querySelector('[data-current-time]')!.textContent='00:00';player.querySelector('[data-duration]')!.textContent='--:--';
    void begin();
  };
  play.addEventListener('click',()=>{if(audio.paused)void begin();else audio.pause();});
  player.querySelector('[data-music-prev]')?.addEventListener('click',()=>load(-1));
  player.querySelector('[data-music-next]')?.addEventListener('click',()=>load(1));
  audio.addEventListener('play',()=>{feedback.textContent='';updateButton();});audio.addEventListener('pause',updateButton);
  audio.addEventListener('loadedmetadata',()=>{seek.disabled=!Number.isFinite(audio.duration);player.querySelector('[data-duration]')!.textContent=format(audio.duration);});
  audio.addEventListener('timeupdate',()=>{player.querySelector('[data-current-time]')!.textContent=format(audio.currentTime);if(Number.isFinite(audio.duration)&&audio.duration>0)seek.value=String(audio.currentTime/audio.duration*100);});
  seek.addEventListener('input',()=>{if(Number.isFinite(audio.duration))audio.currentTime=Number(seek.value)/100*audio.duration;});
  audio.addEventListener('error',()=>{feedback.textContent='音频暂时无法加载，可前往音乐页选择其他歌曲。';updateButton();});
  audio.addEventListener('ended',()=>{updateButton();if(tracks.length>1)load(1);});
}
