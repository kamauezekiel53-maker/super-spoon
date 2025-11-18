// js/api.js
const API = (function(){
  // --- CONFIG ---
  const TMDB_API_KEY = '7cc9abef50e4c94689f48516718607be'; // <--- your TMDB key
  const TMDB_BASE = 'https://api.themoviedb.org/3';
  // Optional: use a CORS proxy for TMDb if you encounter CORS in browser:
  const TMDB_PROXY = url => `https://corsproxy.io/?${encodeURIComponent(url)}`;

  const GIFT_BASE = 'https://movieapi.giftedtech.co.ke/api';

  const CACHE = new Map();

  // Helper for TMDb GET with api_key and optional proxy
  async function tmdbGet(path, params = {}, useProxy = true){
    const u = new URL(`${TMDB_BASE}${path}`);
    u.searchParams.set('api_key', TMDB_API_KEY);
    Object.keys(params || {}).forEach(k => u.searchParams.set(k, params[k]));
    const url = useProxy ? TMDB_PROXY(u.toString()) : u.toString();
    const res = await axios.get(url);
    return res;
  }

  // GiftedTech GET (no proxy)
  async function giftGet(path, params = {}){
    const u = new URL(`${GIFT_BASE}${path}`);
    Object.keys(params || {}).forEach(k => u.searchParams.set(k, params[k]));
    const res = await axios.get(u.toString());
    return res;
  }

  // --- TMDb methods ---
  async function searchTMDB(query, page=1){
    if(!query) return { results: [] };
    const key = `tmdb:search:${query.toLowerCase()}:${page}`;
    if(CACHE.has(key)) return CACHE.get(key);
    const res = await tmdbGet('/search/multi', { query, page });
    CACHE.set(key, res);
    return res;
  }

  async function getSection(section, page=1){
    // section: popular, trending, now_playing, top_rated, tv_popular, anime -> map to TMDb endpoints
    let path;
    if(section === 'trending') path = '/trending/movie/week';
    else if(section === 'now_playing') path = '/movie/now_playing';
    else if(section === 'top_rated') path = '/movie/top_rated';
    else if(section === 'tv_popular') path = '/tv/popular';
    else if(section === 'anime') path = '/discover/tv';
    else path = '/movie/popular';

    const key = `tmdb:section:${section}:${page}`;
    if(CACHE.has(key)) return CACHE.get(key);

    const params = { page };
    if(section === 'anime') params.with_genres = '16';
    const res = await tmdbGet(path, params);
    CACHE.set(key, res);
    return res;
  }

  async function getTMDBMovie(id){
    const key = `tmdb:movie:${id}`;
    if(CACHE.has(key)) return CACHE.get(key);
    const res = await tmdbGet(`/movie/${id}`, { append_to_response: 'videos,credits' });
    CACHE.set(key, res);
    return res;
  }

  async function getTMDBTV(id){
    const key = `tmdb:tv:${id}`;
    if(CACHE.has(key)) return CACHE.get(key);
    const res = await tmdbGet(`/tv/${id}`, { append_to_response: 'videos,credits' });
    CACHE.set(key, res);
    return res;
  }

  // --- GiftedTech methods ---
  // Search GiftedTech for a title to get gift movieid
  async function searchGift(title){
    if(!title) return { results: [] };
    const key = `gift:search:${title.toLowerCase()}`;
    if(CACHE.has(key)) return CACHE.get(key);
    const res = await giftGet('/searchMovie', { query: title });
    CACHE.set(key, res);
    return res;
  }

  // Get movie details from GiftedTech by id
  async function getGiftMovie(id){
    if(!id) return null;
    const key = `gift:movie:${id}`;
    if(CACHE.has(key)) return CACHE.get(key);
    const res = await giftGet('/getMovie', { id });
    CACHE.set(key, res);
    return res;
  }

  // Get sources by gift movieid
  async function getGiftSourcesByMovieId(movieid){
    if(!movieid) return { results: [], subtitles: [] };
    const key = `gift:sources:${movieid}`;
    if(CACHE.has(key)) return CACHE.get(key);
    const res = await giftGet('/getSources', { movieid });
    // normalize
    const out = {
      results: res.results || res.sources || res.data || [],
      subtitles: res.subtitles || res.subs || []
    };
    CACHE.set(key, out);
    return out;
  }

  // Find best matching gift movieid for a TMDb movie (match by title + year)
  async function findGiftMovieIdForTitle(title, year){
    // try exact search
    const s = await searchGift(title);
    const list = s.results || [];
    if(!list.length) return null;
    // try match by year
    const match = list.find(i => String(i.year) === String(year)) || list[0];
    return match?.movieid || match?.id || null;
  }

  return {
    // TMDb
    searchTMDB,
    getSection,
    getTMDBMovie,
    getTMDBTV,
    // Gift
    searchGift,
    getGiftMovie,
    getGiftSourcesByMovieId,
    findGiftMovieIdForTitle,
    _cache: CACHE
  };
})();