# **Getting Started with Yellow Letter Shop** 🚀

## Your First Day as a YLS Developer

*Welcome to the team\! Let's get you from zero to coding hero in about 30 minutes.*

Hey there, and welcome aboard\! 👋 We're so excited to have you join the Yellow Letter Shop team. If you're feeling a bit overwhelmed looking at all our documentation, don't worry \- that's totally normal\! Think of this guide as your friendly tour guide who's going to walk you through everything step by step.

**What we'll accomplish together:**

- Get your computer ready for YLS development (like setting up your workshop)  
- Download and run the app locally (like test-driving the car before you work on it)  
- Make your first tiny change (like changing a lightbulb to learn how the house works)  
- Submit your first pull request (like showing your work to the team)

**Time needed:** About 30 minutes (plus download time)  
**Skill level:** Perfect for beginners, but useful for everyone\!

---

## **🎯 Step 1: The "Am I Ready?" Checklist**

Before we start cooking, let's make sure we have all our ingredients\! Don't worry if you don't have everything \- we'll help you get what's missing.

### **Essential Tools (Must Have)**

**Node.js \- Think of this as the "engine" that runs our app**

\# Check if you have it (run this in your terminal/command prompt)

node \--version

\# You should see something like: v18.17.0 or higher

\# If you get "command not found" or a version lower than 18, you need to install it

**Where to get it:** Go to [nodejs.org](https://nodejs.org) and download the "LTS" version (LTS means "Long Term Support" \- basically the stable, reliable version)

**Git \- This is like our "time machine" for code**

\# Check if you have it

git \--version

\# You should see something like: git version 2.34.1

**Where to get it:** Most computers have this, but if not, go to [git-scm.com](https://git-scm.com)

### **Really Helpful Tools (Highly Recommended)**

**VS Code \- Your coding home base** This is where you'll spend most of your time. It's like having a really smart notepad that understands code.

- Download from [code.visualstudio.com](https://code.visualstudio.com)  
- **Essential Extensions to Install:**  
  - "ES7+ React/Redux/React-Native snippets" (gives you shortcuts for React code)  
  - "TypeScript Importer" (automatically finds the code pieces you need)  
  - "Tailwind CSS IntelliSense" (helps with styling)  
  - "Prettier \- Code formatter" (makes your code look neat and professional)

**A Terminal/Command Line**

- **Mac:** You already have "Terminal" (find it in Applications)  
- **Windows:** Use "Command Prompt" or better yet, install "Windows Terminal" from the Microsoft Store  
- **Linux:** You know what you're doing 😉

### **🚦 Quick Check: Are You Ready?**

Run these commands. If they all work, you're golden\!

\# These should all return version numbers

node \--version    \# Should be 18 or higher

npm \--version     \# Should be 8 or higher  

git \--version     \# Any recent version is fine

If any of these fail, take a moment to install what's missing. We'll wait right here\! ☕

---

## **🏠 Step 2: Getting the Code (Like Moving Into Your New House)**

Now let's get the Yellow Letter Shop code onto your computer. Think of this like getting the keys to your new house\!

### **The Clone Command (Getting Your Copy)**

\# Navigate to where you want to put the project

\# (I recommend making a "projects" or "code" folder)

cd \~/Desktop  \# or wherever you keep your projects

\# This downloads the entire codebase to your computer

\# Think of it like copying the entire house blueprint

git clone \<repository-url\>

\# Navigate into your new project folder

cd yellow-letter-shop

\# Take a look around\! See what we've got here

ls \-la

\# (On Windows, use: dir)

**What you should see:** A bunch of folders like `app/`, `components/`, `lib/`, etc. Don't worry about understanding all of them yet \- think of them like rooms in a house. You'll learn what each room is for as you explore\!

### **Installing Dependencies (Getting Your Tools Ready)**

This is like going to the hardware store and getting all the tools you need for the project:

\# This magical command reads our "shopping list" (package.json) 

\# and downloads every tool and library we need

npm install

\# This might take a few minutes \- it's downloading thousands of files\!

\# While it runs, it's basically setting up your entire development workshop

**What's happening behind the scenes:** npm (Node Package Manager) is reading our `package.json` file, which is like a recipe that lists all the ingredients (other people's code) our app needs to work. It downloads all of these into a `node_modules` folder.

**Pro tip:** The `node_modules` folder will be HUGE (like 200,000+ files). This is normal\! These are all the building blocks that make modern web development possible.

---

## **⚙️ Step 3: Configuration (Setting Up Your Personal Workspace)**

Every developer needs their own personal settings. It's like adjusting the seat and mirrors in a car before you drive it.

### **Creating Your Environment File**

\# This copies our template settings file to create your personal settings

cp .env.example .env.local

\# Now let's edit your personal settings file

\# Open it in VS Code (or your preferred editor)

code .env.local

**What you'll see in `.env.local`:**

\# Database Configuration \- think of this as the address of our data storage

DATABASE\_URL="your-database-url-here"

NEXT\_PUBLIC\_SUPABASE\_URL="your-supabase-url"

SUPABASE\_ANON\_KEY="your-supabase-anon-key"

SUPABASE\_SERVICE\_ROLE\_KEY="your-supabase-service-role-key"

\# Payment Processing \- how we handle money (don't worry, we use test mode\!)

STRIPE\_SECRET\_KEY="sk\_test\_..."

STRIPE\_PUBLISHABLE\_KEY="pk\_test\_..."

\# External APIs \- connections to other services we use

ACCUZIP\_API\_KEY="your-accuzip-key"

MAILGUN\_API\_KEY="your-mailgun-key"

OPENAI\_API\_KEY="your-openai-key"

### **Don't Panic About the API Keys\!**

You're probably looking at all these empty fields thinking "How am I supposed to know what goes here?\!"

**Here's the secret:** For your first day, you don't need to fill all of these in\! Here's what to do:

1. **Ask your team lead** for a "development environment file" \- they probably have a shared set of development keys  
2. **Or**, just leave them blank for now \- the app might have some features that don't work, but you can still start learning the codebase  
3. **Eventually**, you'll get your own API keys as you work on specific features

**The most important ones to get working:**

- `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_*` keys (so you can see data)  
- `STRIPE_*` keys in test mode (so payment features work in development)

---

## **🎬 Step 4: The Magical Moment (Starting Your Development Server)**

This is it \- the moment when you bring the app to life on your computer\! It's like turning on the engine for the first time.

\# This command starts your local development server

npm run dev

\# You should see something like this:

\> yellow-letter-shop@1.0.0 dev

\> next dev

  ▲ Next.js 14.2.5

  \- Local:        http://localhost:3000

  \- Network:      http://192.168.1.100:3000

 ✓ Ready in 2.3s

**🎉 Success\!** Now open your web browser and go to `http://localhost:3000`

### **What You Should See**

**If everything worked:** You'll see the Yellow Letter Shop homepage\! It might look a bit empty or have some error messages (especially if you don't have all your API keys set up yet), but the important thing is that it loaded.

**If something went wrong:** Don't panic\! Check these common issues:

**Problem:** "Port 3000 is already in use"

\# Solution: Either kill what's running on port 3000, or use a different port

npm run dev \-- \--port 3001

\# Then visit http://localhost:3001 instead

**Problem:** Lots of red error messages

- **Most likely cause:** Missing environment variables  
- **Quick fix:** Ask a teammate for their development `.env.local` file  
- **Or:** Just ignore the errors for now if the page still loads

**Problem:** "Command not found" or "Module not found"

- **Most likely cause:** The `npm install` step didn't complete successfully  
- **Solution:** Try running `npm install` again

---

## **🛠️ Step 5: Making Your First Change (Baby Steps to Success)**

Let's make a tiny change to prove that you can modify the app\! Think of this as leaving your mark on your new workspace.

### **Find a Simple Text to Change**

Let's change something visible but harmless. Open VS Code and navigate to the homepage:

\# If VS Code isn't already open with your project:

code .

\# This opens VS Code with the entire project

**Find this file:** `app/page.tsx` or `app/(dashboard)/dashboard/page.tsx`

Look for some text that you can easily identify on the webpage. It might look something like:

// This might be in your homepage file

\<h1 className="text-3xl font-bold"\>

  Welcome to Yellow Letter Shop

\</h1\>

// Let's change it to:

\<h1 className="text-3xl font-bold"\>

  Welcome to Yellow Letter Shop \- {Your Name} was here\!

\</h1\>

**Replace `{Your Name}` with your actual name\!**

### **See Your Change Live**

Here's the magical part \- **you don't need to restart anything\!**

1. Save the file (Ctrl+S or Cmd+S)  
2. Go back to your browser at `http://localhost:3000`  
3. The page should automatically update with your change\!

**This is called "hot reloading"** \- it's like having a magic mirror that instantly shows your changes. Pretty cool, right?

### **Understanding What You Just Did**

You just:

1. **Modified React/JSX code** \- This is how we build user interfaces  
2. **Used Tailwind CSS classes** \- `text-3xl font-bold` makes the text big and bold  
3. **Experienced hot reloading** \- Your changes appeared instantly  
4. **Made your first contribution** \- You've officially touched the codebase\!

---

## **📤 Step 6: Your First Pull Request (Showing Your Work)**

Now let's share your change with the team\! This process is like submitting homework \- it shows what you've learned and gets feedback from others.

### **Understanding Git (The Time Machine)**

Git keeps track of every change to our code. Think of it like:

- **Commits** \= Saving checkpoints in a video game  
- **Branches** \= Parallel universes where you can experiment safely  
- **Pull Requests** \= Asking to merge your parallel universe changes into the main reality

### **Creating Your Branch**

\# First, let's see what branch you're on

git branch

\# You're probably on "main" \- that's the main version of our code

\# Create your own branch (your own parallel universe to work in)

git checkout \-b my-first-change

\# The name "my-first-change" can be anything descriptive

\# Good examples: feature/add-welcome-message, fix/typo-in-homepage

### **Committing Your Change**

\# First, let's see what files you changed

git status

\# This shows you what's different from the last checkpoint

\# Add your changes to the "staging area" (preparing to save)

git add .

\# The dot (.) means "add all my changes"

\# Create a checkpoint (commit) with a message

git commit \-m "Add personal welcome message to homepage

\- Modified homepage to include developer name

\- First commit as new team member

\- Testing the development workflow"

**Commit Message Best Practices:**

- **First line**: Brief summary (50 characters or less)  
- **Blank line**, then more details if needed  
- **Use present tense**: "Add feature" not "Added feature"  
- **Be descriptive**: Someone should understand what you did without looking at the code

### **Pushing Your Branch**

\# Send your branch to GitHub (like uploading your parallel universe)

git push origin my-first-change

\# If this is your first push to this branch, Git might give you a longer command to run

\# Just copy and paste whatever it suggests

### **Creating the Pull Request**

1. **Go to GitHub** (in your web browser)  
2. **Navigate to your repository**  
3. **You should see a yellow banner** saying "Compare & pull request" for your branch  
4. **Click that button\!**  
5. **Fill out the PR template:**

\#\# What This PR Does

Added a personal welcome message to the homepage to test the development workflow.

\#\# Changes Made

\- Modified \`app/page.tsx\` to include developer name in welcome message

\- Verified hot reloading works correctly

\- Successfully completed first-day development setup

\#\# Testing

\- \[x\] Change appears correctly on localhost:3000

\- \[x\] No console errors

\- \[x\] Hot reloading works as expected

\#\# Notes

This is my first PR as a new team member\! 🎉 Used this change to verify my development environment is set up correctly.

6. **Click "Create Pull Request"**

### **What Happens Next**

Your PR will be reviewed by a team member who will:

- **Look at your changes** \- Make sure everything looks good  
- **Test your code** \- Verify it works on their machine too  
- **Give feedback** \- Suggest improvements or ask questions  
- **Approve and merge** \- Add your changes to the main codebase

**Don't worry if they suggest changes\!** That's normal and how everyone learns. Think of code review as pair programming \- it's collaborative, not judgmental.

---

## **🎉 Step 7: You Did It\! What's Next?**

**Congratulations\!** 🎊 You just completed your first full development cycle:

1. ✅ Set up your development environment  
2. ✅ Got the app running locally  
3. ✅ Made a code change  
4. ✅ Experienced hot reloading  
5. ✅ Created a branch  
6. ✅ Made your first commit  
7. ✅ Submitted your first pull request

**You're officially a YLS developer now\!**

### **Your Next Steps**

**While you wait for your PR to be reviewed:**

1. **Explore the codebase** \- Open different files and see how they work  
     
   - `app/` folder \- This contains all our pages  
   - `components/` folder \- Reusable pieces of user interface  
   - `lib/` folder \- Utility functions and configurations

   

2. **Check out our other documentation:**  
     
   - `development-guide.md` \- Deep dive into how everything works  
   - `api-integrations.md` \- How we connect to external services  
   - `features-and-dashboards.md` \- What features we're building

   

3. **Ask questions\!** \- Seriously, ask lots of questions. Everyone on the team was new once and loves helping newcomers learn.

### **Common Next Tasks for New Developers**

Your team lead will probably give you one of these beginner-friendly tasks:

**Easy Wins (Great for Learning):**

- Update text content or copy  
- Add a new button or UI element  
- Fix spacing or styling issues  
- Add form validation messages

**Intermediate Challenges:**

- Create a new React component  
- Add a new page or route  
- Connect to our database (Supabase)  
- Implement a simple API endpoint

**Advanced Projects (Once You're Comfortable):**

- Build a complete feature (like a new dashboard page)  
- Integrate with external APIs  
- Add comprehensive testing  
- Optimize performance

### **Your Development Environment Shortcuts**

Save these commands \- you'll use them every day:

\# Start the development server (run this every morning)

npm run dev

\# Run tests to make sure you didn't break anything

npm run test

\# Check your code style (make it look professional)

npm run lint

\# Fix code style automatically

npm run lint \--fix

\# Check TypeScript for errors

npm run typecheck

\# Build the app (test if it would work in production)

npm run build

### **Getting Help When You're Stuck**

**Before asking for help** (saves everyone time):

1. Read the error message carefully  
2. Check the browser console (F12 → Console tab)  
3. Try googling the exact error message  
4. Check our documentation

**When you do ask for help** (which you should\!):

1. **Describe what you're trying to do**  
2. **Show the exact error message**  
3. **Share what you've already tried**  
4. **Include screenshots if it's a visual issue**

**Great question example:**

"I'm trying to add a new button to the dashboard, but when I click it, I get this error: `TypeError: Cannot read property 'id' of undefined`. I've checked that the user object exists and I tried adding a null check, but it still happens. Here's my code: \[screenshot\]. What am I missing?"

**Not-so-helpful question:**

"My code doesn't work. Can someone help?"

---

## **🚀 Final Words of Encouragement**

**Remember:** Every expert was once a beginner. Even the most senior developers on our team started exactly where you are right now.

**It's okay to feel overwhelmed** \- there's a lot to learn\! But you don't need to learn it all at once. Focus on one thing at a time, and before you know it, you'll be the one helping the next new person get started.

**You've got this\!** 💪

The fact that you made it through this entire guide shows you have the curiosity and determination to be a great developer. Welcome to the Yellow Letter Shop family\!

---

**Questions? Stuck somewhere? Need help?**

**Reach out to:**

- Your assigned mentor/buddy  
- The team in Slack  
- `support@yellowlettershop.com`

We're all here to help you succeed\! 🌟  
