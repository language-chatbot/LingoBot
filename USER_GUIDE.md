# LingoQuest Platform Guide

Welcome to **LingoQuest**, a premium interactive language education platform that supports self-paced student cohorts, interactive glossary definitions, multimedia learning, and personalized AI chatbot conversations.

---

## 🌟 Student Learning Guide

As a student, LingoQuest helps you learn new languages using interactive timelines, audio/video lessons, and an AI-driven chatbot assistant.

### 1. Registration and Logging In
* Go to the login screen and toggle to **Sign Up** to register with your Name, Email, and Password.
* You will be logged in immediately after signing up.

### 2. Cohort Self-Selection
* Upon logging in, you will see the **Cohort Selection** page.
* You can choose and join **any cohort** (e.g., *Korean Middle School* or *Japanese University Cohort A*) at any time to access its curriculum.
* You can easily switch cohorts from your profile dashboard to try different lessons.

### 3. The Activity Timeline (Checklist)
* Once you select a cohort, you will see a visual map of activities in recommended order.
* Activities consist of three main types:
  * 📖 **Reading**: Text passage comprehension.
  * 🎧 **Listening**: Pronunciation and audio guides.
  * 📺 **Video**: Travel vlogs and visual culture tutorials.
* Click any activity card to enter the lesson space.

### 4. Interactive Glossary Tooltips
* Inside **Reading** activities, key terms have a **dashed cyan outline**.
* Click any outlined word to open a popup tooltip displaying its definition, grammar notes, or translation.

### 5. LingoBot (AI Conversational Tutor)
* On the right side of the lesson workspace, you can converse with **LingoBot**, a conversational AI tutor.
* LingoBot is context-aware: it knows what activity you are working on and helps you practice vocabulary and answer questions about the reading passage or media file.

### 6. Marking Progress
* Once you finish reviewing the lesson and practicing with LingoBot, click the **Mark Done** button.
* The system will update your checklist timeline nodes from *In Progress* (purple glowing icon) to *Completed* (green checkmark).

---

## 👑 Teacher / Admin Portal Guide

As an administrator, you have access to a central dashboard to configure classes, build content libraries, tag interactive vocabulary, and monitor student conversations.

### 1. Overview Stats
* The landing tab displays global statistics, including **Total Students**, **Total Cohorts**, **Total Activities**, and **Completion Rates**.

### 2. Groups (Cohorts)
* Create new student groups/cohorts by setting a Group Name and Description.
* View all available cohorts in the system.

### 3. Users List
* View a list of all registered users (Teachers/Admins and Students).
* Track their registration dates, roles, and which cohorts they have enrolled in.

### 4. Content Library
* Upload materials to make them available for lessons:
  * **Reading Passages**: Type or paste article paragraphs directly.
  * **Multimedia Files**: Upload `.mp3`/`.wav` audio guides or `.mp4` videos.

### 5. Glossary Tagger
* Select any reading passage from your library.
* Highlight any word or phrase with your mouse cursor directly in the viewer.
* Enter a definition and click **Tag Vocabulary** to instantly generate an interactive dashed-cyan glossary term for students!

### 6. Activity Planner
* Build lessons by assigning content library items to cohorts:
  * Choose a Title.
  * Select the Cohort (Group).
  * Select the Content (Reading/Listening/Video).
  * Set a Sort Index (Order) to arrange them in the student's timeline.

### 7. Logs & Audit Checks (Real-Time Monitor)
* **Progress Auditor**: Review when students started or completed each activity.
* **LingoBot Dialogue Monitor**: View the complete chat transcripts between students and LingoBot to review student participation and performance.

---

## 💡 Quick Tips for Render.com Deployments
* **Theme Customization**: Toggle between Light and Dark mode using the Sun/Moon button in the top-right corner.
* **Auto-Seeding**: When deploying to a clean production database, visit `https://YOUR-BACKEND-NAME.onrender.com/api/auth/temp-seed` once to automatically populate standard groups, test users, and default activities!
