// js/app.js
(async function(){
  // state
  const state = { section: 'popular', page: 1, total_pages: 1, query: '', debounce: null };

  // DOM
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const sectionSelect = document.getElementById('sectionSelect');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');

  // helper: determine TMDB section mapping used by API.getSection
  async function loadSection(section = state.section, page = state.page){
    try{
      UI.showLoader();
      const data = await API.getSection(section, page);
      const list = data.results || [];
      // For tv_popular we pass type 'tv' to UI to allow open as tv
      UI.renderMovies(list, section === 'tv_popular' ? 'tv' : (section === 'anime' ? 'tv' : 'movie'));
      state.total_pages = data.total_pages || 1;
      pageInfo.textContent = `Page ${state.page} of ${state.total_pages}`;
    }catch(e){
      console.error(e);
      document.getElementById('moviesGrid').innerHTML = '<p class="muted">Failed to load.</p>';
    }finally{
      UI.hideLoader();
    }
  }

  // search TMDb
  async function doSearch(query){
    try{
      UI.showLoader();
      const data = await API.searchTMDB(query, 1);
      const results = data.results || [];
      // show only movies and tv (filter out people)
      const filtered = results.filter(r => r.media_type !== 'person').slice(0, 80);
      UI.renderMovies(filtered, 'movie');
      state.total_pages = data.total_pages || 1;
      pageInfo.textContent = `Search results: ${filtered.length}`;
    }catch(e){
      console.error(e);
      document.getElementById('moviesGrid').innerHTML = '<p class="muted">Search failed.</p>';
    }finally{
      UI.hideLoader();
    }
  }

  // open modal: get TMDb details, then try GiftedTech sources by searching GiftedTech for title+year
  async function openModal(tmdbId, mediaType='movie'){
    try{
      UI.showLoader();
      // tmdbData
      const tmdb = mediaType === 'tv' ? await API.getTMDBTV(tmdbId) : await API.getTMDBMovie(tmdbId);
      const title = tmdb.title || tmdb.name || '';
      const year = (tmdb.release_date || tmdb.first_air_date || '').slice(0,4);
      const poster = tmdb.poster_path ? 'https://image.tmdb.org/t/p/w500' + tmdb.poster_path : '';
      const overview = tmdb.overview || '';

      // show TMDb data in modal
      UI.setModalBasic({ poster, title, sub: `${year} • ${tmdb.runtime ? tmdb.runtime+' min' : ''}`, overview, tmdbUrl: `https://www.themoviedb.org/${mediaType}/${tmdbId}` });
      UI.setModalCast(tmdb.credits?.cast || []);
      UI.setModalVideos(tmdb.videos?.results || []);

      UI.openModal();

      // Try to get GiftedTech movieid: search Gift by title
      const found = await API.searchGift(title);
      const candidates = found.results || [];
      // try match by year
      let giftId = null;
      if(candidates.length){
        const matched = candidates.find(c => String(c.year) === String(year)) || candidates[0];
        giftId = matched?.movieid || matched?.id || matched?._id;
      }

      // If found giftId, fetch sources, else try fuzzy: searchGift with title + year
      let sources = { results: [], subtitles: [] };
      if(giftId){
        sources = await API.getGiftSourcesByMovieId(giftId);
      } else {
        // try search by title+year
        const fallback = await API.searchGift(`${title} ${year}`);
        const fList = fallback.results || [];
        if(fList.length){
          const m = fList[0];
          giftId = m?.movieid || m?.id || m?._id;
          if(giftId) sources = await API.getGiftSourcesByMovieId(giftId);
        }
      }

      // present GiftedTech sources in modal
      UI.setModalDownloads({ sources: sources.results || [], subtitles: sources.subtitles || [] });

    }catch(e){
      console.error('openModal error', e);
      UI.setModalBasic({ poster:'', title:'Failed to load', overview:'', sub:'' });
      UI.setModalDownloads({ sources: [], subtitles: [] });
      UI.openModal();
    }finally{
      UI.hideLoader();
    }
  }

  // click delegation for opening cards
  document.getElementById('moviesGrid').addEventListener('click', e=>{
    const card = e.target.closest('.card');
    if(!card) return;
    const id = card.dataset.id;
    const type = card.dataset.type || 'movie';
    // if id is TMDB id numeric -> open TMDB modal
    if(id && /^[0-9]+$/.test(id)){
      // id is TMDb numeric id
      location.hash = `/movie/${id}`; // router will handle opening
      openModal(id, type === 'tv' ? 'tv' : 'movie');
    } else {
      // fallback: card might be GiftedTech item (movieid) — open GiftedTech details using getMovie + find TMDb not available
      (async ()=> {
        UI.showLoader();
        try{
          const giftMovie = await API.getGiftMovie(id);
          // attempt to show simple info from Gift if TMDb not used
          const poster = giftMovie.poster || '';
          const t = giftMovie.title || giftMovie.name || 'Untitled';
          UI.setModalBasic({ poster, title: t, sub: giftMovie.year || '' , overview: giftMovie.plot || '' });
          UI.openModal();
          const sources = await API.getGiftSourcesByMovieId(id);
          UI.setModalDownloads({ sources: sources.results || [], subtitles: sources.subtitles || [] });
        }catch(err){
          console.error(err);
        }finally{ UI.hideLoader(); }
      })();
    }
  });

  // router exposure for deep links
  window.App = {
    openFromRouter: async function(tmdbId){
      // router passes TMDb id
      await openModal(tmdbId, 'movie');
    }
  };

  // search handlers (debounce)
  let debounceTimer = null;
  searchInput.addEventListener('input', (e)=>{
    const q = e.target.value.trim();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(()=> {
      if(!q) {
        loadSection('popular',1);
        return;
      }
      doSearch(q);
    }, 420);
  });
  searchBtn.addEventListener('click', ()=> doSearch(searchInput.value.trim()));

  // sections
  sectionSelect.addEventListener('change', (e)=> {
    state.section = e.target.value;
    state.page = 1;
    loadSection(state.section, state.page);
  });

  prevBtn.addEventListener('click', ()=> {
    if(state.page > 1){ state.page--; loadSection(state.section, state.page); }
  });
  nextBtn.addEventListener('click', ()=> {
    if(state.page < state.total_pages){ state.page++; loadSection(state.section, state.page); }
  });

  // initial load
  await loadSection('popular',1);
})();