@echo off
echo 🚀 Deploying Money Manager App to GitHub Pages...

echo 📝 Adding files...
git add .

echo 💬 Committing changes...
set /p message="Enter commit message (or press Enter for default): "
if "%message%"=="" set message=📱 Update: Mobile responsive improvements

git commit -m "%message%"

echo 📤 Pushing to GitHub...
git push origin main

echo ✅ Deploy completed! 
echo 🌐 Your site will be available at: https://TUO_USERNAME.github.io/MoneyManagerApp_Client
echo ⏱️ Changes may take 2-10 minutes to appear online.

pause
