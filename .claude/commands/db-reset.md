Reset and reseed the FamilyOS development database.

Steps:
1. Confirm postgres is running:
   ```
   docker compose -f /Users/mohammadshahabaaz_1/Shahabaaz_personal_development/FamilyTree/docker-compose.yml ps
   ```
   If postgres is not running, start it:
   ```
   docker compose -f /Users/mohammadshahabaaz_1/Shahabaaz_personal_development/FamilyTree/docker-compose.yml up -d
   ```

2. Wipe the public schema:
   ```
   docker exec familytree-postgres-1 psql -U familyos -d familyos -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO familyos; GRANT ALL ON SCHEMA public TO public;"
   ```

3. Push the Prisma schema (non-interactive — do NOT use migrate dev):
   ```
   cd /Users/mohammadshahabaaz_1/Shahabaaz_personal_development/FamilyTree/apps/api && npx prisma db push --skip-generate
   ```

4. Run the seed script:
   ```
   cd /Users/mohammadshahabaaz_1/Shahabaaz_personal_development/FamilyTree/apps/api && npm run db:seed
   ```

5. Show the output summary from seed (it prints tree IDs and user credentials).

If any step fails, show the full error and stop. Do not skip steps.

After success, the following accounts are available (all in Khan Family tree):
- testuser    / 9581469690   / 123456
- tariq_khan  / +923001234567 / demo1234
- aryan_sharma / +919001112233 / demo1234  (Sharma Family tree)
