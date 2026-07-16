Start the full FamilyOS development environment (API + mobile).

Steps:

1. Kill anything on ports 3000 and 8081:
   ```
   pkill -f "tsx.*src/index" 2>/dev/null; pkill -f "expo start" 2>/dev/null; true
   ```

2. Start API in background:
   ```
   cd /Users/mohammadshahabaaz_1/Shahabaaz_personal_development/FamilyTree/apps/api && npx tsx --env-file=.env src/index.ts > /tmp/api.log 2>&1 &
   ```

3. Wait 3 seconds, health-check:
   ```
   sleep 3 && curl -s http://localhost:3000/health
   ```
   If not {"status":"ok",...} → show last 30 lines of /tmp/api.log and stop.

4. Start Expo in background:
   ```
   cd /Users/mohammadshahabaaz_1/Shahabaaz_personal_development/FamilyTree/apps/mobile && npx expo start --web > /tmp/expo.log 2>&1 &
   ```

5. Wait 5 seconds, check Expo is listening:
   ```
   sleep 5 && curl -s -o /dev/null -w "%{http_code}" http://localhost:8081
   ```

6. Report status:
   - API: up at http://localhost:3000
   - Mobile: up at http://localhost:8081
   - Test login: 9581469690 / 123456

If either service fails, show the relevant log tail and diagnose before reporting done.
