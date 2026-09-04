let token = localStorage.getItem("acm_token");
let state = {user:null,profile:null,analysis:null,interview:null,progress:null,resume:null,ats:null};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function toast(msg,error=false){const t=$("#toast");t.textContent=msg;t.className="toast"+(error?" error":"");setTimeout(()=>t.className="",3000)}
async function api(url,opts={}){opts.headers={...(opts.headers||{}), "Content-Type":"application/json", ...(token?{Authorization:"Bearer "+token}:{})};const r=await fetch(url,opts);const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Something went wrong");return d}

function showApp(){ $("#authView").classList.add("hidden"); $("#appView").classList.remove("hidden"); updateUI(); }
function showAuth(){ $("#appView").classList.add("hidden"); $("#authView").classList.remove("hidden"); }

$$(".tab").forEach(b=>b.onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#loginForm").classList.toggle("hidden",b.dataset.tab!=="login");$("#signupForm").classList.toggle("hidden",b.dataset.tab!=="signup")});

$("#loginForm").onsubmit=async e=>{e.preventDefault();try{const d=await api("/api/login",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});token=d.token;localStorage.setItem("acm_token",token);state={user:d.user,profile:d.profile,analysis:d.analysis,interview:d.interview,progress:d.progress,resume:d.resume,ats:d.ats};showApp();toast("Welcome back!")}catch(err){toast(err.message,true)}};
$("#signupForm").onsubmit=async e=>{e.preventDefault();try{const d=await api("/api/signup",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});token=d.token;localStorage.setItem("acm_token",token);state={user:d.user,profile:null,analysis:null};showApp();go("profile");toast("Account created — complete your profile")}catch(err){toast(err.message,true)}};

async function boot(){if(!token)return;try{const d=await api("/api/me");state={user:d.user,profile:d.profile,analysis:d.analysis,interview:d.interview,progress:d.progress,resume:d.resume,ats:d.ats};showApp()}catch{localStorage.removeItem("acm_token");token=null}}
boot();

function go(page){
  $$(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  $$(".page").forEach(x=>x.classList.add("hidden"));
  $("#page-"+page).classList.remove("hidden");
  $("#pageTitle").textContent=page[0].toUpperCase()+page.slice(1);
  if(page==="dashboard")renderDashboard();
  if(page==="career")renderCareer();
  if(page==="roadmap")renderRoadmap();
  if(page==="jobs")loadJobs(); if(page==="interview")renderInterview(); if(page==="resume")renderResume(); if(page==="progress")renderProgress();
}
$$(".nav").forEach(b=>b.onclick=()=>go(b.dataset.page));
$("#startProfile").onclick=()=>go("profile");
$("#logout").onclick=async()=>{try{await api("/api/logout",{method:"POST"})}catch{} localStorage.removeItem("acm_token");token=null;state={};showAuth()};

function arr(v){return Array.isArray(v)?v:String(v||"").split(",").map(x=>x.trim()).filter(Boolean)}
function fillProfile(){
  if(!state.profile)return;
  const f=$("#profileForm");
  for(const [k,v] of Object.entries(state.profile)){const el=f.elements[k];if(el)el.value=Array.isArray(v)?v.join(", "):(v??"")}
}
$("#profileForm").onsubmit=async e=>{
  e.preventDefault();
  const raw=Object.fromEntries(new FormData(e.target));
  raw.interests=arr(raw.interests);raw.skills=arr(raw.skills);
  try{const d=await api("/api/profile",{method:"POST",body:JSON.stringify(raw)});state.profile=d.profile;state.analysis=d.analysis;state.interview=d.interview;state.progress=d.progress;state.ats=d.ats;toast("Profile saved and AI analysis updated");go("dashboard")}catch(err){toast(err.message,true)}
};

function updateUI(){
  if(!state.user)return;
  $("#userName").textContent=state.user.name;$("#avatar").textContent=state.user.name[0]?.toUpperCase()||"U";$("#welcome").textContent=`Welcome back, ${state.user.name.split(" ")[0]}.`;
  fillProfile();renderDashboard();
}
function renderDashboard(){
  const a=state.analysis;
  if(!a){$("#profileState").textContent="Complete your profile to unlock your personalized career graph.";$("#topCareer").textContent="—";$("#topScore").textContent="Run analysis";$("#gapCount").textContent="—";$("#roadCount").textContent="—";$("#matchList").innerHTML='<div class="muted">No analysis yet. Start by filling your profile.</div>';$("#projectList").innerHTML='<div class="muted">Your recommended projects will appear here.</div>';return}
  $("#profileState").textContent=`Profile analyzed on ${new Date(a.generatedAt).toLocaleDateString()}. Your recommendations update whenever you re-run analysis.`;
  $("#topCareer").textContent=a.top[0].name;$("#topScore").textContent=`${a.top[0].score}% match`;$("#gapCount").textContent=a.gaps.length;$("#roadCount").textContent=a.roadmap.length;
  $("#matchList").innerHTML=a.top.map(x=>`<div class="match"><div class="match-row"><span class="match-name">${x.name}</span><span class="score">${x.score}%</span></div><div class="bar"><i style="width:${x.score}%"></i></div><div class="muted" style="margin-top:7px">${x.domain} · ${x.skills.slice(0,3).join(" · ")}</div></div>`).join("");
  $("#projectList").innerHTML=a.top.map(x=>`<div class="project"><b>${x.projects[0]}</b><p>${x.name} · Build this to validate your fit.</p></div>`).join("");
}
function renderCareer(){
  const a=state.analysis;if(!a){$("#graph").innerHTML='<div class="muted" style="padding:25px">Complete your profile first.</div>';return}
  const pos={you:[50,50],interest:[16,25],skills:[16,50],goals:[16,75],career0:[78,25],career1:[78,50],career2:[78,75]};
  const g=$("#graph");g.innerHTML="";
  const nodes=a.graph.nodes;
  nodes.forEach(n=>{const el=document.createElement("div");el.className="node "+n.type;el.textContent=n.label;el.style.left=(pos[n.id]?.[0]||50)+"%";el.style.top=(pos[n.id]?.[1]||50)+"%";g.appendChild(el)});
  requestAnimationFrame(()=>a.graph.edges.forEach(([aa,bb])=>{const A=g.querySelector(".node:nth-child("+ (nodes.findIndex(n=>n.id===aa)+1)+")");const B=g.querySelector(".node:nth-child("+ (nodes.findIndex(n=>n.id===bb)+1)+")");if(!A||!B)return;const r=g.getBoundingClientRect(),ra=A.getBoundingClientRect(),rb=B.getBoundingClientRect();const x1=ra.left+ra.width/2-r.left,y1=ra.top+ra.height/2-r.top,x2=rb.left+rb.width/2-r.left,y2=rb.top+rb.height/2-r.top;const line=document.createElement("div");line.className="edge";const dx=x2-x1,dy=y2-y1;line.style.left=x1+"px";line.style.top=y1+"px";line.style.width=Math.hypot(dx,dy)+"px";line.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;g.prepend(line)}));
  $("#whyList").innerHTML=a.top.map(x=>`<div class="why"><b>${x.name} — ${x.score}%</b><small>Matched signals: ${(x.matched.length?x.matched.join(", "):"your profile direction and goals")}</small></div>`).join("");
  $("#gaps").innerHTML=a.gaps.length?a.gaps.map(x=>`<span class="chip">${x}</span>`).join(""):"<span class='muted'>No major gaps detected yet.</span>";
}
function renderRoadmap(){const a=state.analysis;$("#roadmap").innerHTML=a?a.roadmap.map((x,i)=>`<div class="step"><div class="num">0${i+1}</div><b>${x.step}</b><p>${x.detail}</p></div>`).join(""):"<div class='muted'>Complete your profile first.</div>"}
async function loadJobs(){if(!state.analysis){$("#jobs").innerHTML="<div class='muted'>Complete your profile first.</div>";return}try{const d=await api("/api/jobs");$("#jobs").innerHTML=d.map(j=>`<div class="job"><div><h4>${j.title}</h4><p>${j.company} · ${j.type} · ${j.location}</p><div class="job-tags">${j.tags.map(t=>`<span>${t}</span>`).join("")}</div></div><div class="job-match">${j.match}%<div class="muted">match</div></div></div>`).join("")}catch(err){toast(err.message,true)}}
$("#reanalyze").onclick=async()=>{try{const d=await api("/api/analyze",{method:"POST"});state.analysis=d;renderCareer();toast("Career graph refreshed")}catch(err){toast(err.message,true)}};

function renderInterview(){if(!state.profile){$("#interviewIntro").textContent="Complete your profile first.";return}const g=/10th|12th/i.test(state.profile.stage)?"school":/College/i.test(state.profile.stage)?"college":"job";$("#interviewIntro").textContent=g==="school"?"Interest discovery — no location or job fields.":g==="college"?"Skill and project focused interview.":"Job-readiness interview using skills, projects and resume evidence.";if(state.interview&&state.interview.index<state.interview.questions.length)showQuestion();}
async function startInterview(){try{const d=await api("/api/interview/start",{method:"POST"});state.interview=d;$("#interviewBox").classList.remove("hidden");$("#interviewResult").classList.add("hidden");showQuestion()}catch(e){toast(e.message,true)}}
function showQuestion(){const q=state.interview.questions[state.interview.index];if(!q){showInterviewDone();return}$("#qNumber").textContent=`Question ${state.interview.answers.length+1}`;$("#qSkill").textContent=q.skill;$("#question").textContent=q.q;$("#answer").value="";$("#feedback").classList.add("hidden");}
async function submitAnswer(){const a=$("#answer").value.trim();if(!a)return toast("Write an answer first.",true);try{const d=await api("/api/interview/answer",{method:"POST",body:JSON.stringify({answer:a})});state.interview=d.interview;state.progress=d.progress;$("#feedback").classList.remove("hidden");$("#feedback").innerHTML=`<b>Interview Score: ${d.evaluation.score}/100</b><br>${d.evaluation.feedback}`;
$("#feedbackDetails").classList.remove("hidden");
$("#feedbackDetails").innerHTML=`<b>AI Feedback</b><br>Strength: ${d.evaluation.score>=70?"Your answer shows a reasonable understanding and relevant evidence.":"You attempted the question, but the answer needs more specific evidence."}<br><br><b>Improve:</b> ${d.evaluation.weak?"Give a clear structure: situation → approach → action → result, and include one concrete example.":"Make the answer more concise, specific and measurable where possible."}${d.evaluation.weak?`<br><br><b>Adaptive follow-up:</b> The next question will focus on <span class="chip">${d.interview?.weakSkills?.slice(-1)[0]||"this skill"}</span>.`:""}`
if(d.done)setTimeout(showInterviewDone,700);else setTimeout(showQuestion,900)}catch(e){toast(e.message,true)}}
function showInterviewDone(){const weak=[...new Set(state.interview?.weakSkills||[])];$("#interviewBox").classList.add("hidden");$("#interviewResult").classList.remove("hidden");$("#interviewResult").innerHTML=`<h3>Interview complete ✦</h3><p class="muted">Weak areas automatically feed your roadmap.</p>${weak.length?`<div class="chips">${weak.map(x=>`<span class="chip">Improve ${x}</span>`).join("")}</div>`:"<p class='muted'>No major weak area detected.</p>"}<button class="primary" style="max-width:260px;margin-top:15px" onclick="go('progress')">Open Roadmap →</button>`}
$("#startInterview").onclick=startInterview;$("#submitAnswer").onclick=submitAnswer;
$("#resumeForm").onsubmit=async e=>{e.preventDefault();const file=$("#resumeFile").files[0];if(!file)return;const fd=new FormData();fd.append("resume",file);try{const r=await fetch("/api/resume",{method:"POST",headers:{Authorization:"Bearer "+token},body:fd});const d=await r.json();if(!r.ok)throw Error(d.error);state.resume=d.resume;state.profile=d.profile;state.analysis=d.analysis;state.progress=d.progress;state.ats=d.ats;renderResume();toast("Resume analyzed and skill gaps updated")}catch(e){toast(e.message,true)}};
function renderResume(){renderATS(); if(!state.resume)return;$("#resumeInfo").innerHTML=`<b>${state.resume.name}</b><br>Extracted skills: ${state.resume.extractedSkills.join(", ")||"No mapped skills detected"}<br>Uploaded: ${new Date(state.resume.uploadedAt).toLocaleString()}`;const gaps=state.analysis?.gaps||[];$("#resumeGaps").innerHTML=gaps.map(x=>`<span class="chip">Missing: ${x}</span>`).join("")||"<span class='muted'>No mapped gaps found.</span>";$("#resumeAdvice").textContent=gaps.length?`Priority skills: ${gaps.slice(0,3).join(", ")}. Learn → practise → build proof → re-interview.`:"Your mapped resume skills align with the detected direction.";renderATS()}
function renderProgress(){const steps=state.progress||[];$("#progressRoadmap").innerHTML=steps.map((x,i)=>`<div class="progress-item"><div class="progress-icon">${String(i+1).padStart(2,"0")}</div><div><b>${x.title}</b><p>${x.detail}</p>${x.courses?.length?`<div class="course-list">${x.courses.map(c=>`<a class="course-link" href="${c.url}" target="_blank" rel="noopener"><span class="course-title">📚 ${c.title}</span><small>${c.provider} ↗</small></a>`).join("")}</div>`:""}</div><span class="badge">${x.status==="current"?"CURRENT":"NEXT"}</span></div>`).join("")||"<div class='muted'>Complete your profile to generate a roadmap.</div>";}
let botStep=0;const botQs=["Hi! 👋 Main tumhara School Interest Mentor hoon. Sabse pehle batao — school mein kaunsa subject ya activity tumhe sabse zyada interesting lagti hai?","Agar marks ka pressure na ho, free time mein tum kya karna choose karoge — coding, drawing/design, sports, writing, business, helping people, experiments, ya kuch aur?","Tumhe cheezein banana zyada pasand hai, problems solve karna, logon se baat karna, ya creative ideas sochna? Ek example do.","Agar school mein ek project banana ho aur topic tum khud choose karo, tum kis topic par banaoge aur kyun?"];function school(){return state.profile&&/10th|12th/i.test(state.profile.stage)}function openBot(){if(!school())return toast("School Interest Mentor is for 10th/12th students.",true);$("#schoolBot").classList.remove("hidden");$("#openBot").classList.add("hidden");if(!$("#chatMessages").children.length)addBot(botQs[0])}function addBot(t){const d=document.createElement("div");d.className="bubble bot";d.textContent=t;$("#chatMessages").appendChild(d)}function addMe(t){const d=document.createElement("div");d.className="bubble me";d.textContent=t;$("#chatMessages").appendChild(d)}$("#openBot").onclick=openBot;$("#closeBot").onclick=()=>{$("#schoolBot").classList.add("hidden");$("#openBot").classList.remove("hidden")};$("#chatForm").onsubmit=e=>{e.preventDefault();const v=$("#chatInput").value.trim();if(!v)return;addMe(v);$("#chatInput").value="";botStep++;setTimeout(()=>addBot(botStep<botQs.length?botQs[botStep]:"Thanks! ✦ Tumhare answers se interest profile ban sakti hai. Ab Career Graph mein tumhari study roadmap dekho."),300)};

function renderATS(){const a=state.ats;if(!a)return;const score=Math.round(a.score||0);$("#atsScore").innerHTML=`<span>${score}</span><small>/100</small>`;$("#atsFill").style.width=score+"%";$("#atsRole").textContent=`Target role: ${a.role}`;$("#atsBreakdown").innerHTML=Object.entries(a.breakdown||{}).filter(([k])=>k!=="baseline").map(([k,v])=>`<span class="ats-pill">${k.replace(/([A-Z])/g," $1")}: <b>${v}</b></span>`).join("");$("#atsRecommendations").innerHTML=(a.recommendations||[]).map(x=>`<div>✦ ${x}</div>`).join("")+`<div class="muted">${a.disclaimer||""}</div>`;}
