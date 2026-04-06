/* ═══════════════════════════════════════════════════════════════
   EWGH — app.js
   Key changes:
   - "Ready" progress = just a status, does NOT mark as completed
   - "Mark as Done" is a separate explicit button
   - Assessments auto-complete when past due date (as before)
   - All Venr buttons link to venr.html
   - Calendar is zoomable (+ / − buttons)
   - Detail modal: no Edit at top, Delete moved to bottom
   ═══════════════════════════════════════════════════════════════ */
'use strict';

// ── STATE ────────────────────────────────────────────────────────
let state = {
  subjects: [],
  assessments: [],
  homework:  [],
  wsTasks:   {},
  wsNotes:   {},
  prepData:  {},
  settings: {
    leadEasy:     3,
    leadModerate: 10,
    leadHard:     21,
    criticalDays: 7,
    warningDays:  21,
  },
  theme: 'dark'
};

// ── DEMO DATA ─────────────────────────────────────────────────────
const DEMO_SUBJECTS = [
  { id:'sub_physics',   name:'Physics',   color:'#5b8dee', priority:1.5 },
  { id:'sub_chemistry', name:'Chemistry', color:'#e85555', priority:1   },
  { id:'sub_italian',   name:'Italian',   color:'#3ecf8e', priority:1   },
  { id:'sub_maths',     name:'Maths',     color:'#e8a838', priority:1.5 },
  { id:'sub_english',   name:'English',   color:'#a78bfa', priority:1   },
];

function dd(n){ const d=new Date(); d.setDate(d.getDate()+n); return localDateStr(d); }

function buildDemoAssessments(){
  return [
    { id:'a1', subjectId:'sub_physics',   title:'Forces and Motion Test',            type:'test',       date:dd(6),  weighting:20, topic:"Newton's Laws, kinematics, projectile motion", syllabus:"Newton's First Law — inertia\nNewton's Second Law — F=ma\nKinematics equations (suvat)\nProjectile motion\nFriction — static vs kinetic\nFree body diagrams", difficulty:'moderate', progress:'in_progress', completed:false, mark:'', outOf:'', notes:'Focus on multi-step kinematics. Past papers 2022.', createdAt:new Date().toISOString() },
    { id:'a2', subjectId:'sub_italian',   title:'Speaking Assessment — My Community', type:'oral',       date:dd(10), weighting:30, topic:'Oral description of local community, places, culture', syllabus:"Vocabulary: places in the community\nDescribing your local area — present tense\nOpinions and preferences\nComparing town vs city\nAsking for directions\nPronunciation of -gli and -gn clusters", difficulty:'hard',     progress:'in_progress', completed:false, mark:'', outOf:'', notes:'Record yourself and listen back.', createdAt:new Date().toISOString() },
    { id:'a3', subjectId:'sub_chemistry', title:'Chemical Equilibrium Test',          type:'test',       date:dd(14), weighting:25, topic:"Le Chatelier's principle, equilibrium constants, acids and bases", syllabus:"Dynamic equilibrium\nLe Chatelier's Principle\nEquilibrium constant Kc\nAcid-base theory\nStrong vs weak acids\npH calculations", difficulty:'hard',     progress:'not_started', completed:false, mark:'', outOf:'', notes:'Start equilibrium this week.', createdAt:new Date().toISOString() },
    { id:'a4', subjectId:'sub_maths',     title:'Calculus Assignment',                type:'assignment', date:dd(21), weighting:15, topic:'Differentiation and integration — application problems', syllabus:"Product rule and quotient rule\nChain rule\nDerivatives of trig functions\nDefinite and indefinite integrals\nArea under curve\nOptimisation problems", difficulty:'moderate', progress:'not_started', completed:false, mark:'', outOf:'', notes:'Show full working.', createdAt:new Date().toISOString() },
    { id:'a5', subjectId:'sub_english',   title:'Comparative Essay — Identity',       type:'assignment', date:dd(38), weighting:30, topic:'Comparing two texts on identity and belonging', syllabus:"The Kite Runner — Hosseini\nRupi Kaur poems\nStructural comparison\nIntegrating quotes\nTEEL structure", difficulty:'hard',     progress:'not_started', completed:false, mark:'', outOf:'', notes:'Plan structure first.', createdAt:new Date().toISOString() },
    { id:'a6', subjectId:'sub_physics',   title:'Electricity Practical Investigation', type:'practical', date:dd(48), weighting:20, topic:'Series and parallel circuits', syllabus:"Ohm's Law — V=IR\nSeries circuits\nParallel circuits\nInvestigation report\nError analysis", difficulty:'moderate', progress:'not_started', completed:false, mark:'', outOf:'', notes:'Pre-read procedure.', createdAt:new Date().toISOString() },
    { id:'a7', subjectId:'sub_chemistry', title:'End of Semester Chemistry Exam',     type:'exam',       date:dd(60), weighting:40, topic:'Comprehensive — all Semester 1 and 2 topics', syllabus:"Atomic structure\nStoichiometry\nGas laws\nThermochemistry\nReaction rates\nEquilibrium\nAcids and bases\nOrganic chemistry\nElectrochemistry", difficulty:'hard',     progress:'not_started', completed:false, mark:'', outOf:'', notes:'Major exam — needs 4-week plan.', createdAt:new Date().toISOString() },
  ];
}

function buildDemoHomework(){
  return [
    { id:'hw1', subjectId:'sub_physics',   task:"Finish Newton's Law worksheet Q1–Q15",    date:dd(1), priority:'urgent', done:false },
    { id:'hw2', subjectId:'sub_physics',   task:'Watch projectile motion derivation video', date:dd(3), priority:'normal', done:false },
    { id:'hw3', subjectId:'sub_maths',     task:'Complete textbook Ex 7.3 — chain rule',   date:dd(2), priority:'high',   done:false },
    { id:'hw4', subjectId:'sub_maths',     task:'Check solutions for Ex 7.1 and fix errors',date:dd(4),priority:'normal', done:true  },
    { id:'hw5', subjectId:'sub_chemistry', task:"Read chapter on Le Chatelier's Principle", date:dd(1), priority:'high',   done:false },
    { id:'hw6', subjectId:'sub_english',   task:'Annotate pages 45–70 of The Kite Runner', date:dd(3), priority:'normal', done:false },
    { id:'hw7', subjectId:'sub_italian',   task:'Memorise vocabulary list — Unit 4 places', date:dd(2), priority:'high',   done:false },
  ];
}

// ── STORAGE ───────────────────────────────────────────────────────
const STORAGE_KEY = 'ewgh_data_v3';

function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const saved = JSON.parse(raw);
      state = { ...state, ...saved };
      if(saved.settings) state.settings = { ...state.settings, ...saved.settings };
      state.homework = state.homework || [];
      state.wsTasks  = state.wsTasks  || {};
      state.wsNotes  = state.wsNotes  || {};
      state.prepData = state.prepData || {};
    } else {
      state.subjects    = DEMO_SUBJECTS;
      state.assessments = buildDemoAssessments();
      state.homework    = buildDemoHomework();
      state.wsTasks     = {
        sub_physics: [{ id:'wt1', text:'Re-read section on friction', done:false }],
        sub_italian: [{ id:'wt2', text:'Record 2-minute speaking practice', done:false }],
      };
      state.wsNotes = {
        sub_physics: 'Often lose marks on free body diagram direction. Watch sign conventions in suvat.\n\nStrong on energy conservation — keep practising.',
        sub_italian: 'Pronunciation of "gn" clusters needs work. Vocab for community places mostly solid.',
      };
      saveState();
    }
    normaliseAssessments();
    applyTheme(state.theme || 'dark');
  } catch(e){
    console.warn('Load failed, using demo data.', e);
    state.subjects    = DEMO_SUBJECTS;
    state.assessments = buildDemoAssessments();
    state.homework    = buildDemoHomework();
    normaliseAssessments();
    applyTheme('dark');
  }
}

function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function normaliseAssessments(){
  // Auto-complete only if past due date AND not already explicitly marked by user
  state.assessments = (state.assessments||[]).map(a => {
    const past = daysUntil(a.date) < 0;
    return {
      mark:'', outOf:'', ...a,
      // Only auto-complete if due date has passed and it hasn't been manually set
      completed: a.completed || past,
      progress:  (a.completed || past) && a.progress !== 'ready' ? a.progress : a.progress || 'not_started',
    };
  });
}

// ── THEME ─────────────────────────────────────────────────────────
function applyTheme(theme){
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  const isLight = theme === 'light';
  const icon    = document.getElementById('theme-icon');
  const label   = document.getElementById('theme-label');
  const settBtn = document.getElementById('theme-settings-btn');
  if(icon)   icon.textContent   = isLight ? '🌙' : '☀';
  if(label)  label.textContent  = isLight ? 'Dark' : 'Light';
  if(settBtn) settBtn.textContent = isLight ? 'Switch to Dark' : 'Switch to Light';
}
function toggleTheme(){ applyTheme(state.theme==='dark'?'light':'dark'); saveState(); }

// ── DATE UTILS ────────────────────────────────────────────────────
const TODAY = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
function localDateStr(d){
  if(!(d instanceof Date) || isNaN(d)) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function parseDate(str){
  if(!str) return null;
  const d = new Date(str+'T00:00:00');
  return isNaN(d) ? null : d;
}
function daysUntil(str){
  const d = parseDate(str);
  if(!d) return Infinity;
  return Math.round((d - TODAY) / 864e5);
}
function fmtDate(str){
  const d = parseDate(str);
  return d ? d.toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}) : '—';
}
function fmtShort(str){
  const d = parseDate(str);
  return d ? d.toLocaleDateString('en-AU',{day:'numeric',month:'short'}) : '—';
}
function daysLabel(n){
  if(n < 0)  return `${Math.abs(n)}d overdue`;
  if(n === 0) return 'Today';
  if(n === 1) return 'Tomorrow';
  return `${n}d away`;
}
function daysColour(n){
  if(n <= 0)                           return 'red';
  if(n <= state.settings.criticalDays) return 'red';
  if(n <= state.settings.warningDays)  return 'amber';
  return 'green';
}
function chipClass(n){ return 'chip-'+daysColour(n); }
function badgeClass(n){
  if(n <= 0 || n <= state.settings.criticalDays) return 'badge-red';
  if(n <= state.settings.warningDays)             return 'badge-amber';
  return 'badge-muted';
}

// ── SUBJECT HELPERS ───────────────────────────────────────────────
function getSubject(id){ return state.subjects.find(s=>s.id===id)||{name:'Unknown',color:'#636b90',priority:1}; }

// ── ASSESSMENT LOGIC ──────────────────────────────────────────────
function revStartDays(a){
  return {easy:state.settings.leadEasy, moderate:state.settings.leadModerate, hard:state.settings.leadHard}[a.difficulty] || state.settings.leadModerate;
}
function shouldHaveStarted(a){ return daysUntil(a.date) <= revStartDays(a); }
function isCompleted(a){ return !!(a && a.completed); }

function urgencyScore(a){
  if(isCompleted(a)) return 0;
  const days = daysUntil(a.date);
  if(days < 0) return 0;
  const lead = revStartDays(a);
  const dM   = {easy:.7, moderate:1, hard:1.4}[a.difficulty]||1;
  const wM   = (a.weighting||15)/15;
  const pM   = {not_started:1, in_progress:.7, revised_once:.5, mostly_prepared:.3, ready:.1}[a.progress]||1;
  const subj = getSubject(a.subjectId);
  if(days===0) return 5000*dM;
  return (lead/Math.max(days,.1))*100*dM*wM*pM*(subj.priority||1);
}

function getProgressPercent(p){
  return {not_started:0, in_progress:25, revised_once:50, mostly_prepared:75, ready:100}[p]||0;
}
function getProgressLabel(p){
  return {not_started:'Not Started', in_progress:'In Progress', revised_once:'Revised Once', mostly_prepared:'Mostly Prepared', ready:'Ready ✓'}[p]||'Not Started';
}
function cap(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : ''; }

// ── DASHBOARD ─────────────────────────────────────────────────────
function buildDashboard(){
  const DAYS  =['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('hdr-day').textContent  = DAYS[TODAY.getDay()];
  document.getElementById('hdr-date').textContent = `${TODAY.getDate()} ${MONTHS[TODAY.getMonth()]} ${TODAY.getFullYear()}`;

  const active = state.assessments
    .filter(a => daysUntil(a.date) > -30 && !isCompleted(a))
    .sort((a,b) => urgencyScore(b)-urgencyScore(a));

  const doNow=[], soon=[], later=[];
  active.forEach(a => {
    const d = daysUntil(a.date);
    if(d<=state.settings.criticalDays)                              doNow.push(a);
    else if(d<=state.settings.warningDays || shouldHaveStarted(a)) soon.push(a);
    else                                                            later.push(a);
  });

  renderSection('do-now-list',      doNow, 'urgent');
  renderSection('coming-soon-list', soon,  'warning');
  renderSection('later-list',       later, 'neutral');

  buildRadar(active);
  buildFocus();

  const overdueHw = (state.homework||[]).filter(hw=>!hw.done&&hw.date&&daysUntil(hw.date)<0);
  const banner = document.getElementById('alert-banner');
  if(overdueHw.length){
    banner.classList.remove('hidden');
    banner.textContent = `${overdueHw.length} homework task${overdueHw.length>1?'s are':' is'} overdue`;
  } else {
    banner.classList.add('hidden');
  }

  // Amber almost-due banner — homework due within 3 days, not yet done
  const almostDue = (state.homework||[]).filter(hw=>!hw.done&&hw.date&&daysUntil(hw.date)>0&&daysUntil(hw.date)<=ALMOST_DUE_DAYS);
  const warnBanner = document.getElementById('almost-due-banner');
  if(almostDue.length){
    warnBanner.classList.remove('hidden');
    const names = almostDue.map(hw=>`${hw.task} (${daysLabel(daysUntil(hw.date))})`).join(' · ');
    warnBanner.textContent = `${almostDue.length} homework task${almostDue.length>1?'s are':' is'} almost due — ${names}`;
  } else {
    warnBanner.classList.add('hidden');
  }
}

// Almost-due threshold: 3 days — amber warning, separate from the red criticalDays zone
const ALMOST_DUE_DAYS = 3;

function renderSection(cid, assessments, variant){
  const el = document.getElementById(cid);
  el.innerHTML = '';
  if(!assessments.length){ el.innerHTML=`<div class="empty-box">Nothing here right now ✓</div>`; return; }
  assessments.forEach(a => {
    const days = daysUntil(a.date);
    const subj = getSubject(a.subjectId);
    const pct  = getProgressPercent(a.progress);
    const syllabusLines = (a.syllabus||'').split('\n').filter(Boolean);
    const tips = syllabusLines.slice(0, 2);
    const v    = days<=state.settings.criticalDays ? 'urgent' : days<=state.settings.warningDays ? 'warning' : variant;

    // Format syllabus tips as clean bullet list, not a run-on string
    let actionHtml = '';
    if(tips.length){
      const bulletItems = tips.map(t => `<span class="tc-action-bullet">◇ ${t}</span>`).join('');
      actionHtml = `<div class="tc-action-wrap"><span class="tc-action-label">→ Revise today</span><div class="tc-action-bullets">${bulletItems}</div></div>`;
    } else {
      actionHtml = `<div class="tc-action">→ Final review</div>`;
    }

    const card = document.createElement('div');
    card.className = `task-card v-${v}`;
    card.style.setProperty('--c-accent', subj.color);
    card.innerHTML = `
      <div class="tc-head">
        <div>
          <div class="tc-title">${a.title}</div>
          <div class="tc-sub">${subj.name} · ${cap(a.type)}</div>
        </div>
        <div class="tc-meta">
          <span class="badge ${badgeClass(days)}">${cap(a.difficulty)}</span>
          <span class="days-chip ${chipClass(days)}">${daysLabel(days)}</span>
        </div>
      </div>
      ${actionHtml}
      <div class="tc-foot">
        <div class="prog-track"><div class="prog-fill" style="width:${pct}%;background:${subj.color}"></div></div>
      </div>`;
    card.addEventListener('click', ()=>openDetailModal(a.id));
    el.appendChild(card);
  });
}

function buildRadar(assessments){
  const c = document.getElementById('urgency-radar');
  c.innerHTML = '';
  const sorted = [...assessments].sort((a,b)=>daysUntil(a.date)-daysUntil(b.date)).slice(0,9);
  if(!sorted.length){ c.innerHTML=`<div class="empty-box">No upcoming</div>`; return; }
  sorted.forEach(a => {
    const days = daysUntil(a.date);
    const row  = document.createElement('div');
    row.className = 'radar-row';
    row.innerHTML = `<span class="radar-name">${a.title}</span><span class="radar-days ${chipClass(days)}">${daysLabel(days)}</span>`;
    row.addEventListener('click', ()=>openDetailModal(a.id));
    c.appendChild(row);
  });
}

function buildFocus(){
  const c = document.getElementById('subject-status-list');
  c.innerHTML = '';
  const candidates = state.assessments
    .filter(a=>!isCompleted(a)&&shouldHaveStarted(a))
    .sort((a,b)=>urgencyScore(b)-urgencyScore(a));
  const seen = new Set();
  const list = [];
  candidates.forEach(a=>{
    const s = getSubject(a.subjectId);
    if(!seen.has(s.id)){ seen.add(s.id); list.push({ ...s, reason: daysUntil(a.date)<=state.settings.criticalDays?'Due soon':'Start now' }); }
  });
  if(!list.length){ c.innerHTML=`<div style="font-size:12px;color:var(--green)">✓ Nothing urgent right now</div>`; return; }
  list.forEach(s=>{
    const row = document.createElement('div');
    row.className = 'focus-row';
    row.innerHTML = `
      <div class="focus-head">
        <span class="focus-subj" style="--sc:${s.color}">${s.name}</span>
        <span class="badge badge-amber" style="font-size:9px">${s.reason}</span>
      </div>`;
    row.addEventListener('click', ()=>{ switchView('workspace'); setTimeout(()=>activateWsTab(s.id),60); });
    c.appendChild(row);
  });
}

// ── ASSESSMENTS VIEW ──────────────────────────────────────────────
function getAssessmentPercent(a){
  if(!a) return null;
  const mark = Number(a.mark);
  const outOf = Number(a.outOf);
  if(Number.isFinite(mark) && mark >= 0 && Number.isFinite(outOf) && outOf > 0){
    return Math.round((mark / outOf) * 100);
  }
  if(Number.isFinite(mark) && mark >= 0 && (!Number.isFinite(outOf) || !outOf)){
    return Math.round(mark);
  }
  return null;
}
function assessmentScoreClass(percent){
  if(percent===null || percent===undefined) return '';
  if(percent >= 80) return 'score-green';
  if(percent >= 60) return 'score-amber';
  return 'score-red';
}
function createAssessmentSection(title, subtext){
  const sec = document.createElement('div');
  sec.className = 'a-section';
  sec.innerHTML = `<div><div class="a-section-title">${title}</div><div class="a-section-sub">${subtext}</div></div>`;
  return sec;
}
function buildAssessmentCard(a){
  const subj = getSubject(a.subjectId);
  const days = daysUntil(a.date);
  const done = isCompleted(a);
  const percent = getAssessmentPercent(a);
  const scoreClass = assessmentScoreClass(percent);
  const pips = ['easy','moderate','hard'].map((d,i)=>
    `<span class="diff-pip ${i<=(['easy','moderate','hard'].indexOf(a.difficulty))?'on':''}"></span>`
  ).join('');
  const card = document.createElement('div');
  card.className = 'a-card' + (done ? ' is-completed' : '');
  card.style.setProperty('--subject-color', subj.color);
  card.style.setProperty('--c-accent', subj.color);
  const resultBlock = done ? `
    <div class="a-score-wrap">
      <div class="a-score-big ${scoreClass}">${percent!==null?`${percent}%`:'—'}</div>
      <div class="a-score-note">${a.mark!==''&&a.outOf!==''?`${a.mark} / ${a.outOf}`:(a.mark!==''?`Raw mark: ${a.mark}`:'No mark saved')}</div>
    </div>` : '';
  card.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:7px;margin-bottom:${done?6:8}px">
      <div><div class="a-subject">${subj.name}</div><div class="a-title">${a.title}</div></div>
      <span class="a-type">${a.type}</span>
    </div>
    ${resultBlock}
    <div class="a-meta">
      <span class="a-date">${fmtDate(a.date)}</span>
      <span class="a-days ${done?'chip-green':chipClass(days)}">${done?'🏁 Done':daysLabel(days)}</span>
      ${a.weighting?`<span class="badge badge-muted">${a.weighting}%</span>`:''}
    </div>
    ${a.topic?`<div class="a-topic">${a.topic}</div>`:''}
    <div class="a-foot">
      <span class="prog-pill ${done?'p-done':'p-'+a.progress}">${done?'Done ✓':getProgressLabel(a.progress)}</span>
      <div class="diff-row">${pips}</div>
    </div>`;
  card.addEventListener('click', ()=>openDetailModal(a.id));
  return card;
}
function buildAssessmentsView(){
  const grid    = document.getElementById('assessments-grid');
  const subjSel = document.getElementById('filter-subject');
  const typeSel = document.getElementById('filter-type');
  const curSubj = subjSel.value;

  subjSel.innerHTML = '<option value="">All Subjects</option>';
  state.subjects.forEach(s=>{
    const o = document.createElement('option');
    o.value = s.id;
    o.textContent = s.name;
    if(s.id === curSubj) o.selected = true;
    subjSel.appendChild(o);
  });

  const filtered = state.assessments.filter(a =>
    (!subjSel.value || a.subjectId === subjSel.value) &&
    (!typeSel.value || a.type === typeSel.value)
  ).sort((a,b) => parseDate(a.date) - parseDate(b.date));

  const incomplete = filtered.filter(a => !isCompleted(a));
  const completed = filtered.filter(a => isCompleted(a));

  grid.innerHTML = '';

  if(!filtered.length){
    grid.innerHTML = `<div class="empty-box">No assessments yet.</div>`;
    return;
  }

  if(incomplete.length){
    const sec = document.createElement('div');
    sec.className = 'a-section a-section-plain';
    sec.innerHTML = `<div><div class="a-section-title">Incomplete assessments</div></div>`;
    grid.appendChild(sec);
    incomplete.forEach(a => grid.appendChild(buildAssessmentCard(a)));
  }

  if(completed.length){
    const sec = document.createElement('div');
    sec.className = 'a-section a-section-plain';
    sec.innerHTML = `<div><div class="a-section-title">Completed assessments</div></div>`;
    grid.appendChild(sec);
    completed.forEach(a => grid.appendChild(buildAssessmentCard(a)));
  }
}

// ── SUBJECTS VIEW ─────────────────────────────────────────────────
function buildSubjectsView(){
  const grid = document.getElementById('subjects-grid');
  grid.innerHTML='';
  if(!state.subjects.length){ grid.innerHTML=`<div class="empty-box" style="grid-column:1/-1;padding:40px">No subjects yet.</div>`; return; }
  state.subjects.forEach(subj=>{
    const all      = state.assessments.filter(a=>a.subjectId===subj.id);
    const upcoming = all.filter(a=>!isCompleted(a)&&daysUntil(a.date)>=0);
    const next     = [...upcoming].sort((a,b)=>parseDate(a.date)-parseDate(b.date))[0];
    const score    = all.reduce((s,a)=>s+urgencyScore(a),0);
    let aClass='att-none', aText='All good';
    if(score>300)       { aClass='att-crit'; aText='⚠ Critical'; }
    else if(score>100)  { aClass='att-high'; aText='⚡ High Priority'; }
    else if(upcoming.length){ aClass='att-ok'; aText='✓ On Track'; }
    const card = document.createElement('div');
    card.className='s-card';
    // Set subject colour vars so dot glow matches the subject
    const hexToRgba = (hex, a) => {
      const h = hex.replace('#','');
      const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
      return `rgba(${r},${g},${b},${a})`;
    };
    card.style.setProperty('--subject-dot-glow', hexToRgba(subj.color||'#e8a838', 0.35));
    card.innerHTML=`
      <div class="s-top"><span class="s-name">${subj.name}</span><span class="s-dot" style="background:${subj.color}"></span></div>
      <div class="s-stat"><span>Assessments</span><strong>${all.length}</strong></div>
      <div class="s-stat"><span>Upcoming</span><strong>${upcoming.length}</strong></div>
      <div class="s-stat"><span>Next due</span><strong>${next?fmtShort(next.date):'—'}</strong></div>
      <div class="s-badge ${aClass}">${aText}</div>
      <div class="s-actions">
        <button class="s-edit-btn" onclick="event.stopPropagation();openEditSubjectModal('${subj.id}')">Edit</button>
        <button class="s-del-btn"  onclick="event.stopPropagation();deleteSubject('${subj.id}')">🗑</button>
      </div>`;
    card.addEventListener('click', ()=>switchToWorkspace(subj.id));
    grid.appendChild(card);
  });
}

// ── HOMEWORK VIEW ─────────────────────────────────────────────────
function buildHomeworkView(){
  const grid     = document.getElementById('homework-grid');
  const hwFilter = document.getElementById('hw-filter-subject');
  const curVal   = hwFilter.value;
  hwFilter.innerHTML = '<option value="">All Subjects</option>';
  state.subjects.forEach(s=>{
    const o=document.createElement('option');
    o.value=s.id; o.textContent=s.name;
    if(s.id===curVal) o.selected=true;
    hwFilter.appendChild(o);
  });
  const toShow = curVal ? state.subjects.filter(s=>s.id===curVal) : state.subjects;
  grid.innerHTML='';
  let shown=false;
  toShow.forEach(subj=>{
    const items = (state.homework||[])
      .filter(hw=>hw.subjectId===subj.id)
      .sort((a,b)=>{
        if(a.done!==b.done) return a.done?1:-1;
        return (a.date?daysUntil(a.date):999)-(b.date?daysUntil(b.date):999);
      });
    const section = document.createElement('div');
    section.className='hw-section';
    section.style.setProperty('--hw-col', subj.color);
    const pending = items.filter(h=>!h.done).length;
    section.innerHTML=`
      <div class="hw-sec-head">
        <span class="hw-sec-name">
          <span style="width:9px;height:9px;border-radius:50%;background:${subj.color};display:inline-block;flex-shrink:0"></span>
          ${subj.name}
          <span class="hw-sec-count">${pending} pending</span>
        </span>
        <button class="hw-add-btn" onclick="openAddHomework('${subj.id}')">+ Add</button>
      </div>`;
    const list = document.createElement('div');
    list.className='hw-list';
    if(!items.length){
      list.innerHTML=`<div class="hw-empty">No homework for ${subj.name} — nice!</div>`;
    } else {
      items.forEach(hw=>{
        const days     = hw.date?daysUntil(hw.date):null;
        const dCls     = days===null?'':days<0?'overdue':days<=2?'soon':'';
        const priCol   = {urgent:'var(--red)',high:'var(--amber)',normal:'var(--green)'}[hw.priority]||'var(--line-mid)';
        const item     = document.createElement('div');
        item.className = 'hw-item';
        item.innerHTML = `
          <span class="hw-pri" style="background:${priCol}"></span>
          <div class="hw-chk ${hw.done?'on':''}"></div>
          <span class="hw-text ${hw.done?'done':''}">${hw.task}</span>
          ${hw.date?`<span class="hw-due ${dCls}">${fmtShort(hw.date)}${days!==null&&days<0?' ⚠':''}</span>`:''}
          <button class="hw-del">✕</button>`;
        item.querySelector('.hw-chk').addEventListener('click', e=>{ e.stopPropagation(); toggleHw(hw.id); });
        item.querySelector('.hw-del').addEventListener('click', e=>{ e.stopPropagation(); deleteHw(hw.id); });
        list.appendChild(item);
      });
    }
    section.appendChild(list);
    grid.appendChild(section);
    shown=true;
  });
  if(!shown) grid.innerHTML=`<div class="empty-box" style="padding:40px">No subjects yet.</div>`;
}

function openAddHomework(presetId=null){
  document.getElementById('hw-modal-title').textContent='Add Homework';
  document.getElementById('hw-form-id').value='';
  // Store the preset subject so saveHomework can use it without showing a dropdown
  document.getElementById('hw-preset-subject').value = presetId||'';
  // Show/hide subject field depending on context
  const subjectRow = document.getElementById('hw-subject-row');
  const sel = document.getElementById('hw-subject');
  if(presetId){
    // Subject already known — hide the picker and show a label instead
    if(subjectRow) subjectRow.style.display='none';
    const lbl = document.getElementById('hw-subject-label');
    if(lbl){ const subj=getSubject(presetId); lbl.style.display=''; lbl.textContent=subj.name; }
  } else {
    // Global add — show the subject picker
    if(subjectRow) subjectRow.style.display='';
    const lbl = document.getElementById('hw-subject-label');
    if(lbl) lbl.style.display='none';
    sel.innerHTML='<option value="">Select…</option>';
    state.subjects.forEach(s=>{
      const o=document.createElement('option');
      o.value=s.id; o.textContent=s.name;
      sel.appendChild(o);
    });
  }
  document.getElementById('hw-task').value='';
  document.getElementById('hw-date').value='';
  document.getElementById('hw-priority').value='normal';
  document.getElementById('modal-homework').classList.remove('hidden');
}

function saveHomework(){
  const preset = document.getElementById('hw-preset-subject').value;
  const sid  = preset || document.getElementById('hw-subject').value;
  const task = document.getElementById('hw-task').value.trim();
  if(!sid||!task){ alert('Please select a subject and enter a task.'); return; }
  state.homework.push({ id:'hw_'+Date.now(), subjectId:sid, task, date:document.getElementById('hw-date').value||null, priority:document.getElementById('hw-priority').value, done:false });
  saveState(); closeModal('modal-homework'); buildHomeworkView();
  if(getCurrentView()==='calendar') buildCalendar();
}

function toggleHw(id){
  const hw=(state.homework||[]).find(h=>h.id===id);
  if(hw){ hw.done=!hw.done; saveState(); buildHomeworkView(); }
}
function deleteHw(id){ state.homework=(state.homework||[]).filter(h=>h.id!==id); saveState(); buildHomeworkView(); if(getCurrentView()==='calendar') buildCalendar(); }

// ── PREPARATION (replaces Workspace) ──────────────────────────────

// Ensure prep data exists on the state object
function ensurePrepData(aid){
  if(!state.prepData) state.prepData={};
  if(!state.prepData[aid]) state.prepData[aid]={
    mistakes:'', advice:'', papers:[], kanban:{ todo:[], doing:[], done:[] }
  };
  return state.prepData[aid];
}

let activePrepAssessmentId = null;

// ── MAIN LIST VIEW ─────────────────────────────────────────────────
function buildWorkspaceView(){
  if(!state.prepData) state.prepData={};
  showPrepList();
}

function showPrepList(){
  const listView   = document.getElementById('prep-list-view');
  const detailView = document.getElementById('prep-detail-view');
  if(listView)   listView.classList.remove('hidden');
  if(detailView) detailView.classList.add('hidden');
  renderPrepList();
}

let prepCarouselIndex = 0;

function renderPrepList(){
  const body = document.getElementById('prep-body');
  if(!body) return;

  const activeAssessments = state.assessments
    .filter(a => !isCompleted(a))
    .sort((a,b) => parseDate(a.date) - parseDate(b.date));

  const soon = activeAssessments.filter(a => {
    const d = daysUntil(a.date);
    return d > 7 && d <= 21;
  });

  const sub = document.getElementById('prep-subtitle');
  if(sub) sub.textContent = activeAssessments.length
    ? `${activeAssessments.length} active assessment${activeAssessments.length!==1?'s':''} to prepare for`
    : 'No upcoming assessments';

  if(!soon.length){
    body.innerHTML=`<div class="prep-empty"><div class="prep-empty-icon">✓</div><div class="prep-empty-title">Nothing in the coming up window</div><div class="prep-empty-sub">Assessments due in 8 to 21 days will appear here so you can pick one to prepare for.</div><button class="btn btn-primary" onclick="openAssessments()">View Assessments</button></div>`;
    return;
  }

  prepCarouselIndex = Math.max(0, Math.min(prepCarouselIndex, soon.length - 1));
  const countText = `${soon.length} assessment${soon.length!==1?'s':''} in the coming up window`;
  const slides = soon.map(a => `<div class="prep-picker-slide">${buildPrepCard(a)}</div>`).join('');
  const dots = soon.map((_, i) => `<button class="prep-picker-dot ${i===prepCarouselIndex?'is-active':''}" onclick="setPrepCarouselIndex(${i})" aria-label="Go to assessment ${i+1}"></button>`).join('');
  const canMove = soon.length > 1;

  body.innerHTML = `
    <div class="prep-picker-wrap">
      <div class="prep-picker-caption">Pick one assessment to prepare for</div>
      <div class="prep-picker-sub">${countText}</div>

      <div class="prep-picker-stage">
        <button class="prep-picker-arrow left ${!canMove?'is-disabled':''}" ${canMove?`onclick="shiftPrepCarousel(-1)"`:'disabled'} aria-label="Previous assessment">
          <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3L5 8l5 5"/></svg>
        </button>

        <div class="prep-picker-window">
          <div class="prep-picker-track" style="transform: translateX(-${prepCarouselIndex * 100}%);">
            ${slides}
          </div>
        </div>

        <button class="prep-picker-arrow right ${!canMove?'is-disabled':''}" ${canMove?`onclick="shiftPrepCarousel(1)"`:'disabled'} aria-label="Next assessment">
          <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5"/></svg>
        </button>
      </div>

      <div class="prep-picker-meta">${prepCarouselIndex + 1} / ${soon.length}</div>
      <div class="prep-picker-dots">${dots}</div>
    </div>`;
}

function shiftPrepCarousel(dir){
  const activeAssessments = state.assessments
    .filter(a => !isCompleted(a))
    .sort((a,b) => parseDate(a.date) - parseDate(b.date));
  const soon = activeAssessments.filter(a => {
    const d = daysUntil(a.date);
    return d > 7 && d <= 21;
  });
  if(!soon.length) return;
  prepCarouselIndex = (prepCarouselIndex + dir + soon.length) % soon.length;
  applyPrepCarouselPosition(soon.length);
}

function setPrepCarouselIndex(index){
  prepCarouselIndex = index;
  const activeAssessments = state.assessments
    .filter(a => !isCompleted(a))
    .sort((a,b) => parseDate(a.date) - parseDate(b.date));
  const soon = activeAssessments.filter(a => {
    const d = daysUntil(a.date);
    return d > 7 && d <= 21;
  });
  applyPrepCarouselPosition(soon.length);
}

function applyPrepCarouselPosition(total){
  // Animate the track — keep the DOM alive so the CSS transition fires
  const track = document.querySelector('.prep-picker-track');
  if(track) track.style.transform = `translateX(-${prepCarouselIndex * 100}%)`;

  // Update dots
  document.querySelectorAll('.prep-picker-dot').forEach((dot, i) => {
    dot.classList.toggle('is-active', i === prepCarouselIndex);
  });

  // Update counter text
  const meta = document.querySelector('.prep-picker-meta');
  if(meta) meta.textContent = `${prepCarouselIndex + 1} / ${total}`;

  // Update arrow disabled states
  const canMove = total > 1;
  const leftBtn  = document.querySelector('.prep-picker-arrow.left');
  const rightBtn = document.querySelector('.prep-picker-arrow.right');
  if(leftBtn){
    leftBtn.disabled = !canMove;
    leftBtn.classList.toggle('is-disabled', !canMove);
    if(canMove) leftBtn.setAttribute('onclick', 'shiftPrepCarousel(-1)');
    else        leftBtn.removeAttribute('onclick');
  }
  if(rightBtn){
    rightBtn.disabled = !canMove;
    rightBtn.classList.toggle('is-disabled', !canMove);
    if(canMove) rightBtn.setAttribute('onclick', 'shiftPrepCarousel(1)');
    else        rightBtn.removeAttribute('onclick');
  }
}

function buildPrepCard(a){
  const subj  = getSubject(a.subjectId);
  const days  = daysUntil(a.date);
  const color = subj ? subj.color : 'var(--t2)';

  return `
    <button class="a-card" onclick="openPrepDetail('${a.id}')"
      style="--subject-color:${color};--c-accent:${color}">
      <div class="a-head-clean">
        <span class="a-subject">${subj ? subj.name : 'Unknown'}</span>
        <span class="days-chip ${chipClass(days)}">${daysLabel(days)}</span>
      </div>
      <div class="a-title">${a.title}</div>
      <div class="a-subline">${cap(a.type)} · ${fmtDate(a.date)}${a.weighting?` · ${a.weighting}%`:''}</div>
      <div class="a-foot clean">
        <span class="prog-pill p-${a.progress}">${getProgressLabel(a.progress)}</span>
        </div>
    </button>`;
}

// ── DETAIL VIEW ────────────────────────────────────────────────────
function openPrepDetail(aid){
  activePrepAssessmentId = aid;
  const listView   = document.getElementById('prep-list-view');
  const detailView = document.getElementById('prep-detail-view');
  if(listView)   listView.classList.add('hidden');
  if(detailView) detailView.classList.remove('hidden');
  renderPrepDetail(aid);
  document.querySelector('.main').scrollTop = 0;
}

function closePrepDetail(){
  activePrepAssessmentId = null;
  showPrepList();
  document.querySelector('.main').scrollTop = 0;
}

function renderPrepDetail(aid){
  const a    = state.assessments.find(x=>x.id===aid);
  if(!a) return;
  const subj = getSubject(a.subjectId);
  const days = daysUntil(a.date);
  const prep = ensurePrepData(aid);

  // Header
  const titleEl    = document.getElementById('prep-detail-title');
  const subEl      = document.getElementById('prep-detail-sub');
  const countEl    = document.getElementById('prep-detail-countdown');
  if(titleEl)  titleEl.textContent = a.title;
  if(subEl)    subEl.textContent   = `${subj ? subj.name : ''} · ${cap(a.type)} · ${fmtDate(a.date)}`;
  if(countEl){
    const cls = days <= 3 ? 'prep-chip-red' : days <= 7 ? 'prep-chip-amber' : days <= 14 ? 'prep-chip-yellow' : 'prep-chip-dim';
    countEl.className = `prep-countdown-badge ${cls}`;
    countEl.textContent = days < 0
      ? `${Math.abs(days)} day${Math.abs(days)===1?'':'s'} overdue`
      : days === 0
        ? 'Due today'
        : days === 1
          ? '1 day left'
          : `${days} days left`;
  }

  const body = document.getElementById('prep-detail-body');
  if(!body) return;

  const subColor = subj ? subj.color : 'var(--amber)';

  // Progress buttons — same labels/values as the dashboard detail modal
  const progKeys = ['not_started','in_progress','revised_once','mostly_prepared','ready'];
  const progBtnsHTML = isCompleted(a) ? '' : `
    <div class="prep-prog-section">
      <div class="prep-ov-label" style="margin-bottom:8px">PROGRESS</div>
      <div class="prep-prog-btns" id="prep-prog-btns">
        ${progKeys.map(p=>`<button class="prep-prog-btn ${a.progress===p?'on':''}" data-prog="${p}" onclick="updatePrepProgress('${aid}','${p}')">${getProgressLabel(p)}</button>`).join('')}
      </div>
    </div>`;

  body.innerHTML = `
    <div class="prep-detail-layout-v2">

      <!-- TOP ROW: Overview (left) + Kanban (right, tall) -->
      <div class="prep-top-left">

        <!-- Overview -->
        <div class="prep-section-card" style="margin-bottom:0">
          <div class="prep-sc-head">
            <span class="prep-sc-icon" style="background:${subColor}20;color:${subColor}">A</span>
            <span class="prep-sc-title">Overview</span>
          </div>
          <div class="prep-overview-grid">
            <div class="prep-ov-cell"><div class="prep-ov-label">Subject</div><div class="prep-ov-val" style="color:${subColor}">${subj ? subj.name : '—'}</div></div>
            <div class="prep-ov-cell"><div class="prep-ov-label">Type</div><div class="prep-ov-val">${cap(a.type)}</div></div>
            <div class="prep-ov-cell"><div class="prep-ov-label">Date</div><div class="prep-ov-val">${fmtDate(a.date)}</div></div>
            <div class="prep-ov-cell"><div class="prep-ov-label">Weighting</div><div class="prep-ov-val">${a.weighting ? a.weighting+'%' : '—'}</div></div>
            ${a.topic ? `<div class="prep-ov-cell prep-ov-full"><div class="prep-ov-label">Topic</div><div class="prep-ov-val">${a.topic}</div></div>` : ''}
          </div>
          ${progBtnsHTML}
        </div>

        <!-- Practice Papers -->
        <div class="prep-section-card" style="margin-top:14px;margin-bottom:0">
          <div class="prep-sc-head">
            <span class="prep-sc-icon" style="background:var(--grn-dim);color:var(--green)">▶</span>
            <span class="prep-sc-title">Practice Papers</span>
          </div>
          <div class="prep-papers-list" id="prep-papers-list"></div>
          <div class="prep-add-row">
            <input type="text" class="prep-add-inp" id="prep-paper-inp" placeholder="Paper name (e.g. 2022 Exam)…" onkeydown="if(event.key==='Enter'){event.preventDefault();addPrepPaper('${aid}')}">
            <button class="btn btn-outline btn-sm" onclick="addPrepPaper('${aid}')">Add</button>
          </div>
        </div>

      </div>

      <!-- KANBAN: right column, full height -->
      <div class="prep-top-right">
        <div class="prep-kanban-panel">
          <div class="prep-kanban-header">
            <span class="prep-sc-title">Study Tasks</span>
            <button class="btn btn-primary btn-sm" onclick="openAddKanbanCard('${aid}')">+ Add Task</button>
          </div>
          <div class="prep-kanban-tall" id="prep-kanban-board" data-aid="${aid}">
            ${buildKanbanColumn(aid,'todo','To Do','var(--t3)')}
            ${buildKanbanColumn(aid,'doing','Doing','var(--amber)')}
            ${buildKanbanColumn(aid,'done','Done','var(--green)')}
          </div>
        </div>
      </div>

    </div>`;

  renderPrepPapers(aid);
  initKanbanDragDrop(aid);
}

// Inline textarea save
function savePrepField(aid, field, val){
  const prep = ensurePrepData(aid);
  prep[field] = val;
  saveState();
}

// Progress update from Preparation tab — syncs to the same assessment.progress field
// so Dashboard and Assessments views stay in sync automatically
function updatePrepProgress(aid, progress){
  const idx = state.assessments.findIndex(a => a.id === aid);
  if(idx === -1) return;
  state.assessments[idx].progress = progress;
  saveState();
  // Re-render just the progress buttons inline (no full re-render flicker)
  const btns = document.getElementById('prep-prog-btns');
  if(btns){
    btns.querySelectorAll('.prep-prog-btn').forEach(btn => {
      btn.classList.toggle('on', btn.dataset.prog === progress);
    });
  }
}

// ── PRACTICE PAPERS ────────────────────────────────────────────────
function renderPrepPapers(aid){
  const prep = ensurePrepData(aid);
  const el   = document.getElementById('prep-papers-list');
  if(!el) return;
  const papers = prep.papers || [];
  if(!papers.length){
    el.innerHTML = `<div class="prep-papers-empty">No papers tracked yet</div>`;
    return;
  }
  el.innerHTML = papers.map(p => `
    <div class="prep-paper-item">
      <button class="prep-paper-chk ${p.done?'on':''}" onclick="togglePrepPaper('${aid}','${p.id}')" aria-label="${p.done?'Mark undone':'Mark done'}">
        ${p.done ? `<svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M2 5l2 2.5 4-4"/></svg>` : ''}
      </button>
      <span class="prep-paper-name ${p.done?'done':''}">${p.name}</span>
      <button class="prep-paper-del" onclick="deletePrepPaper('${aid}','${p.id}')" aria-label="Delete">✕</button>
    </div>`).join('');
}

function addPrepPaper(aid){
  const inp = document.getElementById('prep-paper-inp');
  const txt = inp ? inp.value.trim() : '';
  if(!txt) return;
  const prep = ensurePrepData(aid);
  if(!prep.papers) prep.papers = [];
  prep.papers.push({ id:'pp_'+Date.now(), name:txt, done:false });
  saveState();
  if(inp){ inp.value=''; inp.focus(); }
  renderPrepPapers(aid);
}

function togglePrepPaper(aid, pid){
  const prep = ensurePrepData(aid);
  const p = (prep.papers||[]).find(x=>x.id===pid);
  if(p){ p.done = !p.done; saveState(); renderPrepPapers(aid); }
}

function deletePrepPaper(aid, pid){
  const prep = ensurePrepData(aid);
  prep.papers = (prep.papers||[]).filter(x=>x.id!==pid);
  saveState(); renderPrepPapers(aid);
}

// ── KANBAN ─────────────────────────────────────────────────────────
function buildKanbanColumn(aid, col, label, dotColor){
  const prep  = ensurePrepData(aid);
  const cards = (prep.kanban[col]||[]);
  const silentClass = _kbKanbanRenderOptions.silentAppear ? ' kb-no-appear' : '';
  const cardHTML = cards.length
    ? cards.map(c => buildKanbanCardHTML(aid, col, c)).join('')
    : `<div class="kb-empty${silentClass}" data-col="${col}" data-aid="${aid}">Drop tasks here</div>`;
  return `
    <div class="kb-col" data-col="${col}" data-aid="${aid}">
      <div class="kb-col-head">
        <span class="kb-col-dot" style="background:${dotColor}"></span>
        <span class="kb-col-label">${label}</span>
        <span class="kb-col-count">${cards.length}</span>
      </div>
      <div class="kb-cards" id="kb-col-${col}" data-col="${col}" data-aid="${aid}">${cardHTML}</div>
    </div>`;
}

// Tracks which kanban card is being edited (text or date)
let _kbEditingTextId = null;
let _kbEditingDateId = null;
let _kbKanbanRenderOptions = { silentAppear:false };

function buildKanbanCardHTML(aid, col, c){
  const isEditingText = _kbEditingTextId === c.id;
  const isEditingDate = _kbEditingDateId === c.id;

  // Date chip — mirrors hw-card-date-chip pattern
  const days = c.deadline ? daysUntil(c.deadline) : null;
  const dueTone = days === null ? '' : days < 0 ? 'overdue' : days <= 2 ? 'soon' : '';
  const dueText = days === null ? 'Add Date'
    : days === 0 ? 'Today'
    : days === 1 ? 'Tomorrow'
    : fmtDate(c.deadline);
  const datePart = isEditingDate
    ? `<input class="kb-date-input ${dueTone}" type="date" value="${c.deadline||''}" data-id="${c.id}" data-aid="${aid}" data-col="${col}">`
    : `<button class="kb-date-chip ${dueTone} ${!c.deadline ? 'is-empty' : ''}" data-id="${c.id}" data-aid="${aid}" data-col="${col}">${dueText}</button>`;

  const textPart = isEditingText
    ? `<input class="kb-text-input" type="text" value="${c.text.replace(/"/g,'&quot;')}" data-id="${c.id}" data-aid="${aid}" data-col="${col}">`
    : `<span class="kb-card-text">${c.text}</span>`;

  const silentClass = _kbKanbanRenderOptions.silentAppear ? ' kb-no-appear' : '';

  return `
    <div class="kb-card${silentClass}" draggable="false" data-id="${c.id}" data-col="${col}" data-aid="${aid}">
      <div class="kb-card-main">
        ${textPart}
        <div class="kb-card-foot">
          ${datePart}
        </div>
      </div>
      <div class="kb-card-actions">
        <button class="kb-move-btn" onclick="moveKanbanCard('${aid}','${col}','${c.id}',-1)" title="Move left">‹</button>
        <button class="kb-move-btn" onclick="moveKanbanCard('${aid}','${col}','${c.id}',1)" title="Move right">›</button>
        <button class="kb-del-btn" onclick="deleteKanbanCard('${aid}','${col}','${c.id}')" title="Delete">✕</button>
      </div>
    </div>`;
}

let addKanbanTarget = null;
function openAddKanbanCard(aid){
  addKanbanTarget = aid;
  // Show inline quick-add in todo column
  const col = document.getElementById('kb-col-todo');
  if(!col) return;
  // Remove any existing inline
  const existing = col.querySelector('.kb-inline-add');
  if(existing) existing.remove();
  const div = document.createElement('div');
  div.className = 'kb-inline-add';
  div.innerHTML = `
    <textarea class="kb-inline-inp" id="kb-inline-inp" placeholder="Task description…" rows="2" autofocus></textarea>
    <div class="kb-inline-foot">
      <input type="date" class="kb-inline-date" id="kb-inline-date" title="Optional deadline">
      <button class="btn btn-primary btn-sm" onclick="confirmAddKanbanCard('${aid}')">Add</button>
      <button class="btn btn-ghost btn-sm" onclick="cancelKanbanInline()">Cancel</button>
    </div>`;
  col.insertBefore(div, col.firstChild);
  setTimeout(()=>{ const t=document.getElementById('kb-inline-inp'); if(t) t.focus(); },50);
}

function confirmAddKanbanCard(aid){
  const inp  = document.getElementById('kb-inline-inp');
  const date = document.getElementById('kb-inline-date');
  const txt  = inp ? inp.value.trim() : '';
  if(!txt) return;
  const prep = ensurePrepData(aid);
  if(!prep.kanban.todo) prep.kanban.todo=[];
  prep.kanban.todo.push({ id:'kc_'+Date.now(), text:txt, deadline: date ? date.value : '' });
  saveState();
  reRenderKanban(aid);
}

function cancelKanbanInline(){
  const div = document.querySelector('.kb-inline-add');
  if(div) div.remove();
}

function saveKanbanCardText(aid, col, cid, newText){
  const prep = ensurePrepData(aid);
  const card = (prep.kanban[col]||[]).find(c=>c.id===cid);
  if(card && newText){ card.text=newText; saveState(); }
}

function deleteKanbanCard(aid, col, cid){
  const prep = ensurePrepData(aid);
  prep.kanban[col] = (prep.kanban[col]||[]).filter(c=>c.id!==cid);
  saveState(); reRenderKanban(aid);
}

function moveKanbanCard(aid, fromCol, cid, dir){
  const cols = ['todo','doing','done'];
  const fromIdx = cols.indexOf(fromCol);
  const toIdx   = fromIdx + dir;
  if(toIdx < 0 || toIdx >= cols.length) return;
  const toCol = cols[toIdx];
  const prep  = ensurePrepData(aid);
  const card  = (prep.kanban[fromCol]||[]).find(c=>c.id===cid);
  if(!card) return;
  prep.kanban[fromCol] = prep.kanban[fromCol].filter(c=>c.id!==cid);
  if(!prep.kanban[toCol]) prep.kanban[toCol]=[];
  prep.kanban[toCol].push(card);
  saveState(); reRenderKanban(aid);
}

function reRenderKanban(aid, keepEditStates, options = {}){
  const board = document.getElementById('prep-kanban-board');
  if(!board) return;
  if(!keepEditStates){ /* edit states already set by callers */ }
  const priorRenderOptions = _kbKanbanRenderOptions;
  _kbKanbanRenderOptions = {
    ...priorRenderOptions,
    silentAppear: !!options.silentAppear
  };
  board.innerHTML =
    buildKanbanColumn(aid,'todo','To Do','var(--t3)') +
    buildKanbanColumn(aid,'doing','Doing','var(--amber)') +
    buildKanbanColumn(aid,'done','Done','var(--green)');
  _kbKanbanRenderOptions = priorRenderOptions;
  initKanbanDragDrop(aid);
}

// ── DRAG AND DROP ──────────────────────────────────────────────────
let _kbDrag = null;
let _kbDragCleanup = null;
const KB_DRAG_START_DISTANCE = 6;
const KB_PLACEHOLDER_DEAD_ZONE = 6;
const KB_DRAG_EASE = 0.34;

function cleanupKanbanDrag(){
  if(_kbDragCleanup) _kbDragCleanup();
}

function cancelKanbanDragFrame(drag = _kbDrag){
  if(drag && drag.rafId){
    cancelAnimationFrame(drag.rafId);
    drag.rafId = null;
  }
}

function queueKanbanSilentBoard(board){
  if(!board) return;
  board.classList.add('kb-no-drop-anim');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => board.classList.remove('kb-no-drop-anim'));
  });
}

function getKanbanCardsInZone(zone, excludeEl){
  return [...zone.querySelectorAll('.kb-card')].filter(card =>
    card !== excludeEl && !card.classList.contains('kb-placeholder')
  );
}

function animateKanbanReflow(board, mutate){
  if(!board){
    mutate();
    return;
  }

  const items = [...board.querySelectorAll('.kb-card')].filter(card => !card.classList.contains('kb-card-floating'));
  const firstRects = new Map(items.map(card => [card, card.getBoundingClientRect()]));

  mutate();

  const nextItems = [...board.querySelectorAll('.kb-card')].filter(card => !card.classList.contains('kb-card-floating'));
  nextItems.forEach(card => {
    const first = firstRects.get(card);
    if(!first) return;
    const last = card.getBoundingClientRect();
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    if(Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

    const priorTransition = card.style.transition;
    const priorTransform = card.style.transform;
    card.style.transition = 'none';
    card.style.transform = `translate(${dx}px, ${dy}px)`;
    card.getBoundingClientRect();

    requestAnimationFrame(() => {
      card.style.transition = 'transform 180ms cubic-bezier(.2,.8,.2,1)';
      card.style.transform = priorTransform || '';
      const cleanup = () => {
        card.style.transition = priorTransition || '';
        if(!priorTransform) card.style.transform = '';
      };
      card.addEventListener('transitionend', cleanup, { once: true });
      setTimeout(cleanup, 220);
    });
  });
}

function ensureKanbanPlaceholder(zone, afterEl){
  if(!_kbDrag || !_kbDrag.placeholder || !zone) return;
  const placeholder = _kbDrag.placeholder;
  const currentParent = placeholder.parentElement;
  const targetNode = afterEl
    ? afterEl.nextSibling
    : (getKanbanCardsInZone(zone, _kbDrag.cardEl)[0] || zone.querySelector('.kb-empty') || null);

  if(currentParent === zone && placeholder.nextSibling === targetNode) return;

  animateKanbanReflow(_kbDrag.board, () => {
    if(currentParent && currentParent !== zone){
      currentParent.classList.remove('has-placeholder');
      currentParent.querySelectorAll('.kb-empty').forEach(empty => empty.classList.remove('is-hidden'));
    }

    zone.insertBefore(placeholder, targetNode);
    zone.classList.add('has-placeholder');
  });
}

function setKanbanPlaceholderFromPoint(clientX, clientY){
  if(!_kbDrag) return;
  const board = _kbDrag.board;
  let target = document.elementFromPoint(clientX, clientY);
  let zone = target ? target.closest('.kb-cards') : null;

  if(!zone || !board.contains(zone)){
    const zones = [...board.querySelectorAll('.kb-cards')];
    let nearest = null;
    let bestDist = Infinity;
    zones.forEach(candidate => {
      const rect = candidate.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const dist = Math.abs(clientX - centerX);
      if(dist < bestDist){
        bestDist = dist;
        nearest = candidate;
      }
    });
    zone = nearest;
  }

  if(!zone) return;

  zone.querySelectorAll('.kb-empty').forEach(empty => empty.classList.add('is-hidden'));

  const cards = getKanbanCardsInZone(zone, _kbDrag.cardEl);
  let insertAfter = null;

  for(const card of cards){
    const rect = card.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    if(clientY < midpoint){
      break;
    }
    insertAfter = card;
  }

  const afterId = insertAfter ? insertAfter.dataset.id : null;
  const samePlacement = _kbDrag.currentZone === zone && _kbDrag.currentAfterId === afterId;
  if(samePlacement) return;

  if(
    _kbDrag.currentZone === zone &&
    _kbDrag.lastSwitchY != null &&
    Math.abs(clientY - _kbDrag.lastSwitchY) < KB_PLACEHOLDER_DEAD_ZONE
  ){
    return;
  }

  _kbDrag.currentZone = zone;
  _kbDrag.currentAfterId = afterId;
  _kbDrag.lastSwitchY = clientY;
  ensureKanbanPlaceholder(zone, insertAfter);
}

function stepKanbanDraggedCardPosition(){
  if(!_kbDrag) return;
  const drag = _kbDrag;
  drag.currentLeft += (drag.targetLeft - drag.currentLeft) * KB_DRAG_EASE;
  drag.currentTop  += (drag.targetTop - drag.currentTop) * KB_DRAG_EASE;

  const deltaX = drag.targetLeft - drag.currentLeft;
  const deltaY = drag.targetTop - drag.currentTop;
  drag.cardEl.style.left = `${drag.currentLeft}px`;
  drag.cardEl.style.top  = `${drag.currentTop}px`;

  if(Math.abs(deltaX) < 0.35 && Math.abs(deltaY) < 0.35){
    drag.currentLeft = drag.targetLeft;
    drag.currentTop = drag.targetTop;
    drag.cardEl.style.left = `${drag.targetLeft}px`;
    drag.cardEl.style.top  = `${drag.targetTop}px`;
    drag.rafId = null;
    return;
  }

  drag.rafId = requestAnimationFrame(stepKanbanDraggedCardPosition);
}

function updateKanbanDraggedCardPosition(clientX, clientY, immediate){
  if(!_kbDrag) return;
  const drag = _kbDrag;
  drag.targetLeft = clientX - drag.offsetX;
  drag.targetTop  = clientY - drag.offsetY;

  if(immediate || drag.currentLeft == null || drag.currentTop == null){
    drag.currentLeft = drag.targetLeft;
    drag.currentTop = drag.targetTop;
    drag.cardEl.style.left = `${drag.currentLeft}px`;
    drag.cardEl.style.top  = `${drag.currentTop}px`;
  }

  if(!drag.rafId){
    drag.rafId = requestAnimationFrame(stepKanbanDraggedCardPosition);
  }
}

function autoScrollKanban(clientY, clientX){
  const edge = 80;
  const maxStep = 18;
  const viewportH = window.innerHeight;
  const viewportW = window.innerWidth;

  if(clientY < edge){
    const strength = Math.min(1, (edge - clientY) / edge);
    window.scrollBy(0, -Math.ceil(maxStep * strength));
  } else if(clientY > viewportH - edge){
    const strength = Math.min(1, (clientY - (viewportH - edge)) / edge);
    window.scrollBy(0, Math.ceil(maxStep * strength));
  }

  if(clientX < edge){
    const strength = Math.min(1, (edge - clientX) / edge);
    window.scrollBy(-Math.ceil(maxStep * strength), 0);
  } else if(clientX > viewportW - edge){
    const strength = Math.min(1, (clientX - (viewportW - edge)) / edge);
    window.scrollBy(Math.ceil(maxStep * strength), 0);
  }
}

function getKanbanPlaceholderIndex(zone, placeholder){
  let index = 0;
  for(const child of zone.children){
    if(child === placeholder) return index;
    if(child.classList && child.classList.contains('kb-card') && !child.classList.contains('kb-placeholder')){
      index += 1;
    }
  }
  return index;
}

function finishKanbanDrag(commitDrop){
  if(!_kbDrag) return;
  const drag = _kbDrag;
  cleanupKanbanDrag();
  cancelKanbanDragFrame(drag);

  const placeholder = drag.placeholder;
  const targetZone = placeholder && placeholder.parentElement ? placeholder.parentElement : drag.originZone;
  const toCol = targetZone ? targetZone.dataset.col : drag.fromCol;
  const toIndex = targetZone ? getKanbanPlaceholderIndex(targetZone, placeholder) : drag.fromIndex;
  const sameColumnDrop = commitDrop && toCol === drag.fromCol;

  drag.cardEl.classList.remove('dragging');
  drag.cardEl.classList.remove('kb-card-floating');
  drag.cardEl.style.width = '';
  drag.cardEl.style.height = '';
  drag.cardEl.style.left = '';
  drag.cardEl.style.top = '';
  drag.cardEl.style.pointerEvents = '';
  drag.cardEl.style.zIndex = '';
  drag.cardEl.style.position = '';
  drag.cardEl.style.transform = '';
  drag.cardEl.style.transition = '';

  document.body.classList.remove('kb-dragging-active');
  document.querySelectorAll('.kb-cards').forEach(zone => {
    zone.classList.remove('drag-over');
    zone.classList.remove('has-placeholder');
    zone.querySelectorAll('.kb-empty').forEach(empty => empty.classList.remove('is-hidden'));
  });

  if(commitDrop){
    const prep = ensurePrepData(drag.aid);
    const fromList = prep.kanban[drag.fromCol] || [];
    const cardIndex = fromList.findIndex(c => c.id === drag.cardId);
    if(cardIndex !== -1){
      const [card] = fromList.splice(cardIndex, 1);
      if(!prep.kanban[toCol]) prep.kanban[toCol] = [];
      const targetList = prep.kanban[toCol];
      const safeIndex = Math.max(0, Math.min(toIndex, targetList.length));
      targetList.splice(safeIndex, 0, card);
      saveState();
    }
  }

  if(sameColumnDrop && placeholder && targetZone){
    placeholder.replaceWith(drag.cardEl);
    drag.cardEl.dataset.col = toCol;
    _kbDrag = null;
    return;
  }

  if(placeholder) placeholder.remove();
  drag.cardEl.remove();

  const aid = drag.aid;
  const board = drag.board;
  _kbDrag = null;
  queueKanbanSilentBoard(board);
  reRenderKanban(aid, true, { silentAppear:true });
}

function bindKanbanPointerDrag(aid, board){
  board.querySelectorAll('.kb-card').forEach(card => {
    card.addEventListener('pointerdown', e => {
      if(e.button !== 0 && e.pointerType !== 'touch') return;
      if(e.target.closest('button, input, textarea, .kb-card-text, .kb-date-chip, .kb-card-actions')) return;
      if(document.activeElement && ['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;

      const originZone = card.closest('.kb-cards');
      if(!originZone) return;
      const rect = card.getBoundingClientRect();
      const startIndex = [...originZone.querySelectorAll('.kb-card')].indexOf(card);
      const startX = e.clientX;
      const startY = e.clientY;
      let started = false;

      const onMove = moveEvt => {
        if(!started){
          const dx = moveEvt.clientX - startX;
          const dy = moveEvt.clientY - startY;
          if(Math.hypot(dx, dy) < KB_DRAG_START_DISTANCE) return;

          started = true;
          const placeholder = document.createElement('div');
          placeholder.className = 'kb-card kb-placeholder';
          placeholder.style.height = `${rect.height}px`;
          placeholder.style.width = `${rect.width}px`;
          originZone.insertBefore(placeholder, card.nextSibling);
          originZone.classList.add('has-placeholder');

          card.classList.add('dragging');
          card.classList.add('kb-card-floating');
          card.style.width = `${rect.width}px`;
          card.style.height = `${rect.height}px`;
          card.style.left = `${rect.left}px`;
          card.style.top = `${rect.top}px`;
          card.style.pointerEvents = 'none';
          card.style.zIndex = '9999';
          card.style.position = 'fixed';
          card.style.transition = 'none';
          document.body.appendChild(card);
          document.body.classList.add('kb-dragging-active');

          _kbDrag = {
            aid,
            board,
            cardId: card.dataset.id,
            cardEl: card,
            fromCol: card.dataset.col,
            fromIndex: startIndex,
            originZone,
            placeholder,
            offsetX: startX - rect.left,
            offsetY: startY - rect.top,
            currentZone: originZone,
            currentAfterId: card.dataset.id,
            lastSwitchY: startY,
            currentLeft: rect.left,
            currentTop: rect.top,
            targetLeft: rect.left,
            targetTop: rect.top,
            rafId: null
          };

          updateKanbanDraggedCardPosition(moveEvt.clientX, moveEvt.clientY, true);
          setKanbanPlaceholderFromPoint(moveEvt.clientX, moveEvt.clientY);
        }

        if(!_kbDrag) return;
        moveEvt.preventDefault();
        updateKanbanDraggedCardPosition(moveEvt.clientX, moveEvt.clientY);
        setKanbanPlaceholderFromPoint(moveEvt.clientX, moveEvt.clientY);
        autoScrollKanban(moveEvt.clientY, moveEvt.clientX);
      };

      const onEnd = () => {
        cleanup();
        finishKanbanDrag(started);
      };

      const cleanup = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
        window.removeEventListener('pointercancel', onEnd);
        if(_kbDragCleanup === cleanup) _kbDragCleanup = null;
      };

      _kbDragCleanup = cleanup;
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onEnd, { once: true });
      window.addEventListener('pointercancel', onEnd, { once: true });
      if(card.setPointerCapture){
        try { card.setPointerCapture(e.pointerId); } catch (_) {}
      }
    });
  });
}

function initKanbanDragDrop(aid){
  cleanupKanbanDrag();
  const board = document.getElementById('prep-kanban-board');
  if(!board) return;

  bindKanbanPointerDrag(aid, board);

  // ── Text click-to-edit ────────────────────────────────────────────
  board.querySelectorAll('.kb-card-text').forEach(textEl => {
    const cid = textEl.closest('.kb-card').dataset.id;
    textEl.addEventListener('click', e => {
      e.stopPropagation();
      _kbEditingTextId = cid;
      _kbEditingDateId = null;
      reRenderKanban(aid);
    });
  });

  board.querySelectorAll('.kb-text-input').forEach(inp => {
    const cid = inp.dataset.id;
    const col  = inp.dataset.col;
    inp.addEventListener('click', e => e.stopPropagation());
    requestAnimationFrame(() => { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); });
    const commit = () => {
      const val = inp.value.trim();
      if(val) {
        const prep = ensurePrepData(aid);
        const card = (prep.kanban[col]||[]).find(c=>c.id===cid);
        if(card){ card.text = val; saveState(); }
      }
      _kbEditingTextId = null;
      reRenderKanban(aid);
    };
    inp.addEventListener('keydown', e => {
      if(e.key === 'Enter')  { e.preventDefault(); commit(); }
      if(e.key === 'Escape') { _kbEditingTextId = null; reRenderKanban(aid); }
    });
    inp.addEventListener('blur', commit);
  });

  // ── Date chip click-to-edit ───────────────────────────────────────
  board.querySelectorAll('.kb-date-chip').forEach(chip => {
    const cid = chip.dataset.id;
    chip.addEventListener('click', e => {
      e.stopPropagation();
      _kbEditingDateId = cid;
      _kbEditingTextId = null;
      reRenderKanban(aid);
    });
  });

  board.querySelectorAll('.kb-date-input').forEach(inp => {
    const cid = inp.dataset.id;
    const col  = inp.dataset.col;
    inp.addEventListener('click', e => e.stopPropagation());
    requestAnimationFrame(() => {
      inp.focus();
      try { if(inp.showPicker) inp.showPicker(); } catch(_) {}
    });
    const commitDate = () => {
      const prep = ensurePrepData(aid);
      const card = (prep.kanban[col]||[]).find(c=>c.id===cid);
      if(card){ card.deadline = inp.value || ''; saveState(); }
      _kbEditingDateId = null;
      reRenderKanban(aid);
    };
    inp.addEventListener('change', commitDate);
    inp.addEventListener('blur', commitDate);
  });
}

// Legacy compat
function switchToWorkspace(sid){
  switchView('workspace');
  // Just open the prep list — no longer tab-based
}

// ── CALENDAR ─────────────────────────────────────────────────────
let calYear  = TODAY.getFullYear();
let calMonth = TODAY.getMonth();
let calSel   = localDateStr(TODAY);
let calView  = 'month';
const calScrollPositions = { year: 0, month: 0, week: 0 };
let hasAutoScrolled = false;
let hasAutoScrolledWeekView = false;
let calMainScrollBound = false;
const CAL_MONTH_SPAN = 18;
const CAL_WEEK_SPAN  = 24;

function monthStartDate(year, month){ return new Date(year, month, 1); }
function addMonths(date, amount){ return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function addDays(date, amount){ const d = new Date(date); d.setDate(d.getDate() + amount); return d; }
function startOfWeek(date){
  const d = new Date(date);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  d.setHours(0,0,0,0);
  return d;
}
function fmtMonthYear(date){ return date.toLocaleDateString('en-AU',{month:'long',year:'numeric'}); }
function fmtWeekRange(monday){
  const sunday = addDays(monday, 6);
  return `Week of ${monday.toLocaleDateString('en-AU',{day:'numeric',month:'short'})} — ${sunday.toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})}`;
}
function updateCalHeaderLabel(text){
  const label = document.getElementById('cal-month-label');
  if(label) label.textContent = text;
}
function getCalMain(){ return document.getElementById('cal-main'); }

function withCalInstantScroll(callback){
  const main = getCalMain();
  if(!main){ callback?.(); return; }
  const prev = main.style.scrollBehavior;
  main.style.scrollBehavior = 'auto';
  callback?.();
  main.style.scrollBehavior = prev;
}

function saveCalScrollPosition(){
  const main = getCalMain();
  if(!main) return;
  calScrollPositions[calView] = main.scrollTop || 0;
}

function restoreCalScrollPosition(view = calView){
  const main = getCalMain();
  if(!main) return false;
  const savedTop = calScrollPositions[view];
  if(typeof savedTop !== 'number') return false;
  main.scrollTop = Math.max(0, savedTop);
  return true;
}

function updateCalendarSelection(){
  document
    .querySelectorAll('#cal-main .cal-day, #cal-main .cal-week-day, #cal-main .cal-mini-day')
    .forEach(el => el.classList.toggle('selected', el.dataset.date === calSel));
}

function selectCalendarDate(dateStr){
  const d = parseDate(dateStr);
  if(!d) return;
  calSel = dateStr;
  calYear = d.getFullYear();
  calMonth = d.getMonth();
  updateCalendarSelection();
  showCalPanel(dateStr);
}

function sizeCalendarMonthBlocks(){
  const main = getCalMain();
  if(!main) return;
  const list = main.querySelector('.cal-scroller-list');
  if(!list) return;

  const listStyles = getComputedStyle(list);
  const padTop = parseFloat(listStyles.paddingTop) || 0;
  const padBottom = parseFloat(listStyles.paddingBottom) || 0;
  const visibleHeight = Math.max(420, main.clientHeight - padTop - padBottom);

  main.querySelectorAll('.cal-month-block').forEach(block=>{
    const header = block.querySelector('.cal-block-header');
    const dow = block.querySelector('.cal-dow-row');
    const weeksWrap = block.querySelector('.cal-weeks');
    const weeks = [...block.querySelectorAll('.cal-week')];
    if(!header || !dow || !weeksWrap || !weeks.length) return;

    const headerH = header.offsetHeight;
    const dowH = dow.offsetHeight;
    const borderAdjust = 2;
    const rowH = Math.floor((visibleHeight - headerH - dowH - borderAdjust) / weeks.length);

    block.style.height = `${visibleHeight}px`;
    weeksWrap.style.height = `${rowH * weeks.length}px`;
    weeks.forEach(week=>{
      week.style.height = `${rowH}px`;
    });
  });
}
let calMonthResizeBound = false;
function bindCalendarResize(){
  if(calMonthResizeBound) return;
  window.addEventListener('resize', ()=>{
    if(calView === 'month') sizeCalendarMonthBlocks();
  }, { passive:true });
  calMonthResizeBound = true;
}
function getCalendarMap(){
  const ByDate = {}, hwByDate = {};
  state.assessments.forEach(a=>{ if(a.date){ if(!ByDate[a.date]) ByDate[a.date]=[]; ByDate[a.date].push(a); } });
  (state.homework||[]).forEach(hw=>{ if(hw.date){ if(!hwByDate[hw.date]) hwByDate[hw.date]=[]; hwByDate[hw.date].push(hw); } });
  return { ByDate, hwByDate };
}
function setCalSelectedDate(dateStr){
  selectCalendarDate(dateStr);
}
function resetCalendarToTodayContext(){
  calYear = TODAY.getFullYear();
  calMonth = TODAY.getMonth();
  calSel = localDateStr(TODAY);
}

function calSetView(view){
  if(view !== 'year' && view !== 'month' && view !== 'week') return;
  if(view === calView) return;
  saveCalScrollPosition();
  calView = view;
  const selected = calSel ? parseDate(calSel) : null;
  const anchor = selected || TODAY;
  calYear = anchor.getFullYear();
  calMonth = anchor.getMonth();
  calSel = localDateStr(anchor);

  buildCalendar(
    view === 'year'
      ? { restoreScroll: false, scrollToSelection: false }
      : { restoreScroll: false, scrollToSelection: true, autoScroll: false }
  );
}
function syncCalViewButtons(){
  const yearBtn  = document.getElementById('cal-view-year');
  const monthBtn = document.getElementById('cal-view-month');
  const weekBtn  = document.getElementById('cal-view-week');
  if(yearBtn)  yearBtn.classList.toggle('active',  calView === 'year');
  if(monthBtn) monthBtn.classList.toggle('active', calView === 'month');
  if(weekBtn)  weekBtn.classList.toggle('active',  calView === 'week');
}
function buildCalendar(opts={}){
  if(opts.preserveScroll){
    opts = { ...opts, restoreScroll: true, scrollToSelection: false };
  } else if(opts.scrollToSelection === undefined && opts.restoreScroll === undefined){
    opts = hasAutoScrolled
      ? { ...opts, restoreScroll: true, scrollToSelection: false }
      : { ...opts, scrollToSelection: true, autoScroll: false };
  }

  syncCalViewButtons();
  if(calView === 'year') renderCalYearView(opts);
  else if(calView === 'month') renderCalMonthScroller(opts);
  else renderCalWeekScroller(opts);
  if(calSel) showCalPanel(calSel);
}
function calNav(dir){
  if(calView === 'year'){
    calYear += dir;
    renderCalYearView({ scrollToSelection:false });
  } else if(calView === 'month'){
    const anchor = monthStartDate(calYear, calMonth);
    const target = addMonths(anchor, dir);
    calYear = target.getFullYear();
    calMonth = target.getMonth();
    scrollCalendarToTarget(
      { type:'month', key:`${calYear}-${String(calMonth+1).padStart(2,'0')}` },
      { animate:false }
    );
    updateCalHeaderLabel(fmtMonthYear(target));
  } else {
    const base = calSel ? parseDate(calSel) : TODAY;
    const monday = startOfWeek(addDays(base, dir * 7));
    const target = addDays(monday, Math.min(base.getDay() === 0 ? 6 : base.getDay()-1, 6));
    calYear = target.getFullYear();
    calMonth = target.getMonth();
    calSel = localDateStr(target);
    scrollCalendarToTarget(
      { type:'week', key: localDateStr(monday) },
      { animate:false }
    );
    updateCalHeaderLabel(fmtWeekRange(monday));
    showCalPanel(calSel);
  }
}
function calToday(){
  calYear = TODAY.getFullYear();
  calMonth = TODAY.getMonth();
  calSel = localDateStr(TODAY);
  calScrollPositions[calView] = 0;
  buildCalendar({ scrollToSelection: true, autoScroll: false });
  showCalPanel(calSel);
}
function createYearMonthCard(year, month, maps){
  const card = document.createElement('section');
  card.className = 'cal-year-card';
  card.dataset.year = String(year);
  card.dataset.month = String(month);
  card.dataset.key = `${year}-${String(month+1).padStart(2,'0')}`;

  const header = document.createElement('div');
  header.className = 'cal-block-header';
  header.textContent = new Date(year, month, 1).toLocaleDateString('en-AU', { month:'long' });
  card.appendChild(header);

  const dowRow = document.createElement('div');
  dowRow.className = 'cal-mini-dow-row';
  ['M','T','W','T','F','S','S'].forEach(d=>{
    const el = document.createElement('div');
    el.className = 'cal-mini-dow';
    el.textContent = d;
    dowRow.appendChild(el);
  });
  card.appendChild(dowRow);

  const grid = document.createElement('div');
  grid.className = 'cal-mini-grid';
  const todayStr = localDateStr(TODAY);
  const cells = buildMonthMatrix(year, month);

  cells.forEach(item=>{
    const asmts = maps.ByDate[item.dateStr] || [];
    const hws   = maps.hwByDate[item.dateStr] || [];
    const day = document.createElement('button');
    day.type = 'button';
    day.className = 'cal-mini-day'
      + (item.isOther ? ' other-month' : '')
      + (item.dateStr === todayStr ? ' today' : '')
      + (item.dateStr === calSel ? ' selected' : '')
      + (asmts.length ? ' has-assessment' : '')
      + (hws.length ? ' has-homework' : '');
    day.textContent = item.day;
    day.title = item.dateStr;
    day.dataset.date = item.dateStr;
    day.addEventListener('click', ()=>{
      selectCalendarDate(item.dateStr);
    });
    grid.appendChild(day);
  });

  card.appendChild(grid);
  return card;
}
function renderCalYearView(opts={}){
  calMainScrollBound = false;
  const main = getCalMain();
  main.innerHTML = '';
  main.classList.add('cal-scroller-main');
  const maps = getCalendarMap();
  const grid = document.createElement('div');
  grid.className = 'cal-year-grid';
  for(let month = 0; month < 12; month++){
    grid.appendChild(createYearMonthCard(calYear, month, maps));
  }
  main.appendChild(grid);

  if(opts.restoreScroll){
    withCalInstantScroll(() => restoreCalScrollPosition('year'));
  } else {
    withCalInstantScroll(() => { main.scrollTop = 0; });
  }

  updateCalHeaderLabel(String(calYear));
}
function bindCalMainScroll(type){
  const main = getCalMain();
  if(!main) return;
  if(main._calScrollHandler) main.removeEventListener('scroll', main._calScrollHandler);
  const handler = ()=>{
    calScrollPositions[calView] = main.scrollTop || 0;
    const blocks = [...main.querySelectorAll(type === 'month' ? '.cal-month-block' : '.cal-week-block')];
    if(!blocks.length) return;
    const mainRect = main.getBoundingClientRect();
    const pivot = mainRect.top + 120;
    let nearest = blocks[0], nearestDist = Infinity;
    blocks.forEach(block=>{
      const rect = block.getBoundingClientRect();
      const dist = Math.abs(rect.top - pivot);
      if(dist < nearestDist){ nearest = block; nearestDist = dist; }
    });
    if(type === 'month'){
      calYear = Number(nearest.dataset.year);
      calMonth = Number(nearest.dataset.month);
      updateCalHeaderLabel(nearest.dataset.label);
    } else {
      const monday = parseDate(nearest.dataset.weekStart);
      if(monday){
        updateCalHeaderLabel(fmtWeekRange(monday));
        calYear = monday.getFullYear();
        calMonth = monday.getMonth();
      }
    }
  };
  main.addEventListener('scroll', handler, { passive:true });
  main._calScrollHandler = handler;
  calMainScrollBound = true;
}
function scrollCalendarToTarget(target, { animate = false } = {}){
  const main = getCalMain();
  if(!main) return;
  let selector = '';
  if(target.type === 'month') selector = `.cal-month-block[data-key="${target.key}"]`;
  if(target.type === 'week') selector = `.cal-week-block[data-week-start="${target.key}"]`;
  const el = main.querySelector(selector);
  if(!el) return;
  const top = Math.max(0, el.offsetTop - 14);
  main.scrollTo({ top, behavior: animate ? 'smooth' : 'auto' });
}
function buildMonthMatrix(year, month){
  let startDow = new Date(year, month, 1).getDay() - 1;
  if(startDow < 0) startDow = 6;
  const daysInM = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const total = Math.ceil((startDow + daysInM) / 7) * 7;
  const cells = [];
  for(let cell=0; cell<total; cell++){
    let day, isOther=false, mon=month, yr=year;
    if(cell < startDow){ day = daysInPrev - startDow + cell + 1; mon = month - 1; isOther = true; if(mon < 0){ mon = 11; yr--; } }
    else if(cell - startDow < daysInM){ day = cell - startDow + 1; }
    else { day = cell - startDow - daysInM + 1; mon = month + 1; isOther = true; if(mon > 11){ mon = 0; yr++; } }
    const dateStr = `${yr}-${String(mon+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    cells.push({ day, dateStr, isOther, year:yr, month:mon });
  }
  return cells;
}
function createMonthBlock(anchorDate, maps){
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const block = document.createElement('section');
  const key = `${year}-${String(month+1).padStart(2,'0')}`;
  block.className = 'cal-month-block';
  block.dataset.key = key;
  block.dataset.year = year;
  block.dataset.month = month;
  block.dataset.label = fmtMonthYear(anchorDate);

  const header = document.createElement('div');
  header.className = 'cal-block-header';
  header.textContent = fmtMonthYear(anchorDate);
  block.appendChild(header);

  const dowRow = document.createElement('div');
  dowRow.className='cal-dow-row';
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d=>{
    const el=document.createElement('div'); el.className='cal-dow'; el.textContent=d; dowRow.appendChild(el);
  });
  block.appendChild(dowRow);

  const weeks = document.createElement('div');
  weeks.className='cal-weeks';
  const todayStr = localDateStr(TODAY);
  const cells = buildMonthMatrix(year, month);
  let weekEl = null;
  cells.forEach((item, idx)=>{
    if(idx % 7 === 0){ weekEl = document.createElement('div'); weekEl.className = 'cal-week'; weeks.appendChild(weekEl); }
    const asmts = maps.ByDate[item.dateStr] || [];
    const hws   = maps.hwByDate[item.dateStr] || [];
    const dayEl = document.createElement('button');
    dayEl.type='button';
    dayEl.className='cal-day'+(item.isOther?' other-month':'')+(item.dateStr===todayStr?' today':'')+(item.dateStr===calSel?' selected':'')+(asmts.length?' has-assessment':'')+(hws.length?' has-homework':'');
    dayEl.innerHTML = `<div class="cal-day-num-row"><div class="cal-day-num">${item.day}</div>${asmts.length?`<div class="cal-day-count">${asmts.length}</div>`:''}</div>`;

    const eventsEl = document.createElement('div');
    eventsEl.className='cal-events';
    asmts.slice(0,2).forEach(a=>{
      const subj=getSubject(a.subjectId);
      const pill=document.createElement('div');
      pill.className='cal-pill';
      pill.style.background=subj.color;
      pill.title=`${subj.name}: ${a.title}`;
      pill.textContent=a.title.length>18?a.title.slice(0,17)+'…':a.title;
      eventsEl.appendChild(pill);
    });
    if(asmts.length>2){ const more=document.createElement('div'); more.className='cal-more'; more.textContent=`+${asmts.length-2}`; eventsEl.appendChild(more); }
    if(hws.length){
      const dotsRow=document.createElement('div'); dotsRow.className='cal-hw-dots';
      hws.slice(0,6).forEach(hw=>{
        const dot=document.createElement('span'); dot.className='cal-hw-dot';
        dot.style.background={urgent:'var(--red)',high:'var(--amber)',normal:'var(--t2)'}[hw.priority]||'var(--t2)';
        dot.title=hw.task;
        dotsRow.appendChild(dot);
      });
      eventsEl.appendChild(dotsRow);
    }
    dayEl.appendChild(eventsEl);
    dayEl.dataset.date = item.dateStr;
    dayEl.addEventListener('click', ()=> selectCalendarDate(item.dateStr));
    weekEl.appendChild(dayEl);
  });
  block.appendChild(weeks);
  return block;
}
function renderCalMonthScroller(opts={}){
  calMainScrollBound = false;
  const main = getCalMain();
  main.innerHTML='';
  main.classList.add('cal-scroller-main');
  const maps = getCalendarMap();
  const list = document.createElement('div');
  list.className = 'cal-scroller-list';
  const selectedDate = calSel ? parseDate(calSel) : TODAY;
  const centerMonth = monthStartDate(selectedDate.getFullYear(), selectedDate.getMonth());
  for(let offset = -6; offset <= CAL_MONTH_SPAN - 7; offset++){
    list.appendChild(createMonthBlock(addMonths(centerMonth, offset), maps));
  }
  main.appendChild(list);
  bindCalMainScroll('month');
  bindCalendarResize();
  requestAnimationFrame(()=>{
    sizeCalendarMonthBlocks();
    const targetKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}`;

    if(opts.restoreScroll){
      withCalInstantScroll(() => restoreCalScrollPosition('month'));
    } else if(opts.scrollToSelection !== false){
      scrollCalendarToTarget({ type:'month', key:targetKey }, { animate:false });
      hasAutoScrolled = true;
    } else {
      withCalInstantScroll(() => { main.scrollTop = 0; });
    }

    updateCalHeaderLabel(fmtMonthYear(selectedDate));
  });
}
function createWeekBlock(monday, maps){
  const block = document.createElement('section');
  block.className = 'cal-week-block';
  block.dataset.weekStart = localDateStr(monday);

  const header = document.createElement('div');
  header.className = 'cal-block-header';
  header.textContent = fmtWeekRange(monday);
  block.appendChild(header);

  const dowRow = document.createElement('div');
  dowRow.className='cal-dow-row';
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d=>{
    const el=document.createElement('div'); el.className='cal-dow'; el.textContent=d; dowRow.appendChild(el);
  });
  block.appendChild(dowRow);

  const grid = document.createElement('div');
  grid.className = 'cal-week-grid';
  const todayStr = localDateStr(TODAY);
  for(let i=0;i<7;i++){
    const d = addDays(monday, i);
    const dateStr = localDateStr(d);
    const asmts = maps.ByDate[dateStr] || [];
    const hws   = maps.hwByDate[dateStr] || [];
    const col = document.createElement('button');
    col.type='button';
    col.className='cal-week-day'+(dateStr===todayStr?' today':'')+(dateStr===calSel?' selected':'')+(asmts.length?' has-assessment':'')+(hws.length?' has-homework':'');
    col.dataset.date = dateStr;
    col.innerHTML = `<div class="cal-week-head"><span class="cal-week-dow">${d.toLocaleDateString('en-AU',{weekday:'short'})}</span><span class="cal-week-date">${d.toLocaleDateString('en-AU',{day:'numeric',month:'short'})}</span></div>`;
    const content=document.createElement('div');
    content.className='cal-week-content';
    asmts.forEach(a=>{
      const subj=getSubject(a.subjectId);
      const pill=document.createElement('div');
      pill.className='cal-pill cal-week-pill';
      pill.style.background=subj.color;
      pill.textContent=a.title;
      pill.title=`${subj.name}: ${a.title}`;
      pill.addEventListener('click', e=>{ e.stopPropagation(); openDetailModal(a.id); });
      content.appendChild(pill);
    });
    hws.forEach(hw=>{
      const row=document.createElement('div');
      row.className='cal-week-hw';
      const priCol={urgent:'var(--red)',high:'var(--amber-soft)',normal:'var(--t3)'}[hw.priority]||'var(--t3)';
      row.innerHTML=`<span class="cal-week-hw-dot" style="background:${priCol}"></span><span class="cal-week-hw-text">${hw.task}</span>`;
      content.appendChild(row);
    });
    if(!asmts.length && !hws.length){ const empty=document.createElement('div'); empty.className='cal-week-empty'; empty.textContent='Nothing here'; content.appendChild(empty); }
    col.appendChild(content);
    col.addEventListener('click', ()=> selectCalendarDate(dateStr));
    grid.appendChild(col);
  }
  block.appendChild(grid);
  return block;
}
function renderCalWeekScroller(opts={}){
  calMainScrollBound = false;
  const main = getCalMain();
  main.innerHTML='';
  main.classList.add('cal-scroller-main');
  const maps = getCalendarMap();
  const list = document.createElement('div');
  list.className = 'cal-scroller-list cal-week-list';
  const selectedDate = calSel ? parseDate(calSel) : TODAY;
  const centerWeek = startOfWeek(selectedDate);
  for(let offset=-8; offset<=CAL_WEEK_SPAN-9; offset++){
    list.appendChild(createWeekBlock(addDays(centerWeek, offset*7), maps));
  }
  main.appendChild(list);
  bindCalMainScroll('week');
  requestAnimationFrame(()=>{
    if(opts.restoreScroll){
      withCalInstantScroll(() => restoreCalScrollPosition('week'));
    } else if(opts.scrollToSelection !== false){
      scrollCalendarToTarget({ type:'week', key: localDateStr(centerWeek) }, { animate:false });
      hasAutoScrolled = true;
      hasAutoScrolledWeekView = true;
    } else {
      withCalInstantScroll(() => { main.scrollTop = 0; });
    }
    updateCalHeaderLabel(fmtWeekRange(centerWeek));
  });
}
function showCalPanel(dateStr){
  const panel = document.getElementById('cal-panel');
  const d = parseDate(dateStr);
  if(!d){ panel.innerHTML='<div class="cal-panel-empty">Select a day</div>'; return; }
  const dateLabel = d.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const asmts = state.assessments.filter(a=>a.date===dateStr);
  const hws   = (state.homework||[]).filter(hw=>hw.date===dateStr);
  let html = `<div class="cal-detail-date">${dateLabel}</div>`;
  if(!asmts.length&&!hws.length) html+=`<div class="cal-panel-empty">Nothing on this day</div>`;
  if(asmts.length){
    html+=`<div class="cal-sec-title">Assessments</div>`;
    asmts.forEach(a=>{
      const subj=getSubject(a.subjectId); const done=isCompleted(a);
      html+=`<div class="cal-detail-item" onclick="openDetailModal('${a.id}')">
        <div class="cal-detail-dot" style="background:${subj.color}"></div>
        <div><div class="cal-detail-title">${a.title}</div><div class="cal-detail-meta">${subj.name} · ${cap(a.type)}${a.weighting?` · ${a.weighting}%`:''}${done?' · 🏁 Done':''}</div></div>
      </div>`;
    });
  }
  if(hws.length){
    html+=`<div class="cal-sec-title" style="margin-top:${asmts.length?'10px':'0'}">Homework</div>`;
    hws.forEach(hw=>{
      const subj=getSubject(hw.subjectId);
      const priClass = `priority-${hw.priority || 'normal'}`;
      html+=`<div class="cal-hw-item readonly">
        <div class="cal-hw-mark ${priClass}${hw.done?' done':''}" aria-hidden="true"></div>
        <span class="cal-hw-text ${hw.done?'done':''}">${hw.task}</span>
        <span class="cal-hw-subject-chip">${subj.name}</span>
      </div>`;
    });
  }
  panel.innerHTML=html;
}
function toggleHwCal(id){ return; }

// ── ASSESSMENT MODAL ──────────────────────────────────────────────
function openAddAssessment(id=null){
  const sel=document.getElementById('form-subject');
  sel.innerHTML='<option value="">Select…</option>';
  state.subjects.forEach(s=>{ const o=document.createElement('option'); o.value=s.id; o.textContent=s.name; sel.appendChild(o); });
  if(id){
    const a=state.assessments.find(x=>x.id===id); if(!a) return;
    document.getElementById('modal-title').textContent='Edit Assessment';
    document.getElementById('form-id').value       =id;
    document.getElementById('form-subject').value  =a.subjectId;
    document.getElementById('form-type').value     =a.type;
    document.getElementById('form-title').value    =a.title;
    document.getElementById('form-date').value     =a.date;
    document.getElementById('form-weighting').value=a.weighting||'';
    document.getElementById('form-topic').value    =a.topic||'';
    document.getElementById('form-syllabus').value =a.syllabus||'';
    document.getElementById('form-difficulty').value=a.difficulty;
    document.getElementById('form-notes').value    =a.notes||'';
  } else {
    document.getElementById('modal-title').textContent='Add Assessment';
    ['form-id','form-title','form-weighting','form-topic','form-syllabus','form-notes'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('form-type').value     ='test';
    document.getElementById('form-difficulty').value='moderate';
    document.getElementById('form-subject').value  ='';
    document.getElementById('form-date').value     ='';
  }
  document.getElementById('modal-assessment').classList.remove('hidden');
}

function saveAssessment(){
  const id   =document.getElementById('form-id').value;
  const sid  =document.getElementById('form-subject').value;
  const title=document.getElementById('form-title').value.trim();
  const date =document.getElementById('form-date').value;
  if(!sid||!title||!date){ alert('Please fill in Subject, Title, and Date.'); return; }
  const data={
    subjectId:sid, title, type:document.getElementById('form-type').value, date,
    weighting:parseFloat(document.getElementById('form-weighting').value)||null,
    topic:document.getElementById('form-topic').value.trim(),
    syllabus:document.getElementById('form-syllabus').value.trim(),
    difficulty:document.getElementById('form-difficulty').value,
    notes:document.getElementById('form-notes').value.trim(),
  };
  if(id){
    const idx=state.assessments.findIndex(a=>a.id===id);
    if(idx!==-1) state.assessments[idx]={...state.assessments[idx],...data};
  } else {
    state.assessments.push({...data,id:'asmnt_'+Date.now(),createdAt:new Date().toISOString(),progress:'not_started',completed:false,mark:'',outOf:''});
  }
  normaliseAssessments(); saveState(); closeModal('modal-assessment'); refreshCurrentView();
  if(getCurrentView()==='calendar') buildCalendar();
}

// ── DETAIL MODAL ──────────────────────────────────────────────────
// KEY CHANGE: "Ready ✓" is just a progress indicator — does NOT complete the assessment
// "Mark as Done" is a separate button in the footer that actually completes it
function openDetailModal(id){
  const a=state.assessments.find(x=>x.id===id); if(!a) return;
  const subj  =getSubject(a.subjectId);
  const days  =daysUntil(a.date);
  const done  =isCompleted(a);
  const lead  =revStartDays(a);
  const syl   =(a.syllabus||'').split('\n').filter(Boolean);

  document.getElementById('detail-title').textContent=a.title;
  // No edit button at top — it's been removed per request
  // Delete button is at the bottom

  // Progress buttons — "Ready ✓" just marks progress, does NOT complete
  const progBtns = done ? '' : `
    <div class="detail-sec">Progress</div>
    <div class="prog-btns">${['not_started','in_progress','revised_once','mostly_prepared','ready']
      .map(p=>`<button class="prog-btn ${a.progress===p?'on':''}" onclick="updateProgress('${id}','${p}')">${getProgressLabel(p)}</button>`)
      .join('')}</div>`;

  const sylHtml = syl.length
    ? `<ul class="syl-list">${syl.map(s=>`<li class="syl-item">${s}</li>`).join('')}</ul>`
    : `<div style="color:var(--t3);font-size:12px">No syllabus points added.</div>`;

  // Mark entry block — only shown when done
  const resultBlock = done ? `
    <div class="detail-sec">Result</div>
    <div class="result-block">
      <div style="font-weight:600;color:var(--t1)">🏁 Completed
        <span style="font-family:'Space Mono',monospace;font-weight:400;font-size:11.5px;color:var(--t2);margin-left:10px">${a.mark!==''&&a.outOf!==''?`${a.mark} / ${a.outOf}`:'No mark recorded'}</span>
      </div>
      <div class="result-row">
        <div><div class="detail-lbl" style="margin-bottom:5px">Mark</div><input id="detail-mark" class="finput" type="number" min="0" placeholder="e.g. 78" value="${a.mark??''}"></div>
        <div><div class="detail-lbl" style="margin-bottom:5px">Out of</div><input id="detail-outof" class="finput" type="number" min="1" placeholder="e.g. 100" value="${a.outOf??''}"></div>
        <button class="btn btn-outline btn-sm" onclick="saveResult('${id}')">Save</button>
      </div>
    </div>` : '';

  document.getElementById('detail-body').innerHTML=`
    <div class="detail-grid">
      <div class="detail-cell"><div class="detail-lbl">Subject</div><div class="detail-val" style="color:${subj.color}">${subj.name}</div></div>
      <div class="detail-cell"><div class="detail-lbl">Type</div><div class="detail-val">${cap(a.type)}</div></div>
      <div class="detail-cell"><div class="detail-lbl">Due Date</div><div class="detail-val">${fmtDate(a.date)}</div></div>
      <div class="detail-cell"><div class="detail-lbl">Days Away</div><div class="detail-val" style="color:var(--${done?'green':daysColour(days)})">${done?'🏁 Done':daysLabel(days)}</div></div>
      <div class="detail-cell"><div class="detail-lbl">Weighting</div><div class="detail-val">${a.weighting?a.weighting+'%':'—'}</div></div>
      <div class="detail-cell"><div class="detail-lbl">Difficulty</div><div class="detail-val">${cap(a.difficulty)}</div></div>
      <div class="detail-cell detail-cell-wide"><div class="detail-lbl">Revision Start</div><div class="detail-val" style="font-size:13px">${done?'Assessment completed.':`${lead} days before — ${shouldHaveStarted(a)?'⚡ Should be underway now':'Not yet'}`}</div></div>
    </div>

    ${a.topic?`<div class="detail-sec">Topic</div><div style="font-size:13px;color:var(--t1);line-height:1.55">${a.topic}</div>`:''}

    <div class="detail-sec">Syllabus Points</div>
    ${sylHtml}

    ${progBtns}
    ${resultBlock}

    ${a.notes?`<div class="detail-sec">Notes</div><div class="notes-box">${a.notes}</div>`:''}

    <div class="detail-foot">
      <div class="detail-foot-left">
        <a class="venr-action-btn" href="venr.html" target="_blank">▶ Open in Venr</a>
        <button class="btn btn-outline btn-sm" onclick="openAddAssessment('${id}');closeModal('modal-detail')">✎ Edit</button>
      </div>
      <div class="detail-foot-right">
        ${!done ? `<button class="btn btn-primary btn-sm" onclick="markDone('${id}')">Mark as Done ✓</button>` : ''}
        <button class="btn-danger-sm" onclick="deleteAssessment('${id}')">Delete</button>
      </div>
    </div>`;

  document.getElementById('modal-detail').classList.remove('hidden');
}

// "Ready ✓" in progress buttons — just updates progress status, does NOT complete
function updateProgress(id, progress){
  const idx=state.assessments.findIndex(a=>a.id===id);
  if(idx!==-1){
    state.assessments[idx].progress=progress;
    // NOTE: setting "ready" here does NOT set completed=true
    // completed is only set by markDone() or auto-completion at due date
    saveState(); openDetailModal(id); refreshCurrentView();
  }
}

// Explicit "Mark as Done" button
function markDone(id){
  const idx=state.assessments.findIndex(a=>a.id===id);
  if(idx===-1) return;
  if(!confirm('Mark this assessment as fully done? You can still edit it after.')) return;
  state.assessments[idx].completed=true;
  state.assessments[idx].progress='ready';
  saveState(); openDetailModal(id); refreshCurrentView();
  if(getCurrentView()==='calendar') buildCalendar();
}

function saveResult(id){
  const idx=state.assessments.findIndex(a=>a.id===id);
  if(idx===-1) return;
  state.assessments[idx].mark  =document.getElementById('detail-mark')?.value??'';
  state.assessments[idx].outOf =document.getElementById('detail-outof')?.value??'';
  state.assessments[idx].completed=true;
  state.assessments[idx].progress='ready';
  saveState(); openDetailModal(id); refreshCurrentView();
}

function deleteAssessment(id){
  if(!confirm('Delete this assessment?')) return;
  state.assessments=state.assessments.filter(a=>a.id!==id);
  saveState(); closeModal('modal-detail'); refreshCurrentView();
  if(getCurrentView()==='calendar') buildCalendar();
}

function closeModal(id){ document.getElementById(id).classList.add('hidden'); }

// ── SUBJECT MODALS ────────────────────────────────────────────────
function openAddSubjectModal(){
  document.getElementById('subj-edit-id').value='';
  document.getElementById('subj-name').value='';
  document.getElementById('subj-color').value='#5b8dee';
  document.getElementById('subj-priority').value='1';
  document.getElementById('subj-modal-title').textContent='Add Subject';
  document.getElementById('subj-save-btn').textContent='Add Subject';
  document.getElementById('modal-subject').classList.remove('hidden');
}
function openEditSubjectModal(sid){
  const subj=state.subjects.find(s=>s.id===sid); if(!subj) return;
  document.getElementById('subj-edit-id').value=sid;
  document.getElementById('subj-name').value=subj.name;
  document.getElementById('subj-color').value=subj.color;
  document.getElementById('subj-priority').value=String(subj.priority||1);
  document.getElementById('subj-modal-title').textContent='Edit Subject';
  document.getElementById('subj-save-btn').textContent='Save Changes';
  document.getElementById('modal-subject').classList.remove('hidden');
}
function saveSubject(){
  const name=document.getElementById('subj-name').value.trim();
  if(!name){ alert('Please enter a subject name.'); return; }
  const eid=document.getElementById('subj-edit-id').value;
  const color=document.getElementById('subj-color').value;
  const prio=parseFloat(document.getElementById('subj-priority').value);
  if(eid){ const idx=state.subjects.findIndex(s=>s.id===eid); if(idx!==-1) state.subjects[idx]={...state.subjects[idx],name,color,priority:prio}; }
  else state.subjects.push({id:'sub_'+Date.now(),name,color,priority:prio});
  saveState(); closeModal('modal-subject'); buildSubjectsView();
}
function deleteSubject(sid){
  const subj=state.subjects.find(s=>s.id===sid); if(!subj) return;
  const hasA=state.assessments.some(a=>a.subjectId===sid);
  if(!confirm(`Delete "${subj.name}"?${hasA?'\nThis also removes all its assessments.':''}`)) return;
  state.subjects=state.subjects.filter(s=>s.id!==sid);
  state.assessments=state.assessments.filter(a=>a.subjectId!==sid);
  state.homework=(state.homework||[]).filter(h=>h.subjectId!==sid);
  saveState(); buildSubjectsView();
}

// ── SETTINGS ──────────────────────────────────────────────────────
function loadSettingsUI(){
  const s=state.settings;
  document.getElementById('pref-lead-easy').value    =s.leadEasy;
  document.getElementById('pref-lead-moderate').value=s.leadModerate;
  document.getElementById('pref-lead-hard').value    =s.leadHard;
  const sb=document.getElementById('theme-settings-btn');
  if(sb) sb.textContent=state.theme==='dark'?'Switch to Light':'Switch to Dark';
}
function saveSettings(){
  state.settings={
    ...state.settings,
    leadEasy:    parseInt(document.getElementById('pref-lead-easy').value)||3,
    leadModerate:parseInt(document.getElementById('pref-lead-moderate').value)||10,
    leadHard:    parseInt(document.getElementById('pref-lead-hard').value)||21,
    criticalDays:7, warningDays:21,
  };
  saveState();
  const msg=document.getElementById('settings-saved-msg');
  msg.classList.remove('hidden'); setTimeout(()=>msg.classList.add('hidden'),2000);
}

// ── DATA ──────────────────────────────────────────────────────────
function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=Object.assign(document.createElement('a'),{href:url,download:`ewgh-${localDateStr(new Date())}.json`});
  a.click(); URL.revokeObjectURL(url);
  showToast('Data exported ✓', 'success');
}

function triggerImport(){
  document.getElementById('import-file-input').click();
}

function importData(event){
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try {
      const parsed = JSON.parse(e.target.result);
      // Validate it looks like an Ewgh export
      if(!parsed.subjects && !parsed.assessments){
        showToast('Invalid Ewgh JSON file', 'error'); return;
      }
      if(!confirm('Import this data? This will replace your current Ewgh data.')) return;
      // Merge carefully — preserve structure
      state.subjects    = parsed.subjects    || state.subjects;
      state.assessments = parsed.assessments || state.assessments;
      state.homework    = parsed.homework    || state.homework;
      state.wsTasks     = parsed.wsTasks     || state.wsTasks;
      state.wsNotes     = parsed.wsNotes     || state.wsNotes;
      state.prepData    = parsed.prepData    || state.prepData;
      if(parsed.settings) state.settings = { ...state.settings, ...parsed.settings };
      if(parsed.theme)    applyTheme(parsed.theme);
      normaliseAssessments();
      saveState();
      refreshCurrentView();
      loadSettingsUI();
      showToast(`Imported: ${state.subjects.length} subjects, ${state.assessments.length} assessments ✓`, 'success');
    } catch(err){
      showToast('Could not parse JSON file', 'error');
    }
    // Reset the input so the same file can be re-imported if needed
    event.target.value = '';
  };
  reader.readAsText(file);
}

let _toastTimer = null;
function showToast(msg, type=''){
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.className = 'toast' + (type ? ` toast-${type}` : '');
  el.classList.remove('hidden','leaving');
  if(_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(()=>{
    el.classList.add('leaving');
    setTimeout(()=>el.classList.add('hidden'), 250);
  }, 3200);
}
function confirmReset(){
  if(confirm('Reset ALL Ewgh data?')){ localStorage.removeItem(STORAGE_KEY); location.reload(); }
}

// ── NAVIGATION ────────────────────────────────────────────────────
function getCurrentView(){
  const v=document.querySelector('.view.active');
  return v ? v.id.replace('view-','') : 'dashboard';
}
function refreshCurrentView(){
  const v=getCurrentView();
  if(v==='dashboard')   buildDashboard();
  if(v==='assessments') buildAssessmentsView();
  if(v==='subjects')    buildSubjectsView();
  if(v==='homework')    buildHomeworkView();
  if(v==='workspace')   buildWorkspaceView();
  if(v==='calendar')    buildCalendar();
}
function switchView(name){
  if(getCurrentView()==='calendar' && name!=='calendar') saveCalScrollPosition();
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active','switching'));
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
  const viewEl = document.getElementById(`view-${name}`);
  if(viewEl){
    viewEl.classList.add('active','switching');
    // Remove .switching after the animation so inner re-renders don't replay it
    viewEl.addEventListener('animationend', ()=>viewEl.classList.remove('switching'), {once:true});
  }
  document.querySelector(`[data-view="${name}"]`)?.classList.add('active');
  if(name==='dashboard')   buildDashboard();
  if(name==='assessments') buildAssessmentsView();
  if(name==='subjects')    buildSubjectsView();
  if(name==='homework')    buildHomeworkView();
  if(name==='workspace')   buildWorkspaceView();
  if(name==='calendar'){
    const selected = calSel ? parseDate(calSel) : null;
    const anchor = selected || TODAY;
    calYear = anchor.getFullYear();
    calMonth = anchor.getMonth();
    calSel = localDateStr(anchor);
    buildCalendar({
      restoreScroll: calView === 'year',
      scrollToSelection: calView !== 'year',
      autoScroll: false
    });
  }
  if(name==='settings')    loadSettingsUI();
  document.querySelector('.main').scrollTop=0;
}

// ── EVENTS ────────────────────────────────────────────────────────
document.getElementById('filter-subject').addEventListener('change', buildAssessmentsView);
document.getElementById('filter-type').addEventListener('change',    buildAssessmentsView);
const _hwFilterEl = document.getElementById('hw-filter-subject'); if(_hwFilterEl) _hwFilterEl.addEventListener('change', buildHomeworkView);

document.querySelectorAll('.nav-item').forEach(btn=>
  btn.addEventListener('click', ()=>switchView(btn.dataset.view))
);
document.querySelectorAll('.overlay').forEach(o=>
  o.addEventListener('click', e=>{ if(e.target===o) o.classList.add('hidden'); })
);

// ── INIT ──────────────────────────────────────────────────────────
loadState();
buildDashboard();

// ===== Redesign overrides =====
let _lastHwAction = null;

function renderDashboardSummary(immediate, soon, later, overdueHw, dueSoonHw){
  const el = document.getElementById('dash-summary');
  if(!el) return;
  const cards = [
    ['Immediate', immediate.length + overdueHw.length, 'Do now'],
    ['Start now', soon.length + dueSoonHw.length, 'Needs attention soon'],
    ['Later', later.length, 'Upcoming'],
  ];
  el.innerHTML = cards.map(([label,count,sub])=>`<div class="summary-card"><div class="summary-kicker">${label}</div><div class="summary-value">${count}</div><div class="summary-sub">${sub}</div></div>`).join('');
}

buildDashboard = function(){
  const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('hdr-day').textContent  = DAYS[TODAY.getDay()];
  document.getElementById('hdr-date').textContent = `${TODAY.getDate()} ${MONTHS[TODAY.getMonth()]} ${TODAY.getFullYear()}`;

  const active = state.assessments.filter(a => daysUntil(a.date) > -30 && !isCompleted(a)).sort((a,b) => urgencyScore(b)-urgencyScore(a));
  const doNow=[], soon=[], later=[];
  active.forEach(a => {
    const d = daysUntil(a.date);
    if(d<=state.settings.criticalDays) doNow.push(a);
    else if(d<=state.settings.warningDays || shouldHaveStarted(a)) soon.push(a);
    else later.push(a);
  });

  renderSection('do-now-list', doNow, 'urgent');
  renderSection('coming-soon-list', soon, 'warning');
  renderSection('later-list', later, 'neutral');
  buildRadar(active);
  buildFocus();

  const overdueHw = (state.homework||[]).filter(hw=>!hw.done&&hw.date&&daysUntil(hw.date)<0);
  const dueSoonHw = (state.homework||[]).filter(hw=>!hw.done&&hw.date&&daysUntil(hw.date)>=0&&daysUntil(hw.date)<=ALMOST_DUE_DAYS);
  renderDashboardSummary(doNow, soon, later, overdueHw, dueSoonHw);

  const banner = document.getElementById('alert-banner');
  if(overdueHw.length){
    banner.classList.remove('hidden');
    banner.textContent = `${overdueHw.length} overdue homework ${overdueHw.length===1?'task':'tasks'} need attention`;
  } else banner.classList.add('hidden');

  const warnBanner = document.getElementById('almost-due-banner');
  if(dueSoonHw.length){
    warnBanner.classList.remove('hidden');
    warnBanner.textContent = `${dueSoonHw.length} homework ${dueSoonHw.length===1?'task is':'tasks are'} due soon`;
  } else warnBanner.classList.add('hidden');
}

renderSection = function(cid, assessments, variant){
  const el = document.getElementById(cid);
  el.innerHTML = '';
  if(!assessments.length){ el.innerHTML=`<div class="empty-box">Nothing here right now ✓</div>`; return; }
  assessments.forEach(a => {
    const days = daysUntil(a.date);
    const subj = getSubject(a.subjectId);
    const pct  = getProgressPercent(a.progress);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `task-card v-${variant}`;
    card.style.setProperty('--c-accent', subj.color);
    card.innerHTML = `
      <div class="tc-head tc-head-clean">
        <span class="tc-subject">${subj.name}</span>
        <span class="days-chip ${chipClass(days)}">${daysLabel(days)}</span>
      </div>
      <div class="tc-title-row">${a.title}</div>
      <div class="tc-sub tc-sub-clean">${cap(a.type)} · ${fmtDate(a.date)}${a.topic?` · ${a.topic}`:''}</div>
      <div class="tc-foot tc-foot-clean">
        <span class="prog-pill p-${a.progress}">${getProgressLabel(a.progress)}</span>
        <div class="prog-track compact"><div class="prog-fill" style="width:${pct}%;background:${subj.color}"></div></div>
      </div>`;
    card.addEventListener('click', ()=>openDetailModal(a.id));
    el.appendChild(card);
  });
}

buildAssessmentCard = function(a){
  const subj = getSubject(a.subjectId);
  const days = daysUntil(a.date);
  const done = isCompleted(a);
  const percent = getAssessmentPercent(a);
  const scoreClass = assessmentScoreClass(percent);
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'a-card' + (done ? ' is-completed' : '');
  card.style.setProperty('--subject-color', subj.color);
  card.innerHTML = `
    <div class="a-head-clean">
      <span class="a-subject">${subj.name}</span>
      <span class="days-chip ${done?'chip-green':chipClass(days)}">${done?'Done':daysLabel(days)}</span>
    </div>
    <div class="a-title">${a.title}</div>
    <div class="a-subline">${cap(a.type)} · ${fmtDate(a.date)}${a.weighting?` · ${a.weighting}%`:''}</div>
    ${done ? `<div class="a-score-big ${scoreClass}">${percent!==null?`${percent}%`:'—'}</div><div class="a-score-note">${a.mark!==''&&a.outOf!==''?`${a.mark} / ${a.outOf}`:'No mark saved'}</div>` : ''}
    <div class="a-foot clean">
      <span class="prog-pill ${done?'p-done':'p-'+a.progress}">${done?'Done ✓':getProgressLabel(a.progress)}</span>
    </div>`;
  card.addEventListener('click', ()=>openDetailModal(a.id));
  return card;
}

buildAssessmentsView = function(){
  const grid = document.getElementById('assessments-grid');
  const summary = document.getElementById('assessment-summary');
  const subjSel = document.getElementById('filter-subject');
  const typeSel = document.getElementById('filter-type');
  const curSubj = subjSel.value;

  subjSel.innerHTML = '<option value="">All Subjects</option>';
  state.subjects.forEach(s=>{
    const o = document.createElement('option');
    o.value = s.id;
    o.textContent = s.name;
    if(s.id === curSubj) o.selected = true;
    subjSel.appendChild(o);
  });

  const filtered = state.assessments.filter(a =>
    (!subjSel.value || a.subjectId === subjSel.value) &&
    (!typeSel.value || a.type === typeSel.value)
  ).sort((a,b)=>parseDate(a.date)-parseDate(b.date));

  const countLabel = document.getElementById('assessment-count-label');
  if(countLabel) countLabel.textContent = '';
  if(summary) summary.innerHTML = '';

  const incomplete = filtered.filter(a => !isCompleted(a));
  const completed = filtered.filter(a => isCompleted(a));

  grid.innerHTML = '';
  if(!filtered.length){
    grid.innerHTML = `<div class="empty-box" style="grid-column:1/-1;padding:40px">No assessments yet — click "+ Add Assessment" to start.</div>`;
    return;
  }

  if(incomplete.length){
    const sec = document.createElement('div');
    sec.className = 'a-section a-section-plain';
    sec.innerHTML = `<div><div class="a-section-title">Incomplete assessments</div></div>`;
    grid.appendChild(sec);
    incomplete.forEach(a => grid.appendChild(buildAssessmentCard(a)));
  }

  if(completed.length){
    const sec = document.createElement('div');
    sec.className = 'a-section a-section-plain';
    sec.innerHTML = `<div><div class="a-section-title">Completed assessments</div></div>`;
    grid.appendChild(sec);
    completed.forEach(a => grid.appendChild(buildAssessmentCard(a)));
  }
}

function openEditHomework(id){
  const hw=(state.homework||[]).find(h=>h.id===id); if(!hw) return;
  openAddHomework();
  document.getElementById('hw-modal-title').textContent='Edit Homework';
  document.getElementById('hw-form-id').value=hw.id;
  document.getElementById('hw-subject').value=hw.subjectId;
  document.getElementById('hw-task').value=hw.task;
  document.getElementById('hw-date').value=hw.date||'';
  document.getElementById('hw-priority').value=hw.priority||'normal';
}

saveHomework = function(){
  const preset = document.getElementById('hw-preset-subject').value;
  const sid  = preset || document.getElementById('hw-subject').value;
  const task = document.getElementById('hw-task').value.trim();
  const id = document.getElementById('hw-form-id').value;
  if(!sid||!task){ showToast('Please select a subject and enter a task', 'error'); return; }
  const payload = { subjectId:sid, task, date:document.getElementById('hw-date').value||null, priority:document.getElementById('hw-priority').value, done:false };
  if(id){
    const idx = (state.homework||[]).findIndex(h=>h.id===id);
    if(idx!==-1) state.homework[idx] = { ...state.homework[idx], ...payload };
    showToast('Homework updated', 'success');
  } else {
    state.homework.push({ id:'hw_'+Date.now(), ...payload });
    showToast('Homework added', 'success');
  }
  saveState(); closeModal('modal-homework'); buildHomeworkView(); if(getCurrentView()==='calendar') buildCalendar();
}

toggleHw = function(id){
  const hw=(state.homework||[]).find(h=>h.id===id);
  if(hw){
    hw.done=!hw.done; _lastHwAction={type:'toggle',id,prev:!hw.done}; saveState(); buildHomeworkView(); if(getCurrentView()==='calendar') buildCalendar();
    showToast(hw.done?'Task marked complete':'Task marked active', 'success');
  }
}

deleteHw = function(id){
  const hw=(state.homework||[]).find(h=>h.id===id); if(!hw) return;
  state.homework=(state.homework||[]).filter(h=>h.id!==id); saveState(); buildHomeworkView(); if(getCurrentView()==='calendar') buildCalendar(); showToast('Homework deleted', 'success');
}


let _hwInlineDraftSubject = null;
let _hwShowCompletedBySubject = {};
let _hwEditingId = null;
let _hwEditingDateId = null;

function startInlineHomeworkDraft(subjectId){
  if(!subjectId) return;
  _hwInlineDraftSubject = subjectId;
  buildHomeworkView();
  requestAnimationFrame(()=>{
    const input = document.querySelector(`.hw-inline-item[data-subject-id="${subjectId}"] .hw-inline-input`);
    if(input) input.focus();
  });
}

function cancelInlineHomeworkDraft(subjectId){
  if(_hwInlineDraftSubject === subjectId){
    _hwInlineDraftSubject = null;
    buildHomeworkView();
  }
}

function saveInlineHomeworkDraft(subjectId, value, date=null){
  const task = (value || '').trim();
  if(!subjectId){ _hwInlineDraftSubject = null; buildHomeworkView(); return; }
  if(!task){
    _hwInlineDraftSubject = null;
    buildHomeworkView();
    return;
  }
  state.homework = state.homework || [];
  state.homework.push({ id:'hw_'+Date.now(), subjectId, task, date:date || null, priority:'normal', done:false });
  _hwInlineDraftSubject = null;
  saveState();
  buildHomeworkView();
  if(getCurrentView()==='calendar') buildCalendar();
}

const _openAddHomeworkModal = openAddHomework;
openAddHomework = function(presetId=null){
  if(typeof getCurrentView === 'function' && getCurrentView()==='homework'){
    const sid = presetId || state.subjects?.[0]?.id || null;
    startInlineHomeworkDraft(sid);
    return;
  }
  return _openAddHomeworkModal(presetId);
}

toggleHw = function(id, sourceEl=null){
  const hw=(state.homework||[]).find(h=>h.id===id);
  if(!hw) return;
  hw.done=!hw.done;
  _hwEditingId = null;
  _hwEditingDateId = null;
  saveState();
  buildHomeworkView();
  if(getCurrentView()==='calendar') buildCalendar();
}

deleteHw = function(id, sourceEl=null){
  const hw=(state.homework||[]).find(h=>h.id===id); if(!hw) return;
  const doDelete = ()=>{
    state.homework=(state.homework||[]).filter(h=>h.id!==id);
    saveState();
    buildHomeworkView();
    if(getCurrentView()==='calendar') buildCalendar();
  };
  if(sourceEl){
    const item = sourceEl.closest('.hw-card-item');
    if(item){
      item.classList.add('is-deleting');
      setTimeout(doDelete, 120);
      return;
    }
  }
  doDelete();
}

buildHomeworkView = function(){
  const grid = document.getElementById('homework-grid');
  const summary = document.getElementById('homework-summary');
  const hwFilter = document.getElementById('hw-filter-subject');
  const escapeHtml = (value='') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  if(hwFilter){
    hwFilter.innerHTML = '<option value="">All Subjects</option>';
    hwFilter.style.display = 'none';
    hwFilter.setAttribute('aria-hidden', 'true');
  }

  if(summary){
    summary.innerHTML = '';
    summary.style.display = 'none';
  }

  grid.className = 'hw-board';
  grid.innerHTML='';

  if(!state.subjects.length){
    grid.innerHTML = `<div class="empty-box" style="padding:40px">Add a subject first, then your homework will appear here.</div>`;
    return;
  }

  const sortItems = (arr)=> [...arr].sort((a,b)=>{
    const aDays = a.date ? daysUntil(a.date) : 999;
    const bDays = b.date ? daysUntil(b.date) : 999;
    if(aDays !== bDays) return aDays - bDays;
    const priRank = { urgent:0, high:1, normal:2 };
    return (priRank[a.priority] ?? 2) - (priRank[b.priority] ?? 2);
  });

  const saveInlineEdit = (id, nextTask)=>{
    const trimmed = String(nextTask || '').trim();
    const hw = (state.homework || []).find(item => item.id === id);
    if(!hw) return;
    if(!trimmed){
      deleteHw(id);
      return;
    }
    if(hw.task === trimmed) return;
    hw.task = trimmed;
    saveState();
    buildHomeworkView();
    if(getCurrentView()==='calendar') buildCalendar();
  };

  const saveInlineDate = (id, nextDate)=>{
    const hw = (state.homework || []).find(item => item.id === id);
    if(!hw) return;
    const normalized = nextDate || null;
    if((hw.date || null) === normalized) return;
    hw.date = normalized;
    saveState();
    buildHomeworkView();
    if(getCurrentView()==='calendar') buildCalendar();
  };

  state.subjects.forEach((subj)=>{
    const subjectItems = sortItems((state.homework || []).filter(hw => hw.subjectId === subj.id));
    const showCompleted = !!_hwShowCompletedBySubject[subj.id];
    const visibleItems = subjectItems.filter(hw => !hw.done || showCompleted);
    const activeCount = subjectItems.filter(hw=>!hw.done).length;
    const doneCount = subjectItems.length - activeCount;
    const card = document.createElement('section');
    card.className = 'hw-subject-card';
    card.style.setProperty('--hw-subject', subj.color || 'var(--amber)');

    let listHtml = '';
    if(!visibleItems.length && _hwInlineDraftSubject !== subj.id){
      listHtml = `<div class="hw-empty-card">No homework</div>`;
    } else {
      listHtml = visibleItems.map(hw=>{
        const days = hw.date ? daysUntil(hw.date) : null;
        const priorityLabel = hw.priority === 'urgent' ? 'Urgent' : hw.priority === 'high' ? 'Important' : '';
        const priorityClass = hw.priority === 'urgent' ? 'urgent' : hw.priority === 'high' ? 'high' : 'normal';
        const editingText = _hwEditingId === hw.id;
        const editingDate = _hwEditingDateId === hw.id;
        const dueTone = days !== null && days < 0 ? 'overdue' : days !== null && days <= 2 ? 'soon' : '';
        const dueText = !hw.date ? 'Add Date' : days === 0 ? 'Today' : days < 0 ? '⚠ Overdue' : fmtShort(hw.date);
        const dueSub  = !hw.date ? '' : days === 0 ? '' : days < 0 ? fmtShort(hw.date) : days <= 14 ? daysLabel(days) : '';
        return `
          <article class="hw-card-item ${hw.done ? 'is-done' : ''}" data-id="${hw.id}">
            <button type="button" class="hw-card-check ${hw.done ? 'on' : ''}" aria-label="Mark complete"></button>
            <div class="hw-card-main">
              <div class="hw-card-edit-wrap">
                <div class="hw-card-title-wrap">
                  ${editingText ? `<input class="hw-card-title-input ${hw.done ? 'done' : ''}" type="text" value="${escapeHtml(hw.task)}" aria-label="Homework task" />` : `<button type="button" class="hw-card-title ${hw.done ? 'done' : ''}">${escapeHtml(hw.task)}</button>`}
                  ${priorityLabel ? `<div class="hw-card-meta"><span class="hw-mini-pill priority ${priorityClass}">${priorityLabel}</span></div>` : ''}
                </div>
                <div class="hw-card-date-wrap">
                  ${editingDate ? `<input class="hw-card-date-input ${dueTone}" type="date" value="${hw.date || ''}" aria-label="Due date" />` : `<button type="button" class="hw-card-date-chip ${dueTone} ${!hw.date ? 'is-empty' : ''}">${dueText}${dueSub ? `<span class="hw-card-date-sub">${dueSub}</span>` : ''}</button>`}
                </div>
              </div>
            </div>
          </article>`;
      }).join('');
    }

    const inlineDraftHtml = _hwInlineDraftSubject === subj.id ? `
      <article class="hw-inline-item" data-subject-id="${subj.id}">
        <div class="hw-card-check ghost"></div>
        <div class="hw-inline-fields">
          <input class="hw-inline-input" type="text" placeholder="New Reminder" aria-label="Homework task" />
          <div class="hw-inline-date-row">
            <span class="hw-inline-date-label" role="button" tabindex="0" aria-label="Add date">Add Date</span>
            <input class="hw-inline-date" type="date" aria-label="Due date" />
          </div>
        </div>
      </article>` : '';

    card.innerHTML = `
      <div class="hw-subject-head">
        <div class="hw-subject-head-main">
          <div class="hw-subject-dot"></div>
          <div>
            <div class="hw-subject-title">${subj.name}</div>
            <div class="hw-subject-sub">${activeCount} active${doneCount ? ` · ${doneCount} done` : ''}</div>
          </div>
        </div>
        <div class="hw-subject-actions">
          ${doneCount ? `<button type="button" class="hw-show-completed ${showCompleted ? 'on' : ''}">${showCompleted ? 'Hide Completed' : 'Show Completed'}</button>` : ''}
          <button type="button" class="btn btn-outline hw-card-add">+ Add</button>
        </div>
      </div>
      <div class="hw-card-list">
        ${listHtml}
        ${inlineDraftHtml}
      </div>`;

    card.querySelector('.hw-card-add').addEventListener('click', (e)=>{
      e.stopPropagation();
      startInlineHomeworkDraft(subj.id);
    });

    const showCompletedBtn = card.querySelector('.hw-show-completed');
    if(showCompletedBtn){
      showCompletedBtn.addEventListener('click', (e)=>{
        e.stopPropagation();
        _hwShowCompletedBySubject[subj.id] = !_hwShowCompletedBySubject[subj.id];
        _hwEditingId = null;
        _hwEditingDateId = null;
        buildHomeworkView();
      });
    }

    const draftInput = card.querySelector('.hw-inline-input');
    const draftDateInput = card.querySelector('.hw-inline-date');
    const draftDateLabel = card.querySelector('.hw-inline-date-label');

    // Show "Add Date" label immediately
    if(draftDateLabel) draftDateLabel.classList.add('visible');

    const showDateField = ()=>{
      if(draftDateLabel) draftDateLabel.classList.remove('visible');
      if(draftDateInput){
        draftDateInput.classList.add('visible');
        requestAnimationFrame(()=>{
          draftDateInput.focus();
          try { if(draftDateInput.showPicker) draftDateInput.showPicker(); } catch(_) {}
        });
      }
    };

    if(draftInput){
      // Track whether focus is anywhere inside this draft row (input OR date picker)
      let draftRowFocused = false;
      let blurCommitTimer = null;

      const scheduleDraftCommit = ()=>{
        // Delay commit so we can detect if focus moved within the draft row
        blurCommitTimer = setTimeout(()=>{
          if(!draftRowFocused){
            saveInlineHomeworkDraft(subj.id, draftInput.value, draftDateInput?.value || null);
          }
        }, 120);
      };

      const cancelDraftCommit = ()=>{
        if(blurCommitTimer) clearTimeout(blurCommitTimer);
        blurCommitTimer = null;
      };

      draftInput.addEventListener('focus', ()=>{ draftRowFocused = true; cancelDraftCommit(); });
      draftInput.addEventListener('blur', ()=>{
        draftRowFocused = false;
        scheduleDraftCommit();
      });

      draftInput.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter'){
          e.preventDefault();
          cancelDraftCommit();
          saveInlineHomeworkDraft(subj.id, draftInput.value, draftDateInput?.value || null);
        }
        if(e.key === 'Escape'){
          e.preventDefault();
          cancelDraftCommit();
          cancelInlineHomeworkDraft(subj.id);
        }
      });

      if(draftDateLabel){
        draftDateLabel.addEventListener('mousedown', (e)=>{
          // Prevent draftInput blur from firing before we show the date field
          e.preventDefault();
        });
        draftDateLabel.addEventListener('click', (e)=>{
          e.preventDefault();
          e.stopPropagation();
          cancelDraftCommit();
          showDateField();
        });
        draftDateLabel.addEventListener('keydown', (e)=>{
          if(e.key === 'Enter' || e.key === ' '){
            e.preventDefault();
            cancelDraftCommit();
            showDateField();
          }
        });
      }

      if(draftDateInput){
        // If already has a value (edge case), show immediately
        if(draftDateInput.value){
          draftDateInput.classList.add('visible');
          if(draftDateLabel) draftDateLabel.classList.remove('visible');
        }

        draftDateInput.addEventListener('focus', ()=>{ draftRowFocused = true; cancelDraftCommit(); });
        draftDateInput.addEventListener('blur', ()=>{
          draftRowFocused = false;
          // If date cleared, revert to label
          if(!draftDateInput.value){
            draftDateInput.classList.remove('visible');
            if(draftDateLabel) draftDateLabel.classList.add('visible');
          }
          scheduleDraftCommit();
        });
        draftDateInput.addEventListener('change', ()=>{
          // Date picked — keep field visible, don't commit yet
          draftDateInput.classList.add('visible');
          if(draftDateLabel) draftDateLabel.classList.remove('visible');
        });
        draftDateInput.addEventListener('keydown', (e)=>{
          if(e.key === 'Enter'){
            e.preventDefault();
            cancelDraftCommit();
            saveInlineHomeworkDraft(subj.id, draftInput.value, draftDateInput.value || null);
          }
          if(e.key === 'Escape'){
            e.preventDefault();
            cancelDraftCommit();
            cancelInlineHomeworkDraft(subj.id);
          }
        });
      }
    }

    card.querySelectorAll('.hw-card-item').forEach(itemEl => {
      const id = itemEl.dataset.id;
      const checkBtn = itemEl.querySelector('.hw-card-check');
      const titleBtn = itemEl.querySelector('.hw-card-title');
      const titleInput = itemEl.querySelector('.hw-card-title-input');
      const dateChip = itemEl.querySelector('.hw-card-date-chip');
      const dateInput = itemEl.querySelector('.hw-card-date-input');
      if(checkBtn) checkBtn.addEventListener('click', e=>{ e.stopPropagation(); toggleHw(id, e.currentTarget); });
      if(titleBtn){
        titleBtn.addEventListener('click', (e)=>{
          e.stopPropagation();
          _hwEditingId = id;
          _hwEditingDateId = null;
          buildHomeworkView();
        });
      }
      if(titleInput){
        titleInput.addEventListener('click', e=> e.stopPropagation());
        requestAnimationFrame(()=>{
          titleInput.focus();
          titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
        });
        titleInput.addEventListener('keydown', (e)=>{
          if(e.key === 'Enter'){
            e.preventDefault();
            _hwEditingId = null;
            saveInlineEdit(id, titleInput.value);
          }
          if(e.key === 'Escape'){
            e.preventDefault();
            _hwEditingId = null;
            buildHomeworkView();
          }
          if((e.key === 'Backspace' || e.key === 'Delete') && !titleInput.value.trim()){
            e.preventDefault();
            _hwEditingId = null;
            deleteHw(id);
          }
        });
        titleInput.addEventListener('blur', ()=>{
          _hwEditingId = null;
          saveInlineEdit(id, titleInput.value);
        });
      }
      if(dateChip){
        dateChip.addEventListener('click', (e)=>{
          e.stopPropagation();
          _hwEditingDateId = id;
          _hwEditingId = null;
          buildHomeworkView();
        });
      }
      if(dateInput){
        dateInput.addEventListener('click', e=> e.stopPropagation());
        requestAnimationFrame(()=>{
          dateInput.focus();
          try { if(dateInput.showPicker) dateInput.showPicker(); } catch(_) {}
        });
        dateInput.addEventListener('change', ()=>{
          _hwEditingDateId = null;
          saveInlineDate(id, dateInput.value);
        });
        dateInput.addEventListener('blur', ()=>{
          _hwEditingDateId = null;
          buildHomeworkView();
        });
        dateInput.addEventListener('keydown', (e)=>{
          if(e.key === 'Enter'){
            e.preventDefault();
            _hwEditingDateId = null;
            saveInlineDate(id, dateInput.value);
          }
          if(e.key === 'Escape'){
            e.preventDefault();
            _hwEditingDateId = null;
            buildHomeworkView();
          }
        });
      }
    });

    grid.appendChild(card);
  });
}

showToast = function(msg, type=''){
  const el = document.getElementById('toast'); if(!el) return;
  el.textContent = msg; el.className = 'toast' + (type ? ` toast-${type}` : ''); el.classList.remove('hidden','leaving');
  if(_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(()=>{ el.classList.add('leaving'); setTimeout(()=>el.classList.add('hidden'), 250); }, 2600);
}


// Ensure the redesigned dashboard summary renders on first load / reload
if (typeof getCurrentView === 'function' && getCurrentView() === 'dashboard') {
  buildDashboard();
}


// Dashboard summary/stat cards should exist immediately on first paint and reload
window.addEventListener('DOMContentLoaded', () => {
  const dashboardView = document.getElementById('view-dashboard');
  if (dashboardView && dashboardView.classList.contains('active')) {
    buildDashboard();
    requestAnimationFrame(() => buildDashboard());
  }
});
