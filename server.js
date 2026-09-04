const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const sessions = new Map();

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");

function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, "utf8")); }
  catch { return []; }
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}
function verifyPassword(password, salt, expected) {
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}
function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = token && sessions.get(token);
  if (!userId) return res.status(401).json({ error: "Please log in again." });
  const user = readUsers().find(u => u.id === userId);
  if (!user) return res.status(401).json({ error: "User not found." });
  req.user = user;
  req.token = token;
  next();
}


const upload = multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024}});
const courseCatalog={
"Java":[
 {title:"Java Programming",provider:"Oracle Java Tutorials",url:"https://docs.oracle.com/javase/tutorial/"},
 {title:"Java Programming and Software Engineering Fundamentals",provider:"Coursera",url:"https://www.coursera.org/specializations/java-programming"}
],
"DSA":[
 {title:"Data Structures and Algorithms",provider:"GeeksforGeeks",url:"https://www.geeksforgeeks.org/dsa/"},
 {title:"Data Structures and Algorithms",provider:"Coursera",url:"https://www.coursera.org/specializations/data-structures-algorithms"}
],
"Programming":[
 {title:"CS50x – Introduction to Computer Science",provider:"Harvard / edX",url:"https://cs50.harvard.edu/x/"}
],
"JavaScript":[
 {title:"JavaScript Guide",provider:"MDN",url:"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"},
 {title:"JavaScript Algorithms and Data Structures",provider:"freeCodeCamp",url:"https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/"}
],
"HTML":[
 {title:"Learn HTML",provider:"MDN",url:"https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content"},
 {title:"Responsive Web Design",provider:"freeCodeCamp",url:"https://www.freecodecamp.org/learn/2022/responsive-web-design/"}
],
"CSS":[
 {title:"Learn CSS",provider:"MDN",url:"https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics"},
 {title:"Responsive Web Design",provider:"freeCodeCamp",url:"https://www.freecodecamp.org/learn/2022/responsive-web-design/"}
],
"Python":[
 {title:"Python Tutorial",provider:"Python.org",url:"https://docs.python.org/3/tutorial/"},
 {title:"Scientific Computing with Python",provider:"freeCodeCamp",url:"https://www.freecodecamp.org/learn/scientific-computing-with-python/"}
],
"SQL":[
 {title:"SQL Tutorial",provider:"W3Schools",url:"https://www.w3schools.com/sql/"},
 {title:"SQL for Data Science",provider:"Coursera",url:"https://www.coursera.org/learn/sql-for-data-science"}
],
"Git":[
 {title:"Git Handbook",provider:"GitHub",url:"https://guides.github.com/introduction/git-handbook/"},
 {title:"Git & GitHub",provider:"freeCodeCamp",url:"https://www.freecodecamp.org/news/learn-the-basics-of-git-in-under-10-minutes/"}
],
"GitHub":[
 {title:"GitHub Skills",provider:"GitHub",url:"https://skills.github.com/"}
],
"REST APIs":[
 {title:"Learn REST APIs",provider:"MDN",url:"https://developer.mozilla.org/en-US/docs/Glossary/REST"},
 {title:"Postman API Fundamentals Student Expert",provider:"Postman",url:"https://academy.postman.com/path/postman-api-fundamentals-student-expert"}
],
"OOP":[
 {title:"Object-Oriented Programming in Java",provider:"Oracle",url:"https://docs.oracle.com/javase/tutorial/java/concepts/"},
 {title:"Object Oriented Programming in Java",provider:"Coursera",url:"https://www.coursera.org/learn/object-oriented-programming"}
],
"Problem Solving":[
 {title:"Problem Solving",provider:"HackerRank",url:"https://www.hackerrank.com/domains/algorithms"},
 {title:"CS50x – Introduction to Computer Science",provider:"Harvard / edX",url:"https://cs50.harvard.edu/x/"}
],
"Communication":[
 {title:"Improving Communication Skills",provider:"Coursera",url:"https://www.coursera.org/learn/wharton-communication-skills"}
],
"Teamwork":[
 {title:"Work Smarter with Others",provider:"Coursera",url:"https://www.coursera.org/learn/work-smarter-not-harder"}
],
"Statistics":[
 {title:"Statistics with Python",provider:"Coursera",url:"https://www.coursera.org/specializations/statistics-with-python"}
],
"Data Analysis":[
 {title:"Data Analysis with Python",provider:"freeCodeCamp",url:"https://www.freecodecamp.org/learn/data-analysis-with-python/"},
 {title:"Google Data Analytics",provider:"Coursera",url:"https://www.coursera.org/professional-certificates/google-data-analytics"}
],
"Power BI":[
 {title:"Power BI Learning",provider:"Microsoft Learn",url:"https://learn.microsoft.com/en-us/training/powerplatform/power-bi/"}
],
"User Research":[
 {title:"User Research",provider:"Interaction Design Foundation",url:"https://www.interaction-design.org/literature/topics/user-research"}
],
"Wireframing":[
 {title:"Wireframing",provider:"Figma",url:"https://help.figma.com/hc/en-us/articles/360040314193-Create-a-wireframe"}
],
"Visual Design":[
 {title:"Visual Design",provider:"Interaction Design Foundation",url:"https://www.interaction-design.org/literature/topics/visual-design"}
],
"Prototyping":[
 {title:"Prototyping",provider:"Figma",url:"https://help.figma.com/hc/en-us/articles/360040314193-Create-prototypes"}
],
"Linux":[
 {title:"Introduction to Linux",provider:"Linux Foundation / edX",url:"https://www.edx.org/learn/linux"}
],
"Security Basics":[
 {title:"Introduction to Cybersecurity",provider:"Cisco Networking Academy",url:"https://www.netacad.com/courses/cybersecurity/introduction-cybersecurity"}
],
"SEO":[
 {title:"SEO Starter Guide",provider:"Google Search Central",url:"https://developers.google.com/search/docs/fundamentals/seo-starter-guide"}
],
"Storytelling":[
 {title:"Storytelling",provider:"Coursera",url:"https://www.coursera.org/learn/storytelling"}
],
"Product Thinking":[
 {title:"Digital Product Management",provider:"Coursera",url:"https://www.coursera.org/specializations/uva-digital-product-management"}
],
"Business Analysis":[
 {title:"Business Analysis",provider:"Coursera",url:"https://www.coursera.org/browse/business/business-strategy"}
]};
function coursesFor(skill){
  const exact=courseCatalog[skill];
  if(exact)return exact.slice(0,2);
  const key=Object.keys(courseCatalog).find(k=>skill.toLowerCase().includes(k.toLowerCase())||k.toLowerCase().includes(skill.toLowerCase()));
  return key?courseCatalog[key].slice(0,2):[{title:`Learn ${skill} Fundamentals`,provider:"Recommended learning path",url:"https://www.coursera.org/search?query="+encodeURIComponent(skill)}];
}

const skillBank=["Programming","DSA","Git","APIs","JavaScript","Java","Python","SQL","Excel","Statistics","Visualization","Power BI","User Research","Wireframing","Visual Design","Prototyping","Communication","Problem Solving","Presentation","Teamwork","Networking","Linux","Security Basics","Content","SEO","Storytelling","Product Thinking","Business Analysis"];
const interviewQuestions={school:[
{skill:"Curiosity",q:"If you could spend a whole day learning or doing any activity, what would you choose and why?"},
{skill:"Problem Solving",q:"If you could solve one problem in your school, what would you choose and how would you solve it?"},
{skill:"Creativity",q:"How would you make a boring school topic interesting for other students?"},
{skill:"Communication",q:"Explain your favorite subject or hobby to a friend in about 30 seconds."},
{skill:"Teamwork",q:"If your team members disagree during a group project, how would you handle it?"},
{skill:"Interest",q:"Which do you enjoy most: coding, design, numbers, helping people, business, writing, or something else? Why?"}],
college:[
{skill:"Programming",q:"Explain a programming problem you solved and the approach you used."},
{skill:"Problem Solving",q:"When you face an unfamiliar technical problem, how do you approach solving it?"},
{skill:"Communication",q:"Explain one of your projects to a non-technical person in about 45 seconds."},
{skill:"Teamwork",q:"Tell me about a disagreement in a team project and how you handled it."},
{skill:"Project Skills",q:"What was your exact contribution to your best project?"},
{skill:"Learning",q:"Tell me about a skill you recently learned and how you learned it."}],
job:[
{skill:"Communication",q:"Tell me about yourself and the kind of role you are targeting."},
{skill:"Problem Solving",q:"Tell me about a difficult problem you solved and how you approached it."},
{skill:"Technical Skills",q:"Pick one skill from your resume and explain how you have used it in a real project."},
{skill:"Project Skills",q:"Walk me through one project or achievement you are most proud of."},
{skill:"Teamwork",q:"Describe a time you disagreed with a teammate or colleague. What did you do?"},
{skill:"Learning",q:"What skill are you currently improving, and what is your plan to improve it?"}]};
function stageGroup(stage){if(/10th|12th/i.test(stage||""))return"school";if(/College/i.test(stage||""))return"college";return"job";}
function splitCsv(v){return Array.isArray(v)?v:String(v||"").split(",").map(x=>x.trim()).filter(Boolean);}
function makeInterview(profile){const group=stageGroup(profile.stage);return{id:crypto.randomUUID(),group,stage:profile.stage,focus:group==="school"?splitCsv(profile.interests):splitCsv(profile.skills),questions:interviewQuestions[group].slice(),index:0,answers:[],weakSkills:[],startedAt:new Date().toISOString()};}
function evaluateAnswer(q,a){const words=String(a||"").trim().split(/\s+/).filter(Boolean);const length=Math.min(45,words.length*3);const evidence=/because|example|project|built|solved|learned|used|result|team|step|first|then|finally/i.test(a||"")?30:10;const clarity=/[.!?]/.test(a||"")?15:8;const score=Math.min(100,length+evidence+clarity);return{score,feedback:score>=70?"Good answer. Add one concrete example to make it stronger.":score>=45?"Decent start. Explain your approach with a specific example or result.":"Answer is too brief. Explain your thinking, steps and an example.",weak:score<55};}
function calculateATS(resumeText, profile, analysis) {
  const raw=String(resumeText||"");
  const lower=raw.toLowerCase();
  const target=(profile?.goals||analysis?.top?.[0]?.name||"Software Engineer").toString();
  const role=analysis?.top?.[0]?.name || target;
  const roleMap={
    "Software Engineer":["software engineer","java","javascript","python","data structures","algorithms","problem solving","git","github","sql","rest api","html","css","project"],
    "Data Analyst":["data analyst","sql","excel","python","statistics","power bi","data visualization","dashboard","project"],
    "UI/UX Designer":["ui","ux","user research","wireframing","visual design","prototyping","figma","portfolio","case study"],
    "Business Analyst":["business analyst","excel","sql","problem solving","communication","power bi","requirements","dashboard","project"]
  };
  const keywords=roleMap[role]||roleMap["Software Engineer"];
  const matched=keywords.filter(k=>lower.includes(k));
  const missing=keywords.filter(k=>!lower.includes(k));
  const keywordScore=Math.round((matched.length/keywords.length)*40);
  const sections=["summary","objective","education","skills","technical skills","projects","experience","achievements","certifications","coursework","activities","interests"];
  const foundSections=sections.filter(x=>lower.includes(x));
  const sectionScore=Math.min(18,Math.round((foundSections.length/8)*18));
  const contactScore=(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(raw)?4:0)+(/\+?\d[\d\s()-]{8,}/.test(raw)?3:0)+(/linkedin|github/i.test(lower)?3:0);
  const formatScore=(raw.length>=1800&&raw.length<=6500?8:raw.length>=1000?6:3)+(raw.split(/\n+/).length>=18?2:1);
  const actionScore=(/\b(built|developed|created|implemented|designed|participated|led|improved|solved|deployed|analyzed)\b/i.test(raw)?5:2)+(/\b\d+(?:\.\d+)?%\b|\b\d+\+?\b/.test(raw)?5:2);
  const total=Math.max(0,Math.min(100,keywordScore+sectionScore+contactScore+formatScore+actionScore+12));
  const recommendations=[];
  if(missing.length) recommendations.push(`Add relevant keywords: ${missing.slice(0,5).join(", ")}.`);
  if(!/summary|objective/i.test(lower)) recommendations.push("Add a concise professional summary targeted to the role.");
  if(!/linkedin|github/i.test(lower)) recommendations.push("Add LinkedIn and GitHub/portfolio links.");
  if(!/\b\d+(?:\.\d+)?%\b|\b\d+\+?\b/.test(raw)) recommendations.push("Add measurable results to project or achievement bullets where truthful.");
  return {score:total,role,matchedKeywords:matched,missingKeywords:missing,breakdown:{keywordMatch:keywordScore,sections:sectionScore,contact:contactScore,format:formatScore,impact:actionScore,baseline:12},recommendations,disclaimer:"Demo ATS-style estimate. Actual ATS scores vary by employer, job description and parsing system."};
}

function buildProgress(profile,analysis,interview){const top=analysis?.top?.[0];const missing=analysis?.gaps||[];if(!top)return[];const steps=[{title:"Foundation Check",status:"current",detail:`Target: ${top.name}. Start from your current strengths and interests.`,courses:coursesFor(top.name)}];missing.slice(0,5).forEach(skill=>steps.push({title:`Add ${skill}`,status:"next",detail:`This skill is weak or missing. Learn the basics → practise → build a small project → test yourself again.`,courses:coursesFor(skill)}));steps.push({title:"Build Proof",status:"next",detail:`Create ${top.projects[0]} and document what you learned.`,courses:coursesFor(top.name)},{title:"Adaptive Interview",status:"next",detail:"Repeat the interview. Weak answers automatically trigger deeper questions.",courses:coursesFor("Problem Solving")},{title:"Track Progress",status:"next",detail:"Update your skills after every milestone and re-run analysis.",courses:coursesFor("Git")});return steps;}

const catalog = {
  "Software Engineer": { domain: "Technology", skills: ["Programming", "DSA", "Git", "APIs"], tools: ["JavaScript", "Java", "GitHub"], projects: ["Portfolio Website", "Task Manager API"], salary: "₹4–12 LPA" },
  "Data Analyst": { domain: "Data", skills: ["Excel", "SQL", "Statistics", "Visualization"], tools: ["Python", "SQL", "Power BI"], projects: ["Sales Dashboard", "Student Performance Analysis"], salary: "₹4–10 LPA" },
  "UI/UX Designer": { domain: "Design", skills: ["User Research", "Wireframing", "Visual Design", "Prototyping"], tools: ["Figma", "Canva", "FigJam"], projects: ["Mobile App Redesign", "Design System"], salary: "₹3–9 LPA" },
  "Product Designer": { domain: "Design + Product", skills: ["UX", "UI", "Product Thinking", "Prototyping"], tools: ["Figma", "Notion", "FigJam"], projects: ["Product Case Study", "SaaS Dashboard"], salary: "₹5–14 LPA" },
  "Digital Marketer": { domain: "Marketing", skills: ["Content", "SEO", "Analytics", "Social Media"], tools: ["Canva", "Google Analytics", "Meta Ads"], projects: ["Campaign Plan", "Social Growth Case Study"], salary: "₹3–8 LPA" },
  "Cybersecurity Analyst": { domain: "Cybersecurity", skills: ["Networking", "Linux", "Security Basics", "Risk Analysis"], tools: ["Linux", "Wireshark", "Python"], projects: ["Network Audit Lab", "Security Awareness Portal"], salary: "₹4–12 LPA" },
  "Content Creator": { domain: "Media", skills: ["Storytelling", "Video Editing", "Branding", "Social Media"], tools: ["CapCut", "Canva", "Premiere"], projects: ["30-Day Content Series", "Creator Portfolio"], salary: "₹2–10 LPA" },
  "Business Analyst": { domain: "Business", skills: ["Problem Solving", "Excel", "SQL", "Communication"], tools: ["Excel", "SQL", "Power BI"], projects: ["Process Improvement Case", "Business Dashboard"], salary: "₹5–12 LPA" },
  "Teacher / Educator": { domain: "Education", skills: ["Communication", "Subject Expertise", "Presentation", "Planning"], tools: ["Canva", "Google Workspace", "PowerPoint"], projects: ["Interactive Lesson Plan", "Learning Resource Hub"], salary: "₹3–8 LPA" }
};

const jobs = [
  { title: "Frontend Developer Intern", company: "TechNova", type: "Internship", domain: "Technology", location: "Remote", tags: ["JavaScript","React","Git"] },
  { title: "Junior Data Analyst", company: "DataSphere", type: "Job", domain: "Data", location: "Delhi NCR", tags: ["SQL","Excel","Power BI"] },
  { title: "UI/UX Design Intern", company: "PixelWorks", type: "Internship", domain: "Design", location: "Hybrid", tags: ["Figma","UX","Prototyping"] },
  { title: "Social Media Intern", company: "BrandLoop", type: "Internship", domain: "Marketing", location: "Remote", tags: ["Canva","Content","Instagram"] },
  { title: "Cybersecurity Trainee", company: "SecureGrid", type: "Job", domain: "Cybersecurity", location: "Bengaluru", tags: ["Linux","Networking","Security"] },
  { title: "Business Analyst Intern", company: "Insight Labs", type: "Internship", domain: "Business", location: "Gurugram", tags: ["Excel","SQL","Communication"] }
];

function normalize(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9+#. ]/g, " ");
}
function tokens(s) { return normalize(s).split(/\s+/).filter(Boolean); }

function analyze(profile) {
  const interests = Array.isArray(profile.interests) ? profile.interests : [];
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const text = tokens([...interests, ...skills, profile.goals, profile.bio, profile.subjects].join(" "));
  const scored = Object.entries(catalog).map(([name, c]) => {
    const terms = tokens([name, c.domain, ...c.skills, ...c.tools, ...c.projects].join(" "));
    let score = 35;
    const matches = [];
    for (const term of terms) {
      if (term.length > 2 && text.includes(term)) {
        score += 4;
        if (!matches.includes(term)) matches.push(term);
      }
    }
    // interest-specific boosts
    const joined = text.join(" ");
    if ((name.includes("Designer") && /design|creative|drawing|visual|ui|ux|canva|figma/.test(joined))) score += 18;
    if ((name.includes("Engineer") && /coding|programming|software|technology|web|java|python|javascript/.test(joined))) score += 18;
    if ((name.includes("Data") && /data|math|analytics|statistics|excel|sql/.test(joined))) score += 16;
    if ((name.includes("Marketer") && /marketing|social|content|instagram|business/.test(joined))) score += 16;
    if ((name.includes("Cyber") && /security|cyber|network|linux/.test(joined))) score += 16;
    if ((name.includes("Teacher") && /teaching|education|helping|communication/.test(joined))) score += 14;
    score = Math.min(98, score);
    return { name, score, domain: c.domain, skills: c.skills, tools: c.tools, projects: c.projects, salary: c.salary, matched: matches.slice(0,5) };
  }).sort((a,b)=>b.score-a.score);

  const top = scored.slice(0,3);
  const gaps = [...new Set(top.flatMap(x => x.skills))].filter(s => !skills.map(normalize).some(v => v.includes(normalize(s)))).slice(0,6);
  const roadmap = [
    { step: "Discover", detail: "Validate your strongest interests with mini projects and role research." },
    { step: "Learn", detail: `Build foundations in ${top[0].skills.slice(0,3).join(", ")}.` },
    { step: "Build", detail: `Create a portfolio project such as ${top[0].projects[0]}.` },
    { step: "Practice", detail: `Practice ${top[0].skills.slice(0,3).join(", ")} through weekly tasks.` },
    { step: "Apply", detail: "Start with internships, competitions, freelance work or entry-level roles." },
    { step: "Get Hired", detail: "Prepare resume, portfolio, interview stories and targeted applications." },
    { step: "Update Profile", detail: "Re-run your analysis whenever your skills, goals or interests change." }
  ];
  return { top, gaps, roadmap, graph: buildGraph(profile, top), generatedAt: new Date().toISOString() };
}

function buildGraph(profile, top) {
  const nodes = [
    { id:"you", label:"YOU", type:"center" },
    { id:"interest", label:(profile.interests?.[0] || "Interests"), type:"input" },
    { id:"skills", label:(profile.skills?.[0] || "Skills"), type:"input" },
    { id:"goals", label:(profile.goals || "Goals").slice(0,18), type:"input" }
  ];
  top.forEach((r,i)=>nodes.push({id:"career"+i,label:r.name,type:"career",score:r.score}));
  const edges = [
    ["you","interest"],["you","skills"],["you","goals"],
    ["interest","career0"],["skills","career0"],["goals","career1"],["skills","career2"]
  ];
  return {nodes, edges};
}

app.post("/api/signup", (req,res)=>{
  const {name,email,password} = req.body;
  if (!name || !email || !password || password.length < 6) return res.status(400).json({error:"Name, email and a 6+ character password are required."});
  const users = readUsers();
  if (users.some(u=>u.email.toLowerCase()===email.toLowerCase())) return res.status(409).json({error:"An account with this email already exists."});
  const {salt,hash} = hashPassword(password);
  const user = { id:crypto.randomUUID(), name, email, salt, hash, profile:null, analysis:null, interview:null, resume:null, progress:null, createdAt:new Date().toISOString() };
  users.push(user); writeUsers(users);
  const token=crypto.randomBytes(32).toString("hex"); sessions.set(token,user.id);
  res.json({token,user:{id:user.id,name:user.name,email:user.email}});
});

app.post("/api/login",(req,res)=>{
  const {email,password}=req.body; const user=readUsers().find(u=>u.email.toLowerCase()===String(email||"").toLowerCase());
  if(!user || !verifyPassword(password||"",user.salt,user.hash)) return res.status(401).json({error:"Invalid email or password."});
  const token=crypto.randomBytes(32).toString("hex"); sessions.set(token,user.id);
  res.json({token,user:{id:user.id,name:user.name,email:user.email},profile:user.profile,analysis:user.analysis,interview:user.interview,progress:user.progress,resume:user.resume,ats:user.ats});
});

app.get("/api/me",auth,(req,res)=>res.json({user:{id:req.user.id,name:req.user.name,email:req.user.email},profile:req.user.profile,analysis:req.user.analysis,interview:req.user.interview,progress:req.user.progress,resume:req.user.resume,ats:req.user.ats}));

app.post("/api/profile",auth,(req,res)=>{
  const allowed=["stage","classYear","stream","college","subjects","interests","skills","goals","bio","location","experience","projects","preferredMode"];
  const profile={}; for(const k of allowed) profile[k]=req.body[k];
  const users=readUsers(); const i=users.findIndex(u=>u.id===req.user.id);
  users[i].profile=profile; users[i].analysis=analyze(profile); users[i].interview=makeInterview(profile); users[i].progress=buildProgress(profile,users[i].analysis,users[i].interview); users[i].ats=calculateATS(users[i].profile, users[i].resume?.text||""); writeUsers(users);
  res.json({profile,analysis:users[i].analysis,interview:users[i].interview,progress:users[i].progress,ats:users[i].ats});
});

app.post("/api/analyze",auth,(req,res)=>{
  const profile=req.user.profile || req.body;
  if(!profile || !profile.stage) return res.status(400).json({error:"Complete your profile first."});
  const users=readUsers(); const i=users.findIndex(u=>u.id===req.user.id);
  users[i].analysis=analyze(profile); writeUsers(users);
  res.json(users[i].analysis);
});


app.post("/api/interview/start",auth,(req,res)=>{if(!req.user.profile)return res.status(400).json({error:"Complete your profile first."});const users=readUsers(),i=users.findIndex(u=>u.id===req.user.id);users[i].interview=makeInterview(users[i].profile);writeUsers(users);res.json(users[i].interview);});
app.post("/api/interview/answer",auth,(req,res)=>{const users=readUsers(),i=users.findIndex(u=>u.id===req.user.id),it=users[i].interview;if(!it)return res.status(400).json({error:"Start an interview first."});const q=it.questions[it.index];if(!q)return res.json({done:true,interview:it});const evaluation=evaluateAnswer(q,req.body.answer);it.answers.push({question:q,answer:req.body.answer,evaluation,at:new Date().toISOString()});let next=null;if(evaluation.weak){it.weakSkills.push(q.skill);next={skill:q.skill,q:`Let's go deeper on ${q.skill}. Pichle answer ko improve karte hue ek specific example do: tumne exactly kya kiya, kya difficulty aayi, aur result kya raha?`};}else{it.index++;next=it.questions[it.index]||null;}if(!next)it.index=it.questions.length;users[i].interview=it;users[i].progress=buildProgress(users[i].profile,users[i].analysis,it);writeUsers(users);res.json({evaluation,next,done:!next,interview:it,progress:users[i].progress});});
app.get("/api/interview",auth,(req,res)=>res.json(req.user.interview||null));
app.post("/api/resume",auth,upload.single("resume"),async(req,res)=>{if(!req.file)return res.status(400).json({error:"Upload a PDF, DOCX or TXT resume."});try{let text="";const ext=path.extname(req.file.originalname).toLowerCase();if(ext===".pdf")text=(await pdfParse(req.file.buffer)).text;else if(ext===".docx")text=(await mammoth.extractRawText({buffer:req.file.buffer})).value;else text=req.file.buffer.toString("utf8");text=text.replace(/\s+/g," ").trim().slice(0,30000);const found=skillBank.filter(sk=>text.toLowerCase().includes(sk.toLowerCase()));const users=readUsers(),i=users.findIndex(u=>u.id===req.user.id);users[i].resume={name:req.file.originalname,size:req.file.size,text,extractedSkills:found,uploadedAt:new Date().toISOString()}; users[i].ats=calculateATS(users[i].profile||{},text);if(users[i].profile){users[i].profile.skills=[...new Set([...splitCsv(users[i].profile.skills),...found])];users[i].analysis=analyze(users[i].profile);users[i].progress=buildProgress(users[i].profile,users[i].analysis,users[i].interview);}users[i].ats=calculateATS(text,users[i].profile,users[i].analysis);writeUsers(users);res.json({resume:users[i].resume,profile:users[i].profile,analysis:users[i].analysis,progress:users[i].progress,ats:users[i].ats});}catch(e){res.status(400).json({error:"Could not read that resume. Try a text-based PDF, DOCX or TXT."});}});
app.get("/api/jobs",auth,(req,res)=>{
  const analysis=req.user.analysis; const domain=analysis?.top?.[0]?.domain;
  const ranked=jobs.map(j=>({...j,match:domain===j.domain?95:Math.max(58,85-(domain?10:0))})).sort((a,b)=>b.match-a.match);
  res.json(ranked);
});

app.get("/api/roadmap",auth,(req,res)=>res.json(req.user.analysis?.roadmap || []));
app.post("/api/logout",auth,(req,res)=>{sessions.delete(req.token);res.json({ok:true});});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

app.listen(PORT,()=>console.log(`AI Career Mentor running at http://localhost:${PORT}`));
