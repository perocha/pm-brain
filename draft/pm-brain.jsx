// ═══════════════════════════════════════════════════════════════════════════════
// PM BRAIN — Layered Architecture
//
// Layer 1: UI (React views) — never touches storage directly
// Layer 2: Brain (AI agent) — reads state via context, writes via StorageAdapter
// Layer 3: StorageAdapter interface — concrete impl injected at boot
//          Current: LocalStorageAdapter (swap to RestAdapter / McpAdapter later)
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0b0c0f; --s1:#111318; --s2:#181b22; --s3:#1f2330;
  --b1:#252a38; --b2:#2e3548; --b3:#3d4660;
  --tx:#dde2f0; --t2:#8b92aa; --t3:#555d78;
  --amber:#e8a838; --amb2:#b07c1a; --ambg:#e8a83814;
  --teal:#3ec9a0;  --teal2:#1a7a5e; --tealg:#3ec9a014;
  --coral:#e05870; --cor2:#8a1f32;  --corg:#e0587014;
  --blue:#5b8aff;  --bl2:#1a3da0;   --blg:#5b8aff14;
  --violet:#9b6fff;--vio2:#4a1fa0;  --viog:#9b6fff14;
  --green:#4ec97a; --red:#e05c5c;
  --r:8px; --rm:12px; --rl:16px;
  --sans:'Geist',-apple-system,sans-serif; --mono:'Geist Mono',monospace; --display:'Instrument Serif',serif;
}
body{background:var(--bg);color:var(--tx);font-family:var(--sans);font-size:14px;height:100vh;overflow:hidden;-webkit-font-smoothing:antialiased;letter-spacing:-0.005em}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-thumb{background:var(--b2);border-radius:2px}

/* ── App shell ── */
.shell{display:flex;height:100vh;overflow:hidden}
.sidebar{width:220px;min-width:220px;background:var(--s1);border-right:1px solid var(--b1);display:flex;flex-direction:column;overflow:hidden}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg)}

/* ── Sidebar ── */
.sb-logo{padding:20px 16px 12px;border-bottom:1px solid var(--b1)}
.sb-logo-title{font-family:var(--display);font-size:22px;color:var(--amber);line-height:1;display:flex;align-items:center;gap:8px;letter-spacing:-0.01em}
.sb-logo-sub{font-family:var(--mono);font-size:9px;color:var(--t3);letter-spacing:.12em;text-transform:uppercase;margin-top:4px}
.pulse{width:7px;height:7px;border-radius:50%;background:var(--amber);box-shadow:0 0 8px var(--amber);animation:pulse 2.5s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}

/* Taxonomy selector */
.sb-tax{padding:12px 16px;border-bottom:1px solid var(--b1)}
.sb-tax-label{font-family:var(--mono);font-size:9px;color:var(--t3);letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px}
.sb-select{width:100%;background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);color:var(--tx);font-family:var(--mono);font-size:11px;padding:6px 10px;cursor:pointer;appearance:none}
.sb-select:focus{outline:none;border-color:var(--amb2)}

/* Nav items */
.sb-nav{flex:1;overflow-y:auto;padding:8px}
.nav-section{margin-bottom:4px}
.nav-section-label{font-family:var(--mono);font-size:9px;color:var(--t3);letter-spacing:.12em;text-transform:uppercase;padding:8px 8px 4px}
.nav-item{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:var(--r);cursor:pointer;color:var(--t2);font-size:12px;transition:all .12s;border:1px solid transparent}
.nav-item:hover{background:var(--s2);color:var(--tx)}
.nav-item.active{background:var(--ambg);color:var(--amber);border-color:var(--amb2)}
.nav-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}

/* Storage badge */
.sb-footer{padding:12px 16px;border-top:1px solid var(--b1)}
.storage-badge{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:9px;color:var(--t3);letter-spacing:.06em}
.storage-dot{width:5px;height:5px;border-radius:50%;background:var(--green)}

/* ── Top bar ── */
.topbar{padding:14px 24px;border-bottom:1px solid var(--b1);background:var(--s1);display:flex;align-items:center;gap:12px;flex-shrink:0}
.topbar-title{font-family:var(--display);font-size:22px;color:var(--tx);flex:1;letter-spacing:-0.01em}
.topbar-ctx{font-family:var(--mono);font-size:10px;color:var(--t3);display:flex;gap:6px;align-items:center}
.ctx-chip{padding:2px 8px;border-radius:20px;border:1px solid;font-size:9px;letter-spacing:.06em}

/* ── Content ── */
.content{flex:1;overflow-y:auto;padding:20px 24px}

/* ── Cards & grids ── */
.card{background:var(--s2);border:1px solid var(--b1);border-radius:var(--rm);padding:16px;margin-bottom:12px;transition:border-color .15s}
.card:hover{border-color:var(--b2)}
.card-hd{font-family:var(--mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--t3);margin-bottom:12px;display:flex;align-items:center;gap:8px}
.card-hd::after{content:'';flex:1;height:1px;background:var(--b1)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}

/* ── Stat card ── */
.stat-card{background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);padding:14px}
.stat-val{font-family:var(--display);font-size:34px;line-height:1;letter-spacing:-0.02em}
.stat-lbl{font-family:var(--mono);font-size:9px;color:var(--t2);margin-top:4px;letter-spacing:.06em;text-transform:uppercase}
.stat-delta{font-family:var(--mono);font-size:9px;margin-top:2px}

/* ── Table ── */
.tbl{width:100%;border-collapse:collapse;font-size:12px}
.tbl th{font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--t3);text-align:left;padding:6px 10px;border-bottom:1px solid var(--b1)}
.tbl td{padding:9px 10px;border-bottom:1px solid var(--b1);vertical-align:middle;color:var(--t2)}
.tbl td:first-child{color:var(--tx)}
.tbl tr:last-child td{border-bottom:none}
.tbl tr:hover td{background:var(--s3)}

/* ── Badges ── */
.badge{font-family:var(--mono);font-size:9px;padding:2px 7px;border-radius:20px;border:1px solid;letter-spacing:.05em;white-space:nowrap;display:inline-flex;align-items:center;gap:4px}
.badge-amber{color:var(--amber);border-color:var(--amb2);background:var(--ambg)}
.badge-teal{color:var(--teal);border-color:var(--teal2);background:var(--tealg)}
.badge-coral{color:var(--coral);border-color:var(--cor2);background:var(--corg)}
.badge-blue{color:var(--blue);border-color:var(--bl2);background:var(--blg)}
.badge-violet{color:var(--violet);border-color:var(--vio2);background:var(--viog)}
.badge-gray{color:var(--t2);border-color:var(--b2);background:var(--s3)}
.badge-red{color:var(--red);border-color:#7a2020;background:#e05c5c12}
.badge-green{color:var(--green);border-color:#1a5e30;background:#4ec97a12}

/* ── Buttons ── */
.btn{padding:7px 14px;border-radius:var(--r);font-family:var(--mono);font-size:11px;cursor:pointer;transition:all .15s;letter-spacing:.04em;border:1px solid}
.btn-amber{background:var(--amber);color:var(--bg);border-color:var(--amber)}
.btn-amber:hover{opacity:.85}
.btn-ghost{background:none;color:var(--t2);border-color:var(--b1)}
.btn-ghost:hover{border-color:var(--b2);color:var(--tx)}
.btn-sm{padding:4px 10px;font-size:10px}
.btn:disabled{opacity:.35;cursor:not-allowed}

/* ── Forms ── */
.fl{font-family:var(--mono);font-size:9px;color:var(--t3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px;display:block}
.fi{width:100%;background:var(--bg);border:1px solid var(--b1);border-radius:var(--r);color:var(--tx);font-family:var(--sans);font-size:12px;padding:7px 10px;outline:none;transition:border-color .15s}
.fi:focus{border-color:var(--amb2)}
.fi::placeholder{color:var(--t3)}
.fg{margin-bottom:12px}
.frow{display:flex;gap:10px}
.frow .fg{flex:1}
select.fi{appearance:none;cursor:pointer}
textarea.fi{resize:vertical;min-height:60px}

/* ── Priority dots ── */
.prio{width:8px;height:8px;border-radius:50%;display:inline-block;flex-shrink:0}
.prio-critical{background:var(--red)}
.prio-high{background:var(--coral)}
.prio-medium{background:var(--amber)}
.prio-low{background:var(--teal)}

/* ── RAG ── */
.rag{width:10px;height:10px;border-radius:50%;display:inline-block;flex-shrink:0}
.rag-red{background:var(--red)}
.rag-amber{background:var(--amber)}
.rag-green{background:var(--green)}

/* ── Progress bar ── */
.prog-bg{height:4px;background:var(--b1);border-radius:2px;overflow:hidden}
.prog-fill{height:100%;border-radius:2px;background:var(--teal);transition:width .4s}

/* ── Modal ── */
.modal-bd{position:fixed;inset:0;background:#00000090;display:flex;align-items:center;justify-content:center;z-index:200;padding:24px;animation:fi .15s}
@keyframes fi{from{opacity:0}to{opacity:1}}
.modal{background:var(--s2);border:1px solid var(--b2);border-radius:var(--rl);padding:24px;width:100%;max-width:520px;animation:su .18s;max-height:90vh;overflow-y:auto}
@keyframes su{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
.modal-title{font-family:var(--display);font-size:22px;color:var(--amber);margin-bottom:18px;letter-spacing:-0.01em}
.modal-footer{display:flex;gap:8px;justify-content:flex-end;margin-top:16px;padding-top:12px;border-top:1px solid var(--b1)}

/* ── Brain chat ── */
.brain-wrap{display:flex;flex-direction:column;height:calc(100vh - 130px)}
.brain-msgs{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:14px;padding:4px 0 8px}
.msg{display:flex;gap:10px}
.msg.user{flex-direction:row-reverse}
.avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:10px;flex-shrink:0}
.av-ai{background:var(--ambg);color:var(--amber);border:1px solid var(--amb2)}
.av-user{background:var(--blg);color:var(--blue);border:1px solid var(--bl2)}
.bubble{max-width:78%;padding:10px 14px;border-radius:var(--rm);font-size:12px;line-height:1.7;color:var(--tx)}
.msg.ai .bubble{background:var(--s2);border:1px solid var(--b1);border-top-left-radius:3px}
.msg.user .bubble{background:var(--blg);border:1px solid var(--bl2);border-top-right-radius:3px}
.bubble strong{color:var(--amber)}
.bubble code{font-family:var(--mono);font-size:10px;background:var(--bg);padding:1px 5px;border-radius:3px;color:var(--teal)}
.bubble em{color:var(--t2)}
.thinking-dots{display:flex;gap:4px;padding:2px 0}
.dot{width:5px;height:5px;border-radius:50%;background:var(--amber);animation:bop 1.1s ease-in-out infinite}
.dot:nth-child(2){animation-delay:.18s}
.dot:nth-child(3){animation-delay:.36s}
@keyframes bop{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-5px);opacity:1}}
.brain-input-wrap{margin-top:12px;background:var(--s2);border:1px solid var(--b1);border-radius:var(--rm);padding:10px 12px;transition:border-color .15s;flex-shrink:0}
.brain-input-wrap:focus-within{border-color:var(--amb2)}
.brain-input{width:100%;background:none;border:none;outline:none;color:var(--tx);font-family:var(--sans);font-size:13px;resize:none;line-height:1.5;max-height:100px}
.brain-input::placeholder{color:var(--t3)}
.brain-input-row{display:flex;align-items:flex-end;gap:10px}
.brain-suggestions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.sugg{font-family:var(--mono);font-size:9px;padding:3px 9px;border-radius:20px;border:1px solid var(--b1);color:var(--t3);cursor:pointer;transition:all .12s;letter-spacing:.04em}
.sugg:hover{border-color:var(--amb2);color:var(--amber)}

/* ── Empty state ── */
.empty{text-align:center;padding:48px 20px;color:var(--t3)}
.empty-icon{font-size:32px;margin-bottom:10px;opacity:.4}

/* ── Toolbar ── */
.toolbar{display:flex;align-items:center;gap:8px;margin-bottom:14px}
.toolbar-right{margin-left:auto;display:flex;gap:6px}

/* ── RAID type tab ── */
.raid-tabs{display:flex;gap:4px;background:var(--bg);border-radius:var(--r);padding:3px;margin-bottom:14px}
.raid-tab{padding:5px 12px;border-radius:6px;font-family:var(--mono);font-size:10px;cursor:pointer;color:var(--t3);transition:all .12s;border:none;background:none;letter-spacing:.05em}
.raid-tab.active{background:var(--s2);color:var(--tx);border:1px solid var(--b1)}

/* ── Overview health ring ── */
.health-ring{display:flex;gap:6px;align-items:center}
.ring-seg{height:6px;border-radius:3px;flex:1}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 3 — STORAGE ADAPTER INTERFACE + LOCAL IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

// Interface contract (what any adapter must implement):
// read(entity)          → object[]
// write(entity, item)   → void   (upsert by id)
// remove(entity, id)    → void
// subscribe(cb)         → unsubscribe fn   (called on any mutation)
// export()              → JSON string
// import(json)          → void

const ENTITIES = ["taxonomy","tasks","raid","meetings","stakeholders","status"];

class LocalStorageAdapter {
  #subs = [];
  #state;

  constructor(seed) {
    // In a real app: load from localStorage with JSON.parse(localStorage.getItem(NS))
    // Artifact sandbox doesn't support localStorage, so we use in-memory state.
    // Swap the constructor body to use localStorage for local deployment.
    this.#state = JSON.parse(JSON.stringify(seed));
  }

  read(entity) { return this.#state[entity] ?? []; }

  write(entity, item) {
    const list = this.#state[entity] ?? [];
    const idx = list.findIndex(x => x.id === item.id);
    if (idx >= 0) list[idx] = item; else list.push(item);
    this.#state[entity] = list;
    this.#flush();
  }

  remove(entity, id) {
    this.#state[entity] = (this.#state[entity] ?? []).filter(x => x.id !== id);
    this.#flush();
  }

  subscribe(cb) { this.#subs.push(cb); return () => { this.#subs = this.#subs.filter(s => s !== cb); }; }

  export() { return JSON.stringify(this.#state, null, 2); }

  import(json) { this.#state = JSON.parse(json); this.#flush(); }

  #flush() {
    // localStorage.setItem(NS, JSON.stringify(this.#state)); // ← uncomment for local deployment
    this.#subs.forEach(cb => cb());
  }
}

// Future adapters follow the same interface shape:
// RestAdapter: constructor(baseUrl, token) — uses fetch against your API
// McpAdapter:  constructor(mcpClient)      — calls pm_brain_read / pm_brain_write MCP tools
//              exposes the brain as an MCP server so Copilot CLI can call it natively

// ── Seed data ────────────────────────────────────────────────────────────────
const SEED = {
  taxonomy: [
    { id:"c1", type:"client",  name:"Acme Corp",      color:"#5b8aff" },
    { id:"p1", type:"project", name:"Platform Relaunch", clientId:"c1", rag:"amber",  pct:42 },
    { id:"p2", type:"project", name:"Data Warehouse",    clientId:"c1", rag:"green",  pct:78 },
    { id:"i1", type:"initiative", name:"Discovery",        projectId:"p1" },
    { id:"i2", type:"initiative", name:"Design System",    projectId:"p1" },
    { id:"i3", type:"initiative", name:"ETL Pipeline",     projectId:"p2" },
    { id:"c2", type:"client",  name:"Nova Health",    color:"#3ec9a0" },
    { id:"p3", type:"project", name:"Patient Portal",    clientId:"c2", rag:"red",    pct:21 },
    { id:"i4", type:"initiative", name:"Auth & Onboarding", projectId:"p3" },
    { id:"c3", type:"client",  name:"Stratum Labs",   color:"#9b6fff" },
    { id:"p4", type:"project", name:"AI Research Suite", clientId:"c3", rag:"green", pct:65 },
    { id:"i5", type:"initiative", name:"Model Eval",       projectId:"p4" },
  ],
  tasks: [
    { id:"t1", title:"Component audit",        status:"done",       priority:"high",     projectId:"p1", initiativeId:"i1", ownerId:"me", dueDate:"2026-04-20", createdAt:"2026-04-10" },
    { id:"t2", title:"Design token library",   status:"in-progress",priority:"high",     projectId:"p1", initiativeId:"i2", ownerId:"me", dueDate:"2026-05-01", createdAt:"2026-04-12" },
    { id:"t3", title:"HIPAA auth flow review", status:"blocked",    priority:"critical", projectId:"p3", initiativeId:"i4", ownerId:"me", dueDate:"2026-04-28", createdAt:"2026-04-15" },
    { id:"t4", title:"Kafka migration plan",   status:"todo",       priority:"medium",   projectId:"p2", initiativeId:"i3", ownerId:"me", dueDate:"2026-05-10", createdAt:"2026-04-18" },
    { id:"t5", title:"Benchmark suite setup",  status:"in-progress",priority:"medium",   projectId:"p4", initiativeId:"i5", ownerId:"me", dueDate:"2026-05-05", createdAt:"2026-04-19" },
  ],
  raid: [
    { id:"r1", type:"Risk",     title:"Legacy ERP data volume",     description:"Kafka migration may hit throughput limits from legacy ERP export volume.", probability:"high",  impact:"high",  status:"open",   projectId:"p2", mitigationPlan:"Benchmark with sample data; scale Kafka partitions.", linkedTaskId:"t4", raisedDate:"2026-04-18" },
    { id:"r2", type:"Risk",     title:"HIPAA legal sign-off delay",  description:"Legal review required before auth implementation begins.",                probability:"medium",impact:"high",  status:"open",   projectId:"p3", mitigationPlan:"Escalate to Nova Health legal by Apr 28.", linkedTaskId:"t3", raisedDate:"2026-04-19" },
    { id:"r3", type:"Issue",    title:"Design system scope creep",   description:"Stakeholders expanding token library scope mid-sprint.",                 probability:null,    impact:"medium",status:"open",   projectId:"p1", mitigationPlan:"Freeze scope; log additions to backlog.", raisedDate:"2026-04-21" },
    { id:"r4", type:"Action",   title:"Share benchmark results with Stratum", description:"Send model eval first results to Ivan & Judy by May 10.",        probability:null,    impact:null,    status:"open",   projectId:"p4", owner:"me", dueDate:"2026-05-10", raisedDate:"2026-04-18" },
    { id:"r5", type:"Decision", title:"Adopt Radix UI primitives",   description:"Agreed to use Radix UI over custom components for speed and a11y.",      probability:null,    impact:null,    status:"closed", projectId:"p1", rationale:"Saves ~3 weeks of build time; team familiar.", decidedDate:"2026-04-22" },
  ],
  meetings: [
    { id:"m1", title:"Q2 Kickoff — Platform Relaunch", date:"2026-04-22", projectId:"p1", initiativeId:"i1", participants:["Alice","Bob","Claire"], summary:"Aligned on DS scope. Decided Radix UI. Action: component audit by Friday.", hasTranscript:true },
    { id:"m2", title:"Patient Auth Design Review",     date:"2026-04-19", projectId:"p3", initiativeId:"i4", participants:["Frank","Grace","Hannah"], summary:"HIPAA MFA requirement confirmed. Legal sign-off needed before implementation.", hasTranscript:true },
    { id:"m3", title:"ETL Sprint Planning",            date:"2026-04-21", projectId:"p2", initiativeId:"i3", participants:["Dave","Eve"], summary:"Sprint 4 scoped. Kafka migration pushed to Sprint 5. ERP volume risk flagged.", hasTranscript:false },
    { id:"m4", title:"Model Eval Sync",                date:"2026-04-18", projectId:"p4", initiativeId:"i5", participants:["Ivan","Judy"], summary:"BLEU+ROUGE+human eval agreed. First results due May 10. Action assigned to Ivan.", hasTranscript:true },
  ],
  stakeholders: [
    { id:"sh1", name:"Alice Chen",    role:"Product Owner",  projectId:"p1", raci:"Accountable", contact:"alice@acme.com" },
    { id:"sh2", name:"Frank Mueller", role:"CTO",            projectId:"p3", raci:"Responsible", contact:"frank@novahealth.io" },
    { id:"sh3", name:"Ivan Petrov",   role:"Lead Researcher",projectId:"p4", raci:"Responsible", contact:"ivan@stratum.ai" },
    { id:"sh4", name:"Grace Lee",     role:"Legal Counsel",  projectId:"p3", raci:"Consulted",   contact:"grace@novahealth.io" },
  ],
  status: [
    { id:"st1", projectId:"p1", date:"2026-04-22", rag:"amber", summary:"Design system scope under discussion. Component audit complete. 2 tasks in flight.", authoredBy:"Brain" },
    { id:"st2", projectId:"p3", date:"2026-04-22", rag:"red",   summary:"Blocked on HIPAA legal sign-off. Auth task cannot progress. Escalation needed.", authoredBy:"Brain" },
  ],
};

// ── Boot storage ─────────────────────────────────────────────────────────────
const storage = new LocalStorageAdapter(SEED);

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 2 — BRAIN (AI AGENT via Anthropic API / GH Copilot SDK)
// ═══════════════════════════════════════════════════════════════════════════════

// In production: replace the fetch call below with the GitHub Copilot SDK.
// Install via: npm install the copilot-cli-sdk package from github
// Then: const client = new CopilotClient(); const session = await client.createSession(...);

const PM_TOOLS_DESCRIPTION = `
You have access to the following tools to mutate PM state. When the user asks you to create, update, or log something, use the tool by outputting a JSON block with key "tool_call": {name, args}.

Tools:
- create_task(title, priority, projectId, initiativeId, dueDate, status)
- create_raid(type, title, description, projectId, probability, impact, mitigationPlan)
- create_meeting(title, date, projectId, summary)
- draft_status_update(projectId) → returns a suggested RAG + summary text
- classify_meeting(title, notes) → suggests {projectId, initiativeId, confidence}
`;

async function askBrain(messages, state, scopeProjectId) {
  const { taxonomy, tasks, raid, meetings, stakeholders, status } = state;

  const scopedCtx = scopeProjectId
    ? `\nCURRENT SCOPE: Project ${scopeProjectId} — focus answers on this project unless asked otherwise.\n`
    : "";

  const system = `You are the PM Brain — a personal memory and intelligence layer for a solo project manager.
You hold complete, authoritative knowledge of all projects, tasks, risks, meetings, and decisions.
${scopedCtx}
TAXONOMY (clients > projects > initiatives):
${JSON.stringify(taxonomy, null, 2)}

TASKS:
${JSON.stringify(tasks, null, 2)}

RAID LOG (Risks, Actions, Issues, Decisions):
${JSON.stringify(raid, null, 2)}

MEETINGS:
${JSON.stringify(meetings, null, 2)}

STAKEHOLDERS:
${JSON.stringify(stakeholders, null, 2)}

STATUS UPDATES:
${JSON.stringify(status, null, 2)}

Your capabilities:
- Answer cross-entity questions ("which tasks are at risk because of X?")
- Surface patterns, blockers, and action items
- Draft status updates with RAG rating
- Classify meetings into the taxonomy
- Identify missing information or gaps in the PM record
- Suggest next actions based on current state
${PM_TOOLS_DESCRIPTION}

Format: use **bold** for key terms, \`code\` for IDs/dates, bullet lists where helpful. Be concise and specific — ground every claim in the data.`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      system,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });
  const data = await resp.json();
  return data.content?.[0]?.text ?? "No response.";
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS & CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

const AppCtx = createContext(null);
function useApp() { return useContext(AppCtx); }

const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);

const PRIO_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_LABEL = { "todo": "To Do", "in-progress": "In Progress", "blocked": "Blocked", "done": "Done", "cancelled": "Cancelled" };
const PRIO_BADGE = { critical: "badge-red", high: "badge-coral", medium: "badge-amber", low: "badge-teal" };
const STATUS_BADGE = { "todo": "badge-gray", "in-progress": "badge-blue", "blocked": "badge-red", "done": "badge-teal", "cancelled": "badge-gray" };
const RAID_TYPE_BADGE = { Risk: "badge-coral", Issue: "badge-red", Action: "badge-blue", Decision: "badge-teal" };
const RAG_CLASS = { red: "rag-red", amber: "rag-amber", green: "rag-green" };
const NAV = [
  { section: "Overview", items: [{ id: "overview", label: "Dashboard", color: "var(--amber)" }] },
  { section: "Execution", items: [
    { id: "tasks",    label: "Tasks",        color: "var(--teal)" },
    { id: "milestones",label: "Milestones", color: "var(--teal)" },
  ]},
  { section: "Risk & Decisions", items: [
    { id: "raid",    label: "RAID Log",      color: "var(--coral)" },
  ]},
  { section: "Communication", items: [
    { id: "meetings",    label: "Meetings",        color: "var(--amber)" },
    { id: "stakeholders",label: "Stakeholders",    color: "var(--blue)" },
    { id: "status",      label: "Status Updates",  color: "var(--violet)" },
  ]},
  { section: "Brain", items: [
    { id: "brain", label: "Brain ✦", color: "var(--amber)" },
  ]},
];

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 1 — UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Generic modal shell ──────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-bd" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={wide ? { maxWidth: 640 } : {}}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}

// ── Taxonomy helpers ─────────────────────────────────────────────────────────
function TaxLabel({ id, taxonomy, type = "project" }) {
  const item = taxonomy.find(x => x.id === id);
  if (!item) return null;
  const colorMap = { client: "badge-blue", project: "badge-violet", initiative: "badge-gray" };
  return <span className={`badge ${colorMap[item.type] || "badge-gray"}`}>{item.name}</span>;
}

function getProject(taxonomy, id) { return taxonomy.find(x => x.id === id && x.type === "project"); }
function getClient(taxonomy, projectId) {
  const proj = taxonomy.find(x => x.id === projectId);
  return proj ? taxonomy.find(x => x.id === proj.clientId) : null;
}
function getInitiative(taxonomy, id) { return taxonomy.find(x => x.id === id && x.type === "initiative"); }
function projectsFor(taxonomy, clientId) { return taxonomy.filter(x => x.type === "project" && x.clientId === clientId); }
function initiativesFor(taxonomy, projectId) { return taxonomy.filter(x => x.type === "initiative" && x.projectId === projectId); }
function allProjects(taxonomy) { return taxonomy.filter(x => x.type === "project"); }
function allClients(taxonomy) { return taxonomy.filter(x => x.type === "client"); }

// ── Scope selector (sidebar) ─────────────────────────────────────────────────
function ScopeSelector({ taxonomy, scopeProjectId, setScopeProjectId }) {
  return (
    <div className="sb-tax">
      <div className="sb-tax-label">Active project</div>
      <select className="sb-select" value={scopeProjectId} onChange={e => setScopeProjectId(e.target.value)}>
        <option value="">— all projects —</option>
        {allClients(taxonomy).map(c => (
          <optgroup key={c.id} label={c.name}>
            {projectsFor(taxonomy, c.id).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ state }) {
  const { taxonomy, tasks, raid, meetings, status } = state;
  const { setView, setBrainPrefill } = useApp();

  const projects = allProjects(taxonomy);
  const openTasks = tasks.filter(t => t.status !== "done" && t.status !== "cancelled");
  const blocked = tasks.filter(t => t.status === "blocked");
  const openRisks = raid.filter(r => r.type === "Risk" && r.status === "open");
  const openIssues = raid.filter(r => r.type === "Issue" && r.status === "open");

  const overdue = openTasks.filter(t => t.dueDate && t.dueDate < today());

  return (
    <div>
      {/* Stats */}
      <div className="grid4" style={{ marginBottom: 14 }}>
        {[
          { val: projects.length,     lbl: "Projects",      color: "var(--violet)" },
          { val: openTasks.length,    lbl: "Open tasks",    color: "var(--teal)" },
          { val: openRisks.length + openIssues.length, lbl: "Open risks/issues", color: "var(--coral)" },
          { val: blocked.length,      lbl: "Blocked tasks", color: "var(--red)" },
        ].map(s => (
          <div key={s.lbl} className="stat-card">
            <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="grid2">
        {/* Project health */}
        <div className="card">
          <div className="card-hd">Project health</div>
          {projects.map(p => {
            const client = getClient(taxonomy, p.id);
            const pTasks = tasks.filter(t => t.projectId === p.id);
            const done = pTasks.filter(t => t.status === "done").length;
            const blk = pTasks.filter(t => t.status === "blocked").length;
            return (
              <div key={p.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <div className={`rag ${RAG_CLASS[p.rag]}`} />
                  <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{p.name}</span>
                  <span style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--mono)" }}>{client?.name}</span>
                  {blk > 0 && <span className="badge badge-red">{blk} blocked</span>}
                </div>
                <div className="prog-bg"><div className="prog-fill" style={{ width: `${p.pct}%` }} /></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: "var(--t3)", fontFamily: "var(--mono)" }}>{done}/{pTasks.length} tasks done</span>
                  <span style={{ fontSize: 9, color: "var(--t3)", fontFamily: "var(--mono)" }}>{p.pct}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Needs attention */}
        <div className="card">
          <div className="card-hd">Needs attention</div>
          {overdue.length === 0 && blocked.length === 0 && openRisks.length === 0 && (
            <div className="empty"><div className="empty-icon">✓</div><div style={{ fontSize: 12 }}>All clear</div></div>
          )}
          {[...overdue.map(t => ({ kind: "overdue", item: t })), ...blocked.map(t => ({ kind: "blocked", item: t })), ...openRisks.slice(0, 2).map(r => ({ kind: "risk", item: r }))].slice(0, 6).map(({ kind, item }) => (
            <div key={item.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "7px 0", borderBottom: "1px solid var(--b1)" }}>
              <span className={`badge ${kind === "risk" ? "badge-coral" : kind === "blocked" ? "badge-red" : "badge-amber"}`}>{kind}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12 }}>{item.title}</div>
                {item.projectId && <div style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--mono)", marginTop: 2 }}>{getProject(taxonomy, item.projectId)?.name}</div>}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setBrainPrefill(`Tell me about "${item.title}" and what I should do next.`); setView("brain"); }}>Ask ↗</button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent meetings */}
      <div className="card">
        <div className="card-hd">Recent meetings</div>
        <table className="tbl">
          <thead><tr>
            <th>Meeting</th><th>Date</th><th>Project</th><th>Transcript</th><th></th>
          </tr></thead>
          <tbody>
            {meetings.slice(0, 4).map(m => (
              <tr key={m.id}>
                <td>{m.title}</td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 10 }}>{m.date}</td>
                <td><TaxLabel id={m.projectId} taxonomy={taxonomy} /></td>
                <td>{m.hasTranscript ? <span className="badge badge-green">yes</span> : <span style={{ color: "var(--t3)", fontSize: 10 }}>—</span>}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => { setBrainPrefill(`Summarise the meeting "${m.title}" and list all action items.`); setView("brain"); }}>Brain ↗</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tasks ────────────────────────────────────────────────────────────────────
function TasksView({ state }) {
  const { taxonomy, tasks } = state;
  const { scopeProjectId } = useApp();
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const list = tasks
    .filter(t => !scopeProjectId || t.projectId === scopeProjectId)
    .filter(t => filter === "all" || t.status === filter)
    .sort((a, b) => PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority]);

  return (
    <div>
      <div className="toolbar">
        <div style={{ display: "flex", gap: 4, background: "var(--bg)", borderRadius: "var(--r)", padding: 3 }}>
          {["all", "todo", "in-progress", "blocked", "done"].map(s => (
            <button key={s} className={`raid-tab ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>{s === "all" ? "All" : STATUS_LABEL[s]}</button>
          ))}
        </div>
        <div className="toolbar-right">
          <button className="btn btn-amber" onClick={() => setShowAdd(true)}>+ Task</button>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead><tr>
            <th></th><th>Title</th><th>Status</th><th>Priority</th><th>Project</th><th>Initiative</th><th>Due</th><th></th>
          </tr></thead>
          <tbody>
            {list.map(t => (
              <TaskRow key={t.id} task={t} taxonomy={taxonomy} />
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className="empty"><div className="empty-icon">☐</div><div style={{ fontSize: 12 }}>No tasks matching filter.</div></div>}
      </div>

      {showAdd && <TaskModal taxonomy={taxonomy} onClose={() => setShowAdd(false)} scopeProjectId={scopeProjectId} />}
    </div>
  );
}

function TaskRow({ task, taxonomy }) {
  const { dispatch } = useApp();
  const overdue = task.dueDate && task.dueDate < today() && task.status !== "done";
  return (
    <tr>
      <td><div className={`prio prio-${task.priority}`} /></td>
      <td style={{ fontWeight: 500, color: overdue ? "var(--coral)" : "var(--tx)" }}>{task.title}</td>
      <td><span className={`badge ${STATUS_BADGE[task.status]}`}>{STATUS_LABEL[task.status]}</span></td>
      <td><span className={`badge ${PRIO_BADGE[task.priority]}`}>{task.priority}</span></td>
      <td><TaxLabel id={task.projectId} taxonomy={taxonomy} /></td>
      <td style={{ color: "var(--t3)", fontSize: 11 }}>{getInitiative(taxonomy, task.initiativeId)?.name || "—"}</td>
      <td style={{ fontFamily: "var(--mono)", fontSize: 10, color: overdue ? "var(--coral)" : "var(--t2)" }}>{task.dueDate || "—"}</td>
      <td>
        <div style={{ display: "flex", gap: 4 }}>
          {task.status !== "done" && <button className="btn btn-ghost btn-sm" onClick={() => dispatch("write", "tasks", { ...task, status: "done" })}>✓</button>}
          <button className="btn btn-ghost btn-sm" onClick={() => dispatch("remove", "tasks", task.id)}>✕</button>
        </div>
      </td>
    </tr>
  );
}

function TaskModal({ taxonomy, onClose, scopeProjectId, prefill = {} }) {
  const { dispatch } = useApp();
  const [form, setForm] = useState({
    title: prefill.title || "", status: "todo", priority: "medium",
    projectId: scopeProjectId || prefill.projectId || "",
    initiativeId: prefill.initiativeId || "", dueDate: "", ownerId: "me",
  });
  const u = k => v => setForm(f => ({ ...f, [k]: v }));
  const initiatives = initiativesFor(taxonomy, form.projectId);

  function save() {
    if (!form.title || !form.projectId) return;
    dispatch("write", "tasks", { ...form, id: uid(), createdAt: today() });
    onClose();
  }

  return (
    <Modal title="New task" onClose={onClose}>
      <div className="fg"><label className="fl">Title</label><input className="fi" value={form.title} onChange={e => u("title")(e.target.value)} placeholder="What needs doing?" /></div>
      <div className="frow">
        <div className="fg">
          <label className="fl">Project</label>
          <select className="fi" value={form.projectId} onChange={e => { u("projectId")(e.target.value); u("initiativeId")(""); }}>
            <option value="">—</option>
            {allClients(taxonomy).map(c => <optgroup key={c.id} label={c.name}>{projectsFor(taxonomy, c.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>)}
          </select>
        </div>
        <div className="fg">
          <label className="fl">Initiative</label>
          <select className="fi" value={form.initiativeId} onChange={e => u("initiativeId")(e.target.value)} disabled={!form.projectId}>
            <option value="">—</option>
            {initiatives.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
      </div>
      <div className="frow">
        <div className="fg">
          <label className="fl">Priority</label>
          <select className="fi" value={form.priority} onChange={e => u("priority")(e.target.value)}>
            {["critical","high","medium","low"].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="fg">
          <label className="fl">Status</label>
          <select className="fi" value={form.status} onChange={e => u("status")(e.target.value)}>
            {Object.entries(STATUS_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="fg">
          <label className="fl">Due date</label>
          <input className="fi" type="date" value={form.dueDate} onChange={e => u("dueDate")(e.target.value)} />
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-amber" onClick={save} disabled={!form.title || !form.projectId}>Save task</button>
      </div>
    </Modal>
  );
}

// ── RAID Log ─────────────────────────────────────────────────────────────────
function RaidView({ state }) {
  const { taxonomy, raid } = state;
  const { scopeProjectId } = useApp();
  const [typeFilter, setTypeFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);

  const list = raid
    .filter(r => !scopeProjectId || r.projectId === scopeProjectId)
    .filter(r => typeFilter === "All" || r.type === typeFilter);

  return (
    <div>
      <div className="toolbar">
        <div className="raid-tabs">
          {["All","Risk","Action","Issue","Decision"].map(t => (
            <button key={t} className={`raid-tab ${typeFilter === t ? "active" : ""}`} onClick={() => setTypeFilter(t)}>{t}</button>
          ))}
        </div>
        <div className="toolbar-right">
          <button className="btn btn-amber" onClick={() => setShowAdd(true)}>+ Log entry</button>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead><tr>
            <th>Type</th><th>Title</th><th>Project</th><th>Probability</th><th>Impact</th><th>Status</th><th>Details</th><th></th>
          </tr></thead>
          <tbody>
            {list.map(r => (
              <tr key={r.id}>
                <td><span className={`badge ${RAID_TYPE_BADGE[r.type]}`}>{r.type}</span></td>
                <td style={{ fontWeight: 500, maxWidth: 200 }}>{r.title}</td>
                <td><TaxLabel id={r.projectId} taxonomy={taxonomy} /></td>
                <td>{r.probability ? <span className={`badge ${r.probability === "high" ? "badge-red" : r.probability === "medium" ? "badge-amber" : "badge-teal"}`}>{r.probability}</span> : <span style={{ color: "var(--t3)" }}>—</span>}</td>
                <td>{r.impact ? <span className={`badge ${r.impact === "high" ? "badge-red" : r.impact === "medium" ? "badge-amber" : "badge-teal"}`}>{r.impact}</span> : <span style={{ color: "var(--t3)" }}>—</span>}</td>
                <td><span className={`badge ${r.status === "open" ? "badge-amber" : "badge-teal"}`}>{r.status}</span></td>
                <td style={{ fontSize: 11, color: "var(--t3)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.mitigationPlan || r.rationale || r.dueDate || "—"}</td>
                <td>
                  <RaidActions item={r} taxonomy={taxonomy} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className="empty"><div className="empty-icon">◎</div><div style={{ fontSize: 12 }}>No entries.</div></div>}
      </div>

      {showAdd && <RaidModal taxonomy={taxonomy} onClose={() => setShowAdd(false)} scopeProjectId={scopeProjectId} />}
    </div>
  );
}

function RaidActions({ item }) {
  const { dispatch, setBrainPrefill, setView } = useApp();
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {item.status === "open" && <button className="btn btn-ghost btn-sm" onClick={() => dispatch("write", "raid", { ...item, status: "closed" })}>Close</button>}
      <button className="btn btn-ghost btn-sm" onClick={() => { setBrainPrefill(`What should I do about the RAID entry "${item.title}"? Give me a concrete next action.`); setView("brain"); }}>Brain ↗</button>
      <button className="btn btn-ghost btn-sm" onClick={() => dispatch("remove", "raid", item.id)}>✕</button>
    </div>
  );
}

function RaidModal({ taxonomy, onClose, scopeProjectId }) {
  const { dispatch } = useApp();
  const [form, setForm] = useState({
    type: "Risk", title: "", description: "", projectId: scopeProjectId || "",
    probability: "medium", impact: "medium", mitigationPlan: "", rationale: "",
    dueDate: "", owner: "me", status: "open",
  });
  const u = k => v => setForm(f => ({ ...f, [k]: v }));

  function save() {
    if (!form.title || !form.projectId) return;
    dispatch("write", "raid", { ...form, id: uid(), raisedDate: today() });
    onClose();
  }

  return (
    <Modal title="Log RAID entry" onClose={onClose} wide>
      <div className="frow">
        <div className="fg">
          <label className="fl">Type</label>
          <select className="fi" value={form.type} onChange={e => u("type")(e.target.value)}>
            {["Risk","Action","Issue","Decision"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="fg" style={{ flex: 3 }}>
          <label className="fl">Title</label>
          <input className="fi" value={form.title} onChange={e => u("title")(e.target.value)} placeholder="Short, specific description" />
        </div>
      </div>
      <div className="fg">
        <label className="fl">Description</label>
        <textarea className="fi" value={form.description} onChange={e => u("description")(e.target.value)} placeholder="Context, detail, background…" />
      </div>
      <div className="fg">
        <label className="fl">Project</label>
        <select className="fi" value={form.projectId} onChange={e => u("projectId")(e.target.value)}>
          <option value="">—</option>
          {allClients(taxonomy).map(c => <optgroup key={c.id} label={c.name}>{projectsFor(taxonomy, c.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>)}
        </select>
      </div>

      {(form.type === "Risk" || form.type === "Issue") && (
        <div className="frow">
          <div className="fg">
            <label className="fl">Probability</label>
            <select className="fi" value={form.probability} onChange={e => u("probability")(e.target.value)}>
              {["low","medium","high"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="fg">
            <label className="fl">Impact</label>
            <select className="fi" value={form.impact} onChange={e => u("impact")(e.target.value)}>
              {["low","medium","high"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="fg" style={{ flex: 2 }}>
            <label className="fl">Mitigation plan</label>
            <input className="fi" value={form.mitigationPlan} onChange={e => u("mitigationPlan")(e.target.value)} placeholder="How will you address this?" />
          </div>
        </div>
      )}
      {form.type === "Decision" && (
        <div className="fg">
          <label className="fl">Rationale</label>
          <textarea className="fi" value={form.rationale} onChange={e => u("rationale")(e.target.value)} placeholder="Why was this decision made? What alternatives were considered?" />
        </div>
      )}
      {form.type === "Action" && (
        <div className="frow">
          <div className="fg">
            <label className="fl">Owner</label>
            <input className="fi" value={form.owner} onChange={e => u("owner")(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Due date</label>
            <input className="fi" type="date" value={form.dueDate} onChange={e => u("dueDate")(e.target.value)} />
          </div>
        </div>
      )}

      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-amber" onClick={save} disabled={!form.title || !form.projectId}>Log entry</button>
      </div>
    </Modal>
  );
}

// ── Meetings ─────────────────────────────────────────────────────────────────
function MeetingsView({ state }) {
  const { taxonomy, meetings } = state;
  const { scopeProjectId, setBrainPrefill, setView } = useApp();
  const [showAdd, setShowAdd] = useState(false);

  const list = meetings.filter(m => !scopeProjectId || m.projectId === scopeProjectId);

  return (
    <div>
      <div className="toolbar">
        <div style={{ fontSize: 12, color: "var(--t3)", fontFamily: "var(--mono)" }}>{list.length} meetings</div>
        <div className="toolbar-right">
          <button className="btn btn-amber" onClick={() => setShowAdd(true)}>+ Log meeting</button>
        </div>
      </div>
      {list.map(m => {
        const proj = getProject(taxonomy, m.projectId);
        const init = getInitiative(taxonomy, m.initiativeId);
        return (
          <div key={m.id} className="card" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ minWidth: 72, fontFamily: "var(--mono)", fontSize: 10, color: "var(--t3)", paddingTop: 2, lineHeight: 1.5 }}>{m.date}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{m.title}</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                {proj && <span className="badge badge-violet">{proj.name}</span>}
                {init && <span className="badge badge-gray">{init.name}</span>}
                {m.hasTranscript && <span className="badge badge-green">transcript</span>}
                {m.participants?.length > 0 && <span className="badge badge-gray">{m.participants.join(", ")}</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6 }}>{m.summary}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setBrainPrefill(`Summarise "${m.title}" and extract all action items, decisions, and risks mentioned.`); setView("brain"); }}>Brain ↗</button>
          </div>
        );
      })}
      {list.length === 0 && <div className="empty"><div className="empty-icon">◷</div><div style={{ fontSize: 12 }}>No meetings logged.</div></div>}

      {showAdd && <MeetingModal taxonomy={taxonomy} onClose={() => setShowAdd(false)} scopeProjectId={scopeProjectId} />}
    </div>
  );
}

function MeetingModal({ taxonomy, onClose, scopeProjectId }) {
  const { dispatch } = useApp();
  const [form, setForm] = useState({ title: "", date: today(), projectId: scopeProjectId || "", initiativeId: "", summary: "", participants: "", hasTranscript: false });
  const u = k => v => setForm(f => ({ ...f, [k]: v }));
  const initiatives = initiativesFor(taxonomy, form.projectId);

  function save() {
    if (!form.title || !form.projectId) return;
    dispatch("write", "meetings", {
      ...form,
      id: uid(),
      participants: form.participants.split(",").map(s => s.trim()).filter(Boolean),
    });
    onClose();
  }

  return (
    <Modal title="Log meeting" onClose={onClose} wide>
      <div className="frow">
        <div className="fg" style={{ flex: 3 }}><label className="fl">Title</label><input className="fi" value={form.title} onChange={e => u("title")(e.target.value)} placeholder="Meeting title" /></div>
        <div className="fg"><label className="fl">Date</label><input className="fi" type="date" value={form.date} onChange={e => u("date")(e.target.value)} /></div>
      </div>
      <div className="frow">
        <div className="fg">
          <label className="fl">Project</label>
          <select className="fi" value={form.projectId} onChange={e => { u("projectId")(e.target.value); u("initiativeId")(""); }}>
            <option value="">—</option>
            {allClients(taxonomy).map(c => <optgroup key={c.id} label={c.name}>{projectsFor(taxonomy, c.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>)}
          </select>
        </div>
        <div className="fg">
          <label className="fl">Initiative</label>
          <select className="fi" value={form.initiativeId} onChange={e => u("initiativeId")(e.target.value)} disabled={!form.projectId}>
            <option value="">—</option>
            {initiatives.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
      </div>
      <div className="fg"><label className="fl">Participants (comma-separated)</label><input className="fi" value={form.participants} onChange={e => u("participants")(e.target.value)} placeholder="Alice, Bob, Claire" /></div>
      <div className="fg"><label className="fl">Summary / notes</label><textarea className="fi" value={form.summary} onChange={e => u("summary")(e.target.value)} rows={4} placeholder="Key decisions, action items, blockers, context…" /></div>
      <div className="fg" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" id="tsc" checked={form.hasTranscript} onChange={e => u("hasTranscript")(e.target.checked)} />
        <label htmlFor="tsc" className="fl" style={{ margin: 0 }}>Has transcript / recording</label>
      </div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-amber" onClick={save} disabled={!form.title || !form.projectId}>Save</button>
      </div>
    </Modal>
  );
}

// ── Stakeholders ─────────────────────────────────────────────────────────────
function StakeholdersView({ state }) {
  const { taxonomy, stakeholders } = state;
  const { scopeProjectId } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const { dispatch } = useApp();

  const list = stakeholders.filter(s => !scopeProjectId || s.projectId === scopeProjectId);

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-right"><button className="btn btn-amber" onClick={() => setShowAdd(true)}>+ Stakeholder</button></div>
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Name</th><th>Role</th><th>Project</th><th>RACI</th><th>Contact</th><th></th></tr></thead>
          <tbody>
            {list.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500 }}>{s.name}</td>
                <td style={{ color: "var(--t2)" }}>{s.role}</td>
                <td><TaxLabel id={s.projectId} taxonomy={taxonomy} /></td>
                <td><span className={`badge ${s.raci === "Accountable" ? "badge-amber" : s.raci === "Responsible" ? "badge-teal" : s.raci === "Consulted" ? "badge-blue" : "badge-gray"}`}>{s.raci}</span></td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t3)" }}>{s.contact}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => dispatch("remove","stakeholders",s.id)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className="empty"><div className="empty-icon">◎</div><div style={{ fontSize: 12 }}>No stakeholders logged.</div></div>}
      </div>
      {showAdd && <StakeholderModal taxonomy={taxonomy} onClose={() => setShowAdd(false)} scopeProjectId={scopeProjectId} />}
    </div>
  );
}

function StakeholderModal({ taxonomy, onClose, scopeProjectId }) {
  const { dispatch } = useApp();
  const [form, setForm] = useState({ name: "", role: "", projectId: scopeProjectId || "", raci: "Consulted", contact: "" });
  const u = k => v => setForm(f => ({ ...f, [k]: v }));
  function save() {
    if (!form.name || !form.projectId) return;
    dispatch("write", "stakeholders", { ...form, id: uid() });
    onClose();
  }
  return (
    <Modal title="Add stakeholder" onClose={onClose}>
      <div className="frow">
        <div className="fg"><label className="fl">Name</label><input className="fi" value={form.name} onChange={e => u("name")(e.target.value)} /></div>
        <div className="fg"><label className="fl">Role</label><input className="fi" value={form.role} onChange={e => u("role")(e.target.value)} /></div>
      </div>
      <div className="frow">
        <div className="fg">
          <label className="fl">Project</label>
          <select className="fi" value={form.projectId} onChange={e => u("projectId")(e.target.value)}>
            <option value="">—</option>
            {allClients(taxonomy).map(c => <optgroup key={c.id} label={c.name}>{projectsFor(taxonomy, c.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>)}
          </select>
        </div>
        <div className="fg">
          <label className="fl">RACI</label>
          <select className="fi" value={form.raci} onChange={e => u("raci")(e.target.value)}>
            {["Responsible","Accountable","Consulted","Informed"].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div className="fg"><label className="fl">Contact</label><input className="fi" value={form.contact} onChange={e => u("contact")(e.target.value)} placeholder="email or handle" /></div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-amber" onClick={save} disabled={!form.name || !form.projectId}>Save</button>
      </div>
    </Modal>
  );
}

// ── Status Updates ────────────────────────────────────────────────────────────
function StatusView({ state }) {
  const { taxonomy, status, tasks, raid, meetings } = state;
  const { scopeProjectId, setBrainPrefill, setView } = useApp();
  const [generating, setGenerating] = useState(null);
  const { dispatch } = useApp();

  const list = status.filter(s => !scopeProjectId || s.projectId === scopeProjectId);

  async function generate(projectId) {
    setGenerating(projectId);
    const proj = getProject(taxonomy, projectId);
    const prompt = `Draft a status update for the project "${proj?.name}". Include a RAG rating (red/amber/green) and a 2-3 sentence summary covering: overall progress, key risks or blockers, and next milestones. Output format: first line = RAG: <color>, then Summary: <text>`;
    try {
      const reply = await askBrain(
        [{ role: "user", content: prompt }],
        state, projectId
      );
      const ragMatch = reply.match(/RAG:\s*(red|amber|green)/i);
      const rag = ragMatch?.[1]?.toLowerCase() || "amber";
      const sumMatch = reply.match(/Summary:\s*([\s\S]+)/i);
      const summary = sumMatch?.[1]?.trim() || reply;
      dispatch("write", "status", { id: uid(), projectId, date: today(), rag, summary, authoredBy: "Brain" });
    } finally { setGenerating(null); }
  }

  return (
    <div>
      {allProjects(taxonomy).filter(p => !scopeProjectId || p.id === scopeProjectId).map(p => (
        <div key={p.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div className={`rag ${RAG_CLASS[p.rag]}`} />
            <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
            <div style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--mono)" }}>{getClient(taxonomy, p.id)?.name}</div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => generate(p.id)} disabled={generating === p.id}>
                {generating === p.id ? "Generating…" : "🧠 Brain draft"}
              </button>
            </div>
          </div>
          {list.filter(s => s.projectId === p.id).length === 0 && (
            <div style={{ fontSize: 12, color: "var(--t3)" }}>No status updates yet. Click "Brain draft" to generate one.</div>
          )}
          {list.filter(s => s.projectId === p.id).map(s => (
            <div key={s.id} style={{ borderTop: "1px solid var(--b1)", paddingTop: 10, marginTop: 8, display: "flex", gap: 10 }}>
              <div className={`rag ${RAG_CLASS[s.rag]}`} style={{ marginTop: 3, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--t3)" }}>{s.date}</span>
                  {s.authoredBy === "Brain" && <span className="badge badge-amber">Brain</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6 }}>{s.summary}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => dispatch("remove","status",s.id)}>✕</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Brain ─────────────────────────────────────────────────────────────────────
function BrainView({ state }) {
  const { scopeProjectId, brainPrefill, setBrainPrefill } = useApp();
  const [msgs, setMsgs] = useState([{
    role: "assistant",
    content: "Hello — I'm your **PM Brain**. I have full context of your taxonomy, tasks, RAID log, meetings, and stakeholders.\n\nAsk me anything cross-entity: *What tasks are at risk due to the HIPAA issue?* or *Draft a status update for Patient Portal* or *What decisions were made in April?*",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  useEffect(() => {
    if (brainPrefill) { setInput(brainPrefill); setBrainPrefill(""); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [brainPrefill]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const apiHistory = [...msgs.filter(m => m.role !== "assistant" || msgs.indexOf(m) > 0), userMsg];
    setMsgs(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const reply = await askBrain(apiHistory, state, scopeProjectId);
      setMsgs(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMsgs(prev => [...prev, { role: "assistant", content: "Connection error. Check your setup." }]);
    }
    setLoading(false);
  }

  function renderMd(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n- /g, "\n• ");
  }

  const SUGGESTIONS = scopeProjectId
    ? ["What are the open risks on this project?", "What tasks are blocked?", "Draft a status update", "Who are the key stakeholders?"]
    : ["Which tasks are overdue?", "What are the highest-impact open risks?", "Summarise all decisions made this month", "Which project is most at risk?"];

  return (
    <div className="brain-wrap">
      <div className="brain-msgs">
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className={`avatar ${m.role === "user" ? "av-user" : "av-ai"}`}>{m.role === "user" ? "PM" : "🧠"}</div>
            <div className="bubble" dangerouslySetInnerHTML={{ __html: renderMd(m.content) }} />
          </div>
        ))}
        {loading && (
          <div className="msg ai">
            <div className="avatar av-ai">🧠</div>
            <div className="bubble"><div className="thinking-dots"><div className="dot" /><div className="dot" /><div className="dot" /></div></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="brain-input-wrap">
        <div className="brain-input-row">
          <textarea ref={inputRef} className="brain-input" rows={1} value={input} onChange={e => setInput(e.target.value)}
            placeholder={scopeProjectId ? `Ask about ${getProject(state.taxonomy, scopeProjectId)?.name}…` : "Ask anything across all projects…"}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button className="btn btn-amber" onClick={send} disabled={!input.trim() || loading}>↑</button>
        </div>
        <div className="brain-suggestions">
          {SUGGESTIONS.map(s => <button key={s} className="sugg" onClick={() => setInput(s)}>{s}</button>)}
        </div>
      </div>
    </div>
  );
}

// ── Milestones (lightweight placeholder) ─────────────────────────────────────
function MilestonesView({ state }) {
  const { taxonomy } = state;
  const { scopeProjectId } = useApp();
  return (
    <div className="card">
      <div className="card-hd">Milestones</div>
      <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.8 }}>
        Milestones are project-level checkpoints. They live in the taxonomy alongside initiatives.<br />
        Each project's milestones appear here and link to tasks and RAID entries.<br /><br />
        <em style={{ color: "var(--t3)" }}>This view will expand in the next iteration — for now, milestones are tracked as high-priority tasks with specific due dates.</em>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [state, setState] = useState(() => {
    const s = {};
    ENTITIES.forEach(e => { s[e] = storage.read(e); });
    return s;
  });
  const [view, setViewRaw] = useState("overview");
  const [scopeProjectId, setScopeProjectId] = useState("");
  const [brainPrefill, setBrainPrefill] = useState("");

  // Subscribe to storage mutations → re-sync state
  useEffect(() => {
    const unsub = storage.subscribe(() => {
      const s = {};
      ENTITIES.forEach(e => { s[e] = storage.read(e); });
      setState(s);
    });
    return unsub;
  }, []);

  // Dispatch: UI calls this, never touches storage directly
  const dispatch = useCallback((op, entity, data) => {
    if (op === "write") storage.write(entity, data);
    else if (op === "remove") storage.remove(entity, data);
  }, []);

  function setView(v) {
    setViewRaw(v);
    if (v === "brain" && brainPrefill) setTimeout(() => {}, 0);
  }

  // Context value passed to all children
  const ctx = { dispatch, scopeProjectId, view, setView, brainPrefill, setBrainPrefill };

  // Top-bar context chips
  const scopeProj = scopeProjectId ? getProject(state.taxonomy, scopeProjectId) : null;
  const scopeClient = scopeProjectId ? getClient(state.taxonomy, scopeProjectId) : null;

  // Export
  function handleExport() {
    const json = storage.export();
    // In local deployment: create a Blob and trigger download
    // const blob = new Blob([json], { type: "application/json" });
    // const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "pm-brain.json"; a.click();
    // In sandbox: copy to clipboard or show alert
    try { navigator.clipboard.writeText(json); alert("JSON copied to clipboard!"); }
    catch { alert("Export:\n" + json.slice(0, 300) + "…"); }
  }

  const viewMap = {
    overview:     <Dashboard state={state} />,
    tasks:        <TasksView state={state} />,
    milestones:   <MilestonesView state={state} />,
    raid:         <RaidView state={state} />,
    meetings:     <MeetingsView state={state} />,
    stakeholders: <StakeholdersView state={state} />,
    status:       <StatusView state={state} />,
    brain:        <BrainView state={state} />,
  };

  const viewTitle = {
    overview: "Dashboard", tasks: "Tasks", milestones: "Milestones",
    raid: "RAID Log", meetings: "Meetings", stakeholders: "Stakeholders",
    status: "Status Updates", brain: "Brain",
  };

  return (
    <AppCtx.Provider value={ctx}>
      <style>{CSS}</style>
      <div className="shell">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sb-logo">
            <div className="sb-logo-title"><div className="pulse" />PM Brain</div>
            <div className="sb-logo-sub">Personal project memory</div>
          </div>

          <ScopeSelector taxonomy={state.taxonomy} scopeProjectId={scopeProjectId} setScopeProjectId={setScopeProjectId} />

          <nav className="sb-nav">
            {NAV.map(({ section, items }) => (
              <div key={section} className="nav-section">
                <div className="nav-section-label">{section}</div>
                {items.map(item => (
                  <div key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => setView(item.id)}>
                    <div className="nav-dot" style={{ background: view === item.id ? item.color : "var(--b2)" }} />
                    {item.label}
                  </div>
                ))}
              </div>
            ))}
          </nav>

          <div className="sb-footer">
            <div className="storage-badge">
              <div className="storage-dot" />
              LocalStorage · v1
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, width: "100%", fontSize: 9 }} onClick={handleExport}>↓ Export JSON</button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="main">
          <div className="topbar">
            <div className="topbar-title">{viewTitle[view]}</div>
            {scopeProj && (
              <div className="topbar-ctx">
                <span style={{ color: "var(--t3)" }}>scope:</span>
                <span className="ctx-chip badge-blue" style={{ borderColor: "var(--bl2)" }}>{scopeClient?.name}</span>
                <span style={{ color: "var(--t3)" }}>›</span>
                <span className="ctx-chip badge-violet" style={{ borderColor: "var(--vio2)" }}>{scopeProj.name}</span>
                <button style={{ marginLeft: 4, background: "none", border: "none", color: "var(--t3)", cursor: "pointer", fontSize: 11 }} onClick={() => setScopeProjectId("")}>✕</button>
              </div>
            )}
          </div>
          <div className="content">{viewMap[view]}</div>
        </div>
      </div>
    </AppCtx.Provider>
  );
}
