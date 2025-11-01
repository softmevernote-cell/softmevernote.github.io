/* analytics.js — reads files_info.json and renders 4 analyses */
(async function(){
  const modeSel = document.getElementById('mode');
  const view = document.getElementById('view');
  const exportBtn = document.getElementById('exportBtn');

  // Load base data
  let base = [];
  try {
    const res = await fetch('files_info.json');
    base = await res.json();
  } catch(e) {
    view.innerHTML = `<div class="card">files_info.json을 불러오지 못했습니다: ${e}</div>`;
    return;
  }

  // Helpers
  const getFileName = (html_file) => {
    const parts = html_file.split('/');
    return parts[parts.length-1] || html_file;
  };
  const getYearFromPath = (html_file) => {
    const m = html_file.match(/\b(19|20)\d{2}\b/);
    return m ? m[0] : null;
  };
  const extOf = (fname) => {
    const i = fname.lastIndexOf('.');
    return i>=0 ? fname.slice(i+1).toLowerCase() : '';
  };

  // 2) Topic tagging rules
  const TAG_RULES = [
    [/Android|안드로이드|Webview|AsyncTask|Eclipse|Xdebug|Gradle|JQuery|jQuery|JavaScript|PowerShell|WSH|NAVER Tech Talk|디버깅/i, "tech/dev"],
    [/연서|가족|어린이집|증명사진|아기새|여권|가족/i, "life/family"],
    [/주차단속|집매매|철수확인서|인수인계|계약서|의견진술|익명신고|윤리경영|공정위|1종 보통 적성검사/i, "legal/admin"],
    [/비염|안약|헤르페스|건강/i, "health"],
    [/아이디어|계획|TODO|솔루션|관리툴|아이템/i, "idea/project"],
    [/정약용|주52시간|뉴스|철학|사회|매일경제|Chosunbiz/i, "society/thought"],
    [/NAS|시놀로지|DLNA|랜선|UTP|FTP|케이블/i, "hardware/it"],
  ];
  function tagFor(html_file){
    const name = getFileName(html_file);
    const tags = new Set();
    TAG_RULES.forEach(([re, tag]) => { if(re.test(name)) tags.add(tag); });
    return Array.from(tags);
  }
  function subTags(files){
    const set = new Set(files.map(extOf));
    const out = [];
    if(set.has('pdf')) out.push('has_pdf');
    if(set.has('hwp') || set.has('hwpx')) out.push('has_hanword');
    if(set.has('docx')) out.push('has_docx');
    if(['jpg','jpeg','png','gif'].some(x=>set.has(x))) out.push('has_images');
    if(set.has('zip') || set.has('rar')) out.push('has_archives');
    if(set.has('mht') || set.has('mhtml')) out.push('has_mht');
    if(['wma','mp3','wav'].some(x=>set.has(x))) out.push('has_audio');
    if(['xlsx','xls','csv'].some(x=>set.has(x))) out.push('has_spreadsheet');
    return out;
  }

  // 1) Summary by folder + ext dist
  function buildSummary(){
    const byFolder = {};
    const extCnt = {};
    base.forEach(rec=>{
      const f = rec.folder;
      byFolder[f] = byFolder[f] || { docs:0, attach:0, withAttach:0 };
      byFolder[f].docs += 1;
      byFolder[f].attach += (rec.files||[]).length;
      if ((rec.files||[]).length>0) byFolder[f].withAttach += 1;

      (rec.files||[]).forEach(fn=>{
        const e = extOf(fn);
        if(!e) return;
        extCnt[e] = (extCnt[e]||0)+1;
      });
    });
    return { byFolder, extCnt };
  }

  // 2) Topic classification
  function buildTags(){
    const tagged = base.map(rec=>{
      const tags = tagFor(rec.html_file);
      const subs = subTags(rec.files||[]);
      return {...rec, tags, subs};
    });
    const tagCnt = {};
    tagged.forEach(r=>{
      r.tags.forEach(t => tagCnt[t] = (tagCnt[t]||0)+1);
    });
    return { tagged, tagCnt };
  }

  // 3) Knowledge graph (tags <-> files)
  function buildGraph(){
    const { tagged } = buildTags();
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

    tagged.forEach(rec=>{
      const fId = rec.html_file;
      addNode(fId, 'file');
      rec.tags.forEach(t=>{
        addNode(t, 'tag');
        links.push({ source: fId, target: t, weight: 1 });
      });
    });

    return { nodes, links };
  }

  // 4) Timeline (by year)
  function buildTimeline(){
    const byYear = {};
    base.forEach(rec=>{
      const y = getYearFromPath(rec.html_file);
      if(!y) return;
      byYear[y] = byYear[y] || { docs:0, images:0, others:0 };
      byYear[y].docs += 1;
      (rec.files||[]).forEach(fn=>{
        const e = extOf(fn);
        if(['jpg','jpeg','png','gif'].includes(e)) byYear[y].images += 1;
        else byYear[y].others += 1;
      });
    });
    const rows = Object.entries(byYear)
      .map(([year,val])=>({year:+year, ...val}))
      .sort((a,b)=>a.year-b.year);
    return rows;
  }

  // Renderers
  function renderSummary(){
    const { byFolder, extCnt } = buildSummary();
    const folders = Object.entries(byFolder).map(([folder, s])=>{
      const rate = s.docs ? Math.round((s.withAttach/s.docs)*100) : 0;
      return { folder, ...s, attachRate: rate };
    }).sort((a,b)=>b.docs-a.docs);

    const exts = Object.entries(extCnt)
      .map(([ext,count])=>({ext,count}))
      .sort((a,b)=>b.count-a.count)
      .slice(0,30);

    view.innerHTML = `
      <div class="card">
        <div class="flex-between">
          <h2>폴더별 요약</h2>
          <span class="muted">문서 수/첨부 수/첨부 포함율</span>
        </div>
        <div class="row">
          <div class="col">
            <table>
              <thead><tr><th>폴더</th><th>문서 수</th><th>첨부 수</th><th>첨부 포함율</th></tr></thead>
              <tbody>
                ${folders.map(r=>`<tr><td>${r.folder}</td><td>${r.docs}</td><td>${r.attach}</td><td>${r.attachRate}%</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="col">
            <h3>상위 첨부 확장자 Top 30</h3>
            <table>
              <thead><tr><th>확장자</th><th>개수</th></tr></thead>
              <tbody>
                ${exts.map(r=>`<tr><td>.${r.ext}</td><td>${r.count}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    exportBtn.onclick = ()=>exportJSON({ byFolder, extCnt }, "summary_by_folder.json");
  }

  function renderTags(){
    const { tagged, tagCnt } = buildTags();
    const tagRows = Object.entries(tagCnt).map(([tag,count])=>({tag,count})).sort((a,b)=>b.count-a.count);
    const sample = tagged.slice(0,200);

    view.innerHTML = `
      <div class="card">
        <h2>주제 분류(키워드 태깅)</h2>
        <div class="row">
          <div class="col">
            <h3>태그 분포</h3>
            <div>${tagRows.map(t=>`<span class="pill">${t.tag} · ${t.count}</span>`).join(' ') || '<span class="muted">태그가 없습니다</span>'}</div>
          </div>
        </div>
        <div class="card">
          <h3>샘플(상위 200건)</h3>
          <table>
            <thead><tr><th>html_file</th><th>tags</th><th>sub-tags</th><th>첨부 수</th></tr></thead>
            <tbody>
              ${sample.map(r=>`<tr>
                <td>${r.html_file}</td>
                <td>${(r.tags||[]).join(', ')}</td>
                <td>${(r.subs||[]).join(', ')}</td>
                <td>${(r.files||[]).length}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    exportBtn.onclick = ()=>exportJSON({ tagged, tagCnt }, "meta_tags.json");
  }

  function renderGraph(){
    const data = buildGraph();
    view.innerHTML = `
      <div class="card">
        <div class="flex-between"><h2>지식 그래프</h2><span class="muted">파일 ↔ 태그 연결</span></div>
        <div id="chart"></div>
        <div class="muted">노드 드래그 가능 · 휠로 확대/축소</div>
      </div>
    `;
    drawForceGraph("#chart", data);
    exportBtn.onclick = ()=>exportJSON(data, "knowledge_graph.json");
  }

  function renderTimeline(){
    const rows = buildTimeline();
    view.innerHTML = `
      <div class="card">
        <div class="flex-between"><h2>연대기(연도별 활동량)</h2><span class="muted">문서 수/이미지 수</span></div>
        <div id="chart"></div>
      </div>
    `;
    drawBars("#chart", rows);
    exportBtn.onclick = ()=>exportJSON(rows, "timeline.json");
  }

  // D3 helpers
  function drawBars(sel, rows){
    const el = document.querySelector(sel);
    const w = el.clientWidth - 20, h = el.clientHeight - 20, m = {t:20,r:20,b:40,l:40};
    const svg = d3.select(sel).append('svg').attr('width', w).attr('height', h);
    const x = d3.scaleBand().domain(rows.map(d=>d.year)).range([m.l, w-m.r]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(rows, d=>Math.max(d.docs, d.images))||1]).nice().range([h-m.b, m.t]);

    svg.selectAll('.bar.docs').data(rows).enter().append('rect')
      .attr('class','bar docs')
      .attr('x', d=>x(d.year))
      .attr('y', d=>y(d.docs))
      .attr('width', x.bandwidth()/2)
      .attr('height', d=>y(0)-y(d.docs));

    svg.selectAll('.bar.img').data(rows).enter().append('rect')
      .attr('class','bar img')
      .attr('x', d=>x(d.year) + x.bandwidth()/2)
      .attr('y', d=>y(d.images))
      .attr('width', x.bandwidth()/2)
      .attr('height', d=>y(0)-y(d.images));

    const ax = d3.axisBottom(x).tickFormat(d=>String(d));
    const ay = d3.axisLeft(y).ticks(5);
    svg.append('g').attr('transform',`translate(0,${h-m.b})`).call(ax);
    svg.append('g').attr('transform',`translate(${m.l},0)`).call(ay);
  }

  function drawForceGraph(sel, data){
    const el = document.querySelector(sel);
    const w = el.clientWidth - 16, h = el.clientHeight - 16;

    const svg = d3.select(sel).append('svg').attr('width', w).attr('height', h)
      .call(d3.zoom().on("zoom", (event)=>{ g.attr("transform", event.transform); }));
    const g = svg.append('g');

    const color = d => d.type === 'tag' ? '#0b57d0' : '#999';

    const link = g.selectAll(".link")
      .data(data.links)
      .enter().append("line")
      .attr("class", "link")
      .attr("stroke", "#ddd");

    const node = g.selectAll(".node")
      .data(data.nodes)
      .enter().append("circle")
      .attr("class","node")
      .attr("r", d => d.type==='tag' ? 6 : 3)
      .attr("fill", color)
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    const sim = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(d=>d.id).distance(60))
      .force("charge", d3.forceManyBody().strength(-40))
      .force("center", d3.forceCenter(w/2, h/2));

    sim.on("tick", ()=>{
      link
        .attr("x1", d=>d.source.x)
        .attr("y1", d=>d.source.y)
        .attr("x2", d=>d.target.x)
        .attr("y2", d=>d.target.y);
      node
        .attr("cx", d=>d.x)
        .attr("cy", d=>d.y);
    });

    function dragstarted(event, d){
      if (!event.active) sim.alphaTarget(0.3).restart();
      d.fx = d.x; d.fy = d.y;
    }
    function dragged(event, d){
      d.fx = event.x; d.fy = event.y;
    }
    function dragended(event, d){
      if (!event.active) sim.alphaTarget(0);
      d.fx = null; d.fy = null;
    }
  }

  // Export JSON helper
  function exportJSON(obj, filename){
    const blob = new Blob([JSON.stringify(obj, null, 2)], {type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 500);
  }

  function rerender(){
    view.innerHTML = '';
    switch(modeSel.value){
      case "1": renderSummary(); break;
      case "2": renderTags(); break;
      case "3": renderGraph(); break;
      case "4": renderTimeline(); break;
    }
  }
  modeSel.addEventListener('change', rerender);
  rerender();
})();
