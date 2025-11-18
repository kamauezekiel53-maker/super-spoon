// js/ui.js
const UI = (function(){
  const moviesGrid = document.getElementById('moviesGrid');
  const loader = document.getElementById('loader');

  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modalClose');
  const modalPoster = document.getElementById('modalPoster');
  const modalTitle = document.getElementById('modalTitle');
  const modalOverview = document.getElementById('modalOverview');
  const modalSub = document.getElementById('modalSub');
  const modalCast = document.getElementById('modalCast');
  const modalVideos = document.getElementById('modalVideos');
  const modalDownload = document.getElementById('modalDownload');
  const favBtn = document.getElementById('favBtn');
  const openTmdb = document.getElementById('openTmdb');

  function showLoader(){ loader.classList.remove('hidden'); loader.innerHTML = '<div class="loader"></div>'; }
  function hideLoader(){ loader.classList.add('hidden'); loader.innerHTML = ''; }

  function clearGrid(){ moviesGrid.innerHTML = ''; }

  function renderMovies(list, type = 'movie'){
    clearGrid();
    if(!list || list.length===0){
      moviesGrid.innerHTML = '<p class="muted">No results found.</p>';
      return;
    }
    for(const m of list){
      const id = m.id || m.movieid || m._id;
      const title = m.title || m.name || m.title_en || '';
      const poster = (m.poster_path && m.poster_path.startsWith('/')) ? ('https://image.tmdb.org/t/p/w500' + m.poster_path) : (m.poster || m.image || '');
      const year = (m.release_date || m.first_air_date || m.year || '').slice(0,4);
      const card = document.createElement('article');
      card.className = 'card';
      card.dataset.id = id;
      card.dataset.type = type;
      card.innerHTML = `
        <div class="poster"><img src="${poster || ''}" alt="${escapeHtml(title)}"></div>
        <div class="card-body">
          <div class="title-row"><h3>${escapeHtml(title)}</h3></div>
          <div style="font-size:13px;color:var(--muted)">${escapeHtml(year)}</div>
        </div>
      `;
      moviesGrid.appendChild(card);
    }
  }

  function escapeHtml(s=''){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

  function openModal(){
    modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  }
  function closeModal(){
    modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; modalPoster.src=''; modalVideos.innerHTML=''; modalDownload.innerHTML=''; modalCast.innerHTML='';
  }

  function setModalBasic({ poster='', title='', sub='', overview='', tmdbUrl='' }){
    modalPoster.src = poster || '';
    modalTitle.textContent = title || '';
    modalSub.textContent = sub || '';
    modalOverview.textContent = overview || '';
    openTmdb.href = tmdbUrl || '#';
  }

  function setModalCast(arr){
    modalCast.innerHTML = (arr && arr.length) ? arr.slice(0,8).map(c => `<div><img src="${c.profile_path? 'https://image.tmdb.org/t/p/w200'+c.profile_path : ''}" alt="${escapeHtml(c.name)}"><small>${escapeHtml(c.name)}</small></div>`).join('') : '<p class="muted">No cast available.</p>';
  }

  function setModalVideos(vids){
    modalVideos.innerHTML = (vids && vids.length) ? vids.filter(v=>v.site==='YouTube').map(v=>`<iframe src="https://www.youtube.com/embed/${v.key}" allowfullscreen></iframe>`).join('') : '<p class="muted">No trailers available.</p>';
  }

  function setModalDownloads({ sources = [], subtitles = [] }){
    // build sources UI
    if(!sources || sources.length === 0){
      modalDownload.innerHTML = '<p class="muted">No download links available.</p>';
      return;
    }
    const html = sources.map(s => {
      const q = escapeHtml(s.quality || s.label || 'Link');
      const dl = escapeHtml(s.download_url || s.download || s.url || s.link || s.stream_url || s.stream || '');
      const size = s.size ? (isNaN(s.size) ? s.size : (Number(s.size)/1024/1024).toFixed(1)+' MB') : 'Unknown';
      return `<div style="margin-bottom:10px"><strong style="color:var(--accent)">${q}</strong><br><a class="btn" href="${dl}" target="_blank" rel="noopener">Open / Download (${size})</a></div>`;
    }).join('');
    const subsHtml = (subtitles && subtitles.length) ? `<h4>Subtitles</h4>` + subtitles.map(s => `<a class="btn outline" href="${s.url}" target="_blank" rel="noopener">${escapeHtml(s.lanName||s.lan||'Sub')}</a>`).join(' ') : '';
    modalDownload.innerHTML = html + subsHtml;
  }

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if(e.target === modal) closeModal(); });

  return {
    showLoader, hideLoader, renderMovies, openModal, closeModal, setModalBasic, setModalCast, setModalVideos, setModalDownloads
  };
})();