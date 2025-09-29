(function(){
  // DOM
  const tbody = document.getElementById('tbody');
  const checkAll = document.getElementById('checkAll');
  const addRowBtn = document.getElementById('addRow');
  const dupRowBtn = document.getElementById('dupRow');
  const delRowBtn = document.getElementById('delRow');
  const exportCsvBtn = document.getElementById('exportCsv');
  const saveHtmlBtn = document.getElementById('saveHtml');
  const printBtn = document.getElementById('printBtn');
  const logoBtn = document.getElementById('logoBtn');
  const logoFile = document.getElementById('logoFile');
  const brandLogo = document.getElementById('brandLogo');

  const projectName = document.getElementById('projectName');
  const owner = document.getElementById('owner');
  const modeWorking = document.getElementById('modeWorking');
  const modeCalendar = document.getElementById('modeCalendar');

  const themeDarkBtn   = document.getElementById('themeDark');
  const themeMediumBtn = document.getElementById('themeMedium');
  const themeLightBtn  = document.getElementById('themeLight');

  const holidayDate = document.getElementById('holidayDate');
  const holidayDesc = document.getElementById('holidayDesc');
  const addHolidayBtn = document.getElementById('addHoliday');
  const holidayList = document.getElementById('holidayList');

  const statCount = document.getElementById('statCount');
  const statSpan = document.getElementById('statSpan');
  const statDur = document.getElementById('statDur');

  const ganttMonths = document.getElementById('ganttMonths');
  const ganttDates = document.getElementById('ganttDates');
  const ganttCols = document.getElementById('ganttCols');
  const ganttBars = document.getElementById('ganttBars');
  const ganttRowsLabels = document.getElementById('ganttRowsLabels');
  const gridCols = document.querySelector('.grid-cols');
  const captureArea = document.getElementById('captureArea');

  // ===== STATE =====
  let state = loadState() || defaultState();

  function defaultState(){
    const today = toISO(new Date());
    return {
      meta:{ projectName:"", owner:"", mode:"working", holidays:[], logo:null, theme:"dark" },
      phases:[
        {name:"Materiais", start:today, days:5, color:"#78a6c8", notes:""},
        {name:"Produção", start:"", days:10, color:"#78a6c8", notes:""},
        {name:"Preparação", start:"", days:3, color:"#78a6c8", notes:""}
      ]
    };
  }

  function loadState(){
    try{
      const emb=document.getElementById('embedded_state');
      if(emb && emb.textContent && emb.textContent.trim().length>2){
        const obj=JSON.parse(emb.textContent);
        if(obj && obj.phases) return obj;
      }
    }catch{}
    try{ return JSON.parse(localStorage.getItem("gantt_irizar_state_v9")||"null"); }catch{ return null; }
  }
  function saveState(){ try{ localStorage.setItem("gantt_irizar_state_v9", JSON.stringify(state)); }catch{} }

  // ===== Utils de data =====
  function toISO(d){ if(typeof d==="string") return d; const tz=d.getTimezoneOffset()*60000; return new Date(d - tz).toISOString().slice(0,10); }
  function fromISO(s){ const [y,m,da]=s.split("-").map(Number); return new Date(y,m-1,da); }
  function fmtBR(s){ if(!s) return ""; return fromISO(s).toLocaleDateString("pt-BR"); }
  function addDaysISO(s,n){ const d=fromISO(s); d.setDate(d.getDate()+n); return toISO(d); }
  function prevDayISO(s){ return addDaysISO(s,-1); }
  function startOfMonthISO(s){ const d=fromISO(s); return toISO(new Date(d.getFullYear(), d.getMonth(), 1)); }
  function startOfNextMonthISO(s){ const d=fromISO(s); return toISO(new Date(d.getFullYear(), d.getMonth()+1, 1)); }
  function isWeekend(s){ const wd=fromISO(s).getDay(); return wd===0 || wd===6; }
  function isHoliday(s){ return state.meta.holidays.some(h=>h.date===s); }
  function nextBusinessDay(s){ let cur=s; while(isWeekend(cur)||isHoliday(cur)) cur=addDaysISO(cur,1); return cur; }
  function monthNamePT(s){ const d=fromISO(s); return d.toLocaleDateString("pt-BR",{month:"long", year:"numeric"}); }
  function diffDaysInclusive(a,b){ const ms=Math.abs(fromISO(b)-fromISO(a)); return Math.floor(ms/86400000)+1; }

  // ===== Cálculos =====
  function calcEnd(startISO, days, mode){
    if(!startISO || !Number.isFinite(days) || days<0) return "";
    if(days===0) return startISO;
    if(mode==="calendar") return addDaysISO(startISO, days-1);
    let cur=(isWeekend(startISO)||isHoliday(startISO))?nextBusinessDay(startISO):startISO, count=1;
    while(count<days){ cur=addDaysISO(cur,1); if(!isWeekend(cur)&&!isHoliday(cur)) count++; }
    return cur;
  }

  function rechainFrom(i){
    for(let k=i;k<state.phases.length;k++){
      const p=state.phases[k];
      if(!p.start){ p.end=""; continue; }
      p.end=calcEnd(p.start, Number(p.days||0), state.meta.mode);
      const nx=state.phases[k+1];
      if(nx && !nx._manualStart){
        nx.start=(state.meta.mode==="working")?((isWeekend(p.end)||isHoliday(p.end))?nextBusinessDay(p.end):p.end):p.end;
      }
    }
  }

  function getSpan(){
    const s=state.phases.map(p=>p.start).filter(Boolean);
    const e=state.phases.map(p=>p.end).filter(Boolean);
    if(!s.length || !e.length) return ["",""];
    return [s.slice().sort()[0], e.slice().sort().slice(-1)[0]];
  }

  function computeCellWidth(daysTotal,forPrint=false){
    const available = Math.max(100, gridCols ? gridCols.clientWidth : 1000);
    const minCell = forPrint ? 5 : 8;
    const maxCell = forPrint ? 18 : 32;
    const w = Math.floor(available / daysTotal);
    return Math.max(minCell, Math.min(maxCell, w));
  }

  // ===== Tema =====
  function applyTheme(){
    const t = state.meta.theme || "dark";
    document.documentElement.setAttribute('data-theme', t);
    themeDarkBtn.classList.toggle('active', t==='dark');
    themeMediumBtn.classList.toggle('active', t==='medium');
    themeLightBtn.classList.toggle('active', t==='light');
  }

  // ===== Render =====
  function render(){
    applyTheme();

    projectName.value = state.meta.projectName || "";
    owner.value = state.meta.owner || "";
    if(state.meta.logo){ brandLogo.src = state.meta.logo; }

    modeWorking.classList.toggle("active", state.meta.mode==="working");
    modeCalendar.classList.toggle("active", state.meta.mode==="calendar");

    // feriados
    holidayList.innerHTML = state.meta.holidays.length?"":"Nenhum feriado cadastrado.";
    if(state.meta.holidays.length){
      const ul=document.createElement("ul"); ul.style.listStyle="none"; ul.style.padding="0";
      state.meta.holidays.slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach((h,idx)=>{
        const li=document.createElement("li");
        li.style.display="flex"; li.style.justifyContent="space-between"; li.style.gap="8px"; li.style.padding="4px 0";
        li.innerHTML=`<span>${fmtBR(h.date)} — ${h.desc||""}</span>`;
        const rm=document.createElement("button"); rm.textContent="Remover";
        rm.addEventListener("click",()=>{ state.meta.holidays.splice(idx,1); recalcAll(); });
        li.appendChild(rm); ul.appendChild(li);
      });
      holidayList.appendChild(ul);
    }

    // tabela
    tbody.innerHTML="";
    state.phases.forEach((p,i)=>{
      const tr=document.createElement("tr");

      const tdSel=document.createElement("td"); const cb=document.createElement("input");
      cb.type="checkbox"; cb.className="row-select"; tdSel.appendChild(cb); tr.appendChild(tdSel);

      const tdName=document.createElement("td"); const name=document.createElement("input");
      name.type="text"; name.placeholder="Nome da fase"; name.value=p.name||"";
      name.addEventListener("input",()=>{ p.name=name.value; saveState(); renderGantt(); });
      tdName.appendChild(name); tr.appendChild(tdName);

      const tdStart=document.createElement("td"); const start=document.createElement("input");
      start.type="date"; start.value=p.start||""; start.title="Clique para abrir o calendário";
      start.addEventListener("input",()=>{
        const prev=p.start; p.start=start.value; p._manualStart=(p.start && p.start!==prev);
        rechainFrom(i); saveState(); render(); renderGantt();
      });
      tdStart.appendChild(start); tr.appendChild(tdStart);

      const tdDays=document.createElement("td"); const days=document.createElement("input");
      days.type="number"; days.min="0"; days.value=Number(p.days||0);
      days.addEventListener("input",()=>{
        p.days=Math.max(0,parseInt(days.value||"0",10)); rechainFrom(i); saveState(); render(); renderGantt();
      });
      tdDays.appendChild(days); tr.appendChild(tdDays);

      const tdEnd=document.createElement("td"); const end=document.createElement("input");
      end.type="date"; end.readOnly=true; end.value=p.end||""; end.title="Calculado automaticamente";
      tdEnd.appendChild(end); tr.appendChild(tdEnd);

      const tdColor=document.createElement("td"); const color=document.createElement("input");
      color.type="color"; color.value=p.color||"#78a6c8";
      color.addEventListener("input",()=>{ p.color=color.value; saveState(); renderGantt(); });
      tdColor.appendChild(color); tr.appendChild(tdColor);

      const tdNotes=document.createElement("td"); const notes=document.createElement("input");
      notes.type="text"; notes.placeholder="Observações"; notes.value=p.notes||"";
      notes.addEventListener("input",()=>{ p.notes=notes.value; saveState(); });
      tdNotes.appendChild(notes); tr.appendChild(tdNotes);

      tbody.appendChild(tr);
    });

    statCount.textContent=`Fases: ${state.phases.length}`;
    const [minISO,maxISO]=getSpan();
    if(minISO && maxISO){
      statSpan.textContent=`Período: ${fmtBR(minISO)} — ${fmtBR(maxISO)}`;
      statDur.textContent=`Duração total (dias corridos): ${diffDaysInclusive(minISO,maxISO)}`;
    }else{
      statSpan.textContent="Período: -"; statDur.textContent="Duração total (dias corridos): -";
    }

    checkAll.checked=false;
  }

  function renderGantt(forPrint=false){
    ganttMonths.innerHTML=""; ganttDates.innerHTML=""; ganttCols.innerHTML=""; ganttBars.innerHTML=""; ganttRowsLabels.innerHTML="";

    // labels
    state.phases.forEach(p=>{ const lbl=document.createElement("div"); lbl.className="row-label"; lbl.textContent=p.name||"(sem nome)"; ganttRowsLabels.appendChild(lbl); });

    const [minISO,maxISO]=getSpan();
    if(!minISO || !maxISO) return;

    const daysTotal=diffDaysInclusive(minISO,maxISO);
    const cell=computeCellWidth(daysTotal,forPrint);
    document.documentElement.style.setProperty('--cell', cell+'px');

    // MESES
    let curMonthStart = startOfMonthISO(minISO);
    while (curMonthStart <= maxISO){
      const nextStart = startOfNextMonthISO(curMonthStart);
      const segStart = (curMonthStart < minISO) ? minISO : curMonthStart;
      const segEnd = (nextStart > maxISO) ? maxISO : prevDayISO(nextStart);
      const segDays = diffDaysInclusive(segStart, segEnd);

      const mb=document.createElement("div");
      mb.className="mblock"; mb.style.width=(segDays*cell - 1)+"px";
      const name=document.createElement("div"); name.className="mname"; name.textContent=monthNamePT(segStart);
      mb.appendChild(name); ganttMonths.appendChild(mb);

      curMonthStart = nextStart;
    }

    // DIAS
    let step=1; if(cell<16) step=2; if(cell<10) step=5;
    for(let i=0;i<daysTotal;i++){
      const d=fromISO(addDaysISO(minISO,i));
      const c=document.createElement("div"); c.className="cell"; c.textContent=(i%step===0)? d.getDate(): "";
      ganttDates.appendChild(c);
    }

    // COLUNAS
    for(let i=0;i<daysTotal;i++){
      const dISO=addDaysISO(minISO,i);
      const col=document.createElement("div"); col.className="col"; col.style.left=(i*cell)+"px";
      if(isWeekend(dISO)) col.classList.add("weekend");
      if(isHoliday(dISO)) col.classList.add("holiday");
      ganttCols.appendChild(col);
    }

    // BARRAS
    state.phases.forEach((p,idx)=>{
      if(!p.start||!p.end) return;
      const offset=diffDaysInclusive(minISO,p.start)-1;
      const widthDays=diffDaysInclusive(p.start,p.end);
      const bar=document.createElement("div");
      bar.className="bar";
      bar.style.left=(offset*cell)+"px";
      bar.style.top=(idx*28+32)+"px";
      bar.style.width=Math.max(6,(widthDays*cell-4))+"px";
      bar.style.background=p.color||"var(--bar)";
      bar.title=`${p.name||""} — ${fmtBR(p.start)} a ${fmtBR(p.end)} (${widthDays} dia(s))`;
      bar.textContent=p.name||"";
      ganttBars.appendChild(bar);

      if(Number(p.days||0)===0){
        const m=document.createElement("div"); const size=12;
        m.style.position="absolute"; m.style.width=size+"px"; m.style.height=size+"px";
        m.style.left=(offset*cell - size/2)+"px"; m.style.top=(idx*28+32+4)+"px";
        m.style.background=p.color||"var(--bar)"; m.style.transform="rotate(45deg)"; m.style.border="1px solid #4e6b85";
        ganttBars.appendChild(m);
      }
    });
  }

  // ===== Exportações / salvar =====
  function toCSV(){
    const headers=["Fase","DataInicio","DiasNecessarios","DataFinal","Cor","Observacoes"];
    const rows=state.phases.map(p=>[p.name||"",p.start||"",Number(p.days||0),p.end||"",p.color||"", (p.notes||"").replace(/\n/g," ")]);
    return [headers.join(";")].concat(rows.map(r=>r.join(";"))).join("\n");
  }
  function saveAsHTML(){
    try{
      const cloned=document.documentElement.cloneNode(true);
      let tag=cloned.querySelector('#embedded_state');
      if(!tag){ tag=cloned.ownerDocument.createElement('script'); tag.id='embedded_state'; tag.type='application/json'; cloned.querySelector('body').insertBefore(tag, cloned.querySelector('body').firstChild); }
      tag.textContent=JSON.stringify(state);
      const html="<!DOCTYPE html>\n"+cloned.outerHTML;
      const blob=new Blob([html],{type:"text/html;charset=utf-8"});
      const safe=(state.meta.projectName||"gantt_pos_venda_irizar_v9").replace(/[^a-z0-9_-]+/gi,"_");
      downloadBlob(blob, makeFilename(safe,"html"));
    }catch(e){ alert("Falha ao salvar como HTML: "+e.message); }
  }

  // ===== Eventos =====
  modeWorking.addEventListener("click",()=>{ state.meta.mode="working"; recalcAll(); });
  modeCalendar.addEventListener("click",()=>{ state.meta.mode="calendar"; recalcAll(); });

  themeDarkBtn.addEventListener("click",()=>{ state.meta.theme="dark"; saveState(); applyTheme(); });
  themeMediumBtn.addEventListener("click",()=>{ state.meta.theme="medium"; saveState(); applyTheme(); });
  themeLightBtn.addEventListener("click",()=>{ state.meta.theme="light"; saveState(); applyTheme(); });

  projectName.addEventListener("input",()=>{ state.meta.projectName=projectName.value; saveState(); });
  owner.addEventListener("input",()=>{ state.meta.owner=owner.value; saveState(); });

  addHolidayBtn.addEventListener("click",()=>{ if(!holidayDate.value) return; state.meta.holidays.push({date:holidayDate.value,desc:holidayDesc.value||""}); holidayDate.value=""; holidayDesc.value=""; recalcAll(); });

  addRowBtn.addEventListener("click",()=>{ state.phases.push({name:"",start:"",days:1,color:"#78a6c8",notes:""}); saveState(); render(); renderGantt(); });
  dupRowBtn.addEventListener("click",()=>{ const s=getSelectedIndexes(); if(s.length!==1) return; const i=s[0]; const p=state.phases[i]; const clone=JSON.parse(JSON.stringify(p)); clone._manualStart=false; state.phases.splice(i+1,0,clone); rechainFrom(i); saveState(); render(); renderGantt(); });
  delRowBtn.addEventListener("click",()=>{ const s=getSelectedIndexes().sort((a,b)=>b-a); if(!s.length) return; s.forEach(i=>state.phases.splice(i,1)); rechainFrom(Math.max(0,Math.min(...s)-1)); saveState(); render(); renderGantt(); });

  checkAll.addEventListener("change",()=>{ tbody.querySelectorAll('.row-select').forEach(cb=>cb.checked=checkAll.checked); });

  exportCsvBtn.addEventListener("click",()=>{ const csv=toCSV(); const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}); downloadBlob(blob, makeFilename("gantt_irizar_v9","csv")); });
  saveHtmlBtn.addEventListener("click", saveAsHTML);
  printBtn.addEventListener("click",()=>window.print());

  logoBtn.addEventListener("click",()=>logoFile.click());
  logoFile.addEventListener("change",()=>{
    const f = logoFile.files[0]; if(!f) return;
    const rd = new FileReader();
    rd.onload = e => { const data=e.target.result; brandLogo.src=data; state.meta.logo=data; saveState(); };
    rd.readAsDataURL(f);
  });

  // janela / print
  window.addEventListener("resize",()=>renderGantt());
  let lastCell=null;
  window.addEventListener("beforeprint",()=>{ lastCell=getComputedStyle(document.documentElement).getPropertyValue('--cell'); renderGantt(true); });
  window.addEventListener("afterprint",()=>{ if(lastCell){ document.documentElement.style.setProperty('--cell', lastCell.trim()); } renderGantt(false); });

  document.addEventListener("keydown",(e)=>{
    if(e.key==="Enter" && (e.metaKey||e.ctrlKey)){ e.preventDefault(); addRowBtn.click(); }
    if(e.key==="Enter" && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey){
      if(document.activeElement && ["INPUT","SELECT","TEXTAREA"].includes(document.activeElement.tagName)) return;
      e.preventDefault(); addRowBtn.click();
    }
    if(e.key==="Delete"){ delRowBtn.click(); }
  });

  function getSelectedIndexes(){ const list=[]; tbody.querySelectorAll("tr").forEach((tr,i)=>{ const cb=tr.querySelector(".row-select"); if(cb && cb.checked) list.push(i); }); return list; }

  // helpers
  function downloadBlob(blob,filename){ const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(url); document.body.removeChild(a); },0); }
  function makeFilename(base,ext){ const ts=new Date().toISOString().slice(0,19).replace(/[:T]/g,"-"); return `${base}-${ts}.${ext}`; }

  function recalcAll(){
    for(let i=0;i<state.phases.length;i++){
      const p=state.phases[i]; if(!p.start) continue;
      p.end=calcEnd(p.start,Number(p.days||0),state.meta.mode);
      const nx=state.phases[i+1];
      if(nx && !nx._manualStart){
        nx.start=(state.meta.mode==="working")?((isWeekend(p.end)||isHoliday(p.end))?nextBusinessDay(p.end):p.end):p.end;
      }
    }
    saveState(); render(); renderGantt();
  }
  function ensureChain(){
    for(let i=0;i<state.phases.length;i++){
      const p=state.phases[i];
      if(!p.start){
        const prev=state.phases[i-1];
        if(prev && prev.end){
          p.start = state.meta.mode==="working" ? ((isWeekend(prev.end)||isHoliday(prev.end))?nextBusinessDay(prev.end):prev.end) : prev.end;
        }
      }
      p.end = calcEnd(p.start, Number(p.days||0), state.meta.mode);
    }
  }

  // Inicialização
  applyTheme();
  ensureChain(); saveState(); render(); renderGantt();
})();
