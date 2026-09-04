# AI Career Mentor — Full-Stack Local Demo

This project turns the uploaded AI Career Mentor concept into a working local website.

## What is implemented

- Sign up + login with password hashing
- Persistent local user data in `data/users.json`
- Student journey selection:
  - 10th Student
  - 12th Student
  - College Student
  - Graduate / Pass-out
  - Job Seeker
- Profile capture: academics, interests, skills, goals, projects, experience, location and preferred work mode
- AI-style career matching engine (local, deterministic demo; no API key required)
- Personalized Career Graph
- Career match scores
- Skill-gap detection
- Project recommendations
- 7-step personalized roadmap
- Opportunity/job matching demo
- Re-analysis when profile changes
- Responsive dark neon UI inspired by the supplied pitch deck

## Run in VS Code

1. Open this folder in VS Code.
2. Open Terminal.
3. Run:
   `npm install`
4. Then:
   `npm start`
5. Open:
   `http://localhost:3000`

The backend and frontend are served by the same Express server.

## Demo flow for hackathon

1. Sign up.
2. Select "12th Student", "College Student", "Graduate / Pass-out", or "Job Seeker".
3. Enter interests such as `coding, design, problem solving`.
4. Add skills such as `Java, Canva, Excel`.
5. Add goals.
6. Click "Save & Run AI Analysis".
7. Show Dashboard → Career Graph → Roadmap → Opportunities.
8. Change a skill/interest and re-run analysis to demonstrate continuous recalibration.

## Where the pitch deck maps

- Page 2: multiple student stages
- Page 3: whole-student profile → AI career intelligence → personalized career graph
- Page 4: career graph instead of resume-only analysis
- Page 5: sign up → interests → profile → AI analysis → career graph → roadmap → matches
- Page 6: separate journeys for school, college, graduate/pass-out
- Page 7: profile understanding, interest analysis, skill matching, career matching, gap detection and continuous recalibration
- Page 8: all-in-one dashboard
- Page 9: interests → career matches → real-world opportunity direction
- Page 10: discover → learn → build → practice → apply → get hired → update profile
- Page 11: simple tech stack + REST API + persistent storage + intelligence layer
- Page 12: extensible modules such as career graph, AI voice interviews, skill analysis, mock interviews, coding evaluator and mentor/portfolio tools
- Pages 13–14: outcome framing around direction, preparation and opportunity

## Important

The opportunity feed is intentionally demo data so the project works without third-party API keys. For production, replace `/api/jobs` with a verified jobs provider/API.

The "AI" layer is implemented locally as a transparent scoring engine so you can demonstrate the full workflow offline. For a production version, connect `/api/analyze` to an LLM and keep the same frontend contract.


## Adaptive features

- 10th/12th: interest-first onboarding and school-interest chatbot; no location/preferences required.
- College: skill + project-focused interview.
- Graduate/job seeker: skills, resume and job-readiness interview.
- Weak interview answers trigger a deeper follow-up on the same skill.
- Resume upload supports PDF/DOCX/TXT and extracts mapped skills locally.
- Skill gaps become roadmap milestones: learn → practise → build proof → re-interview → track.

- Role-aware ATS Match Score (keyword, section, parsing and goal alignment) with missing keyword suggestions.
- AI interview is fully English with score, strengths, improvement feedback, and adaptive weak-skill follow-ups.

- Roadmap now recommends 1–2 relevant learning courses/resources for each missing skill and milestone, with clickable links.

Contributor-Muskan Kwatra,Khushi Devi,Nancy
