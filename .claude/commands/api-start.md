Start the FamilyOS API development server.

Steps:
1. Kill any process on port 3000:
   ```
   pkill -f "tsx.*src/index" 2>/dev/null; sleep 1; true
   ```

2. Start the API in the background:
   ```
   cd /Users/mohammadshahabaaz_1/Shahabaaz_personal_development/FamilyTree/apps/api && npx tsx --env-file=.env src/index.ts > /tmp/api.log 2>&1 &
   ```

3. Wait 4 seconds then health-check:
   ```
   sleep 4 && curl -s http://localhost:3000/health
   ```

4. If response is `{"status":"ok",...}` → report "API is up on :3000" and show version.
   If it fails → show `tail -30 /tmp/api.log` and diagnose the error before reporting.

5. Quick smoke-test the auth endpoint:
   ```
   curl -s -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"mobileNumber":"9581469690","password":"123456"}'
   ```
   Report whether login returns 200 with accessToken or an error.

Routes are at `/api/v1/*` for authenticated endpoints, `/api/trees/*` for Phase 0 read-only.
