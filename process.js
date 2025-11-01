// process.js — Preprocess files_info.json to multiple analysis JSONs (data cloud, tags, graph, timeline)

(function(){
  const $ = (sel)=>document.querySelector(sel);
  const $$ = (sel)=>Array.from(document.querySelectorAll(sel));

  const log = (msg)=>{
    const box = $('#log');
    const pre = document.createElement('pre');
    pre.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    box.appendChild(pre);
  };

  async function loadBase(){
    const res = await fetch('files_info.json');
    if(!res.ok) throw new Error('files_info.json 불러오기 실패');
    return res.json();
  }

  function parseJSON(text, fallback){
    try { return JSON.parse(text); }
    catch(e){ log('설정 JSON 파싱 실패, 기본값 사용: '+e.message); return fallback; }
  }

  // ---- helpers ----
  const extOf = (fname)=> {
    const i = fname.lastIndexOf('.');
    return i>=0 ? fname.slice(i+1).toLowerCase() : '';
  };
  const getFileName = (path)=> {
    const parts = (path||'').split('/');
    return parts[parts.length-1] || path;
  };
  const tokenize = (s, {lowercase=true, stripYears=true, stopwords=[]}={})=>{
    if(!s) return [];
    let t = s.normalize('NFC');
    if(lowercase) t = t.toLowerCase();
    // Replace punctuation & separators with space
    t = t.replace(/[\[\]{}()<>:;,.!?"'`~@#$%^&*+=\\/|_]+/g, ' ');
    // collapse spaces
    t = t.replace(/\s+/g, ' ').trim();
    let toks = t.split(' ');
    if(stripYears) toks = toks.filter(w=>!/^(19|20)\d{2}$/.test(w));
    const stop = new Set(stopwords||[]);
    toks = toks.filter(w=>w && !stop.has(w) && w.length>=2);
    return toks;
  };

  function buildTagRules(rulesArr){
    // Compile regex
    return (rulesArr||[]).map(r=>{
      try {
        return { re: new RegExp(r.pattern, 'i'), tag: r.tag };
      } catch(e){
        log('정규식 컴파일 실패: '+r.pattern+' -> '+e.message);
        return null;
      }
    }).filter(Boolean);
  }

  function applyRulesToName(name, compiledRules){
    const tags = [];
    for(const r of compiledRules){
      if(r.re.test(name)) tags.push(r.tag);
    }
    return Array.from(new Set(tags));
  }

  // ---- generators ----

  function genWordCloud(base, opts){
    const freq = {};
    base.forEach(rec=>{
      const name = getFileName(rec.html_file);
      tokenize(name, opts).forEach(tok=>{
        freq[tok] = (freq[tok]||0) + 1;
      });
    });
    const rows = Object.entries(freq)
      .map(([text, value])=>({text, value}))
      .sort((a,b)=>b.value-a.value);
    return rows;
  }

  function genTagDistribution(base, compiledRules){
    const tagCnt = {};
    const subTagCnt = {};
    const detail = [];

    base.forEach(rec=>{
      const name = getFileName(rec.html_file);
      const tags = applyRulesToName(name, compiledRules);
      const exts = new Set((rec.files||[]).map(extOf));
      const subs = [];
      if(exts.has('pdf')) subs.push('has_pdf');
      if(exts.has('hwp') || exts.has('hwpx')) subs.push('has_hanword');
      if(exts.has('docx')) subs.push('has_docx');
      if(['jpg','jpeg','png','gif'].some(x=>exts.has(x))) subs.push('has_images');
      if(exts.has('zip') || exts.has('rar')) subs.push('has_archives');
      if(exts.has('mht') || exts.has('mhtml')) subs.push('has_mht');
      if(['wma','mp3','wav'].some(x=>exts.has(x))) subs.push('has_audio');
      if(['xlsx','xls','csv'].some(x=>exts.has(x))) subs.push('has_spreadsheet');

      tags.forEach(t=> tagCnt[t] = (tagCnt[t]||0)+1);
      subs.forEach(s=> subTagCnt[s] = (subTagCnt[s]||0)+1);
      detail.push({ html_file: rec.html_file, folder: rec.folder, tags, subs, files: rec.files||[] });
    });

    const tagsArr = Object.entries(tagCnt).map(([tag,count])=>({tag,count})).sort((a,b)=>b.count-a.count);
    const subsArr = Object.entries(subTagCnt).map(([tag,count])=>({tag,count})).sort((a,b)=>b.count-a.count);
    return { tags: tagsArr, subtags: subsArr, detail };
  }

  function genKnowledgeGraph(base, compiledRules){
    const nodes = [];
    const links = [];
    const nodeIndex = new Map();

    function addNode(id, type){
      if(nodeIndex.has(id)) return nodeIndex.get(id);
      const idx = nodes.length;
      nodes.push({ id, type });
      nodeIndex.set(id, idx);
      return idx;
    }

    base.forEach(rec=>{
      const fileId = rec.html_file;
      addNode(fileId, 'file');
      const name = getFileName(rec.html_file);
      const tags = applyRulesToName(name, compiledRules);
      tags.forEach(t=>{
        addNode(t, 'tag');
        links.push({ source: fileId, target: t, weight: 1 });
      });
    });

    return { nodes, links };
  }

  function genTimeline(base){
    const byYear = {};
    base.forEach(rec=>{
      const m = (rec.html_file||'').match(/\b(19|20)\d{2}\b/);
      if(!m) return;
      const y = m[0];
      byYear[y] = byYear[y] || { docs:0, images:0, others:0 };
      byYear[y].docs += 1;
      (rec.files||[]).forEach(fn=>{
        const e = extOf(fn);
        if(['jpg','jpeg','png','gif'].includes(e)) byYear[y].images += 1;
        else byYear[y].others += 1;
      });
    });
    return Object.entries(byYear)
      .map(([year,val])=>({year:Number(year), ...val}))
      .sort((a,b)=>a.year-b.year);
  }

  function downloadJSON(obj, name){
    const blob = new Blob([JSON.stringify(obj, null, 2)], {type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 500);
    log(`파일 생성: ${name}`);
  }

  async function run(){
    $('#log').innerHTML = '';
    log('files_info.json 불러오는 중...');
    const base = await loadBase();
    log(`레코드 수: ${base.length}`);

    // Settings
    const lowercase = $('#lowercase').checked;
    const stripYears = $('#stripYears').checked;
    const stopwords = parseJSON($('#stopwords').value, []);
    const tagRules = parseJSON($('#tagRules').value, []);
    const compiledRules = buildTagRules(tagRules);

    const selected = Array.from($('#jobs').selectedOptions).map(o=>o.value);
    if(selected.length===0){
      log('선택된 작업이 없습니다. 좌측 리스트에서 하나 이상 선택하세요.');
      return;
    }

    for(const job of selected){
      try{
        switch(job){
          case 'wordcloud': {
            log('① 데이터 클라우드(단어 빈도) 생성...');
            const opts = { lowercase, stripYears, stopwords };
            const rows = genWordCloud(base, opts);
            downloadJSON(rows, 'word_cloud_terms.json');
            break;
          }
          case 'tags': {
            log('② 태그/보조태그 분포 생성...');
            const obj = genTagDistribution(base, compiledRules);
            downloadJSON(obj, 'tag_distribution.json');
            break;
          }
          case 'graph': {
            log('③ 네트워크(파일↔태그) 생성...');
            const graph = genKnowledgeGraph(base, compiledRules);
            downloadJSON(graph, 'knowledge_graph.json');
            break;
          }
          case 'timeline': {
            log('④ 연대기(연도별 활동) 생성...');
            const tl = genTimeline(base);
            downloadJSON(tl, 'timeline_by_year.json');
            break;
          }
        }
      }catch(e){
        log(`에러: ${e.message}`);
      }
    }
    log('완료.');
  }

  $('#runBtn').addEventListener('click', run);
})();