import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Resolve source before changing directory. Never run test writes against live data/.
const root = process.cwd();
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'voting-import-smoke-'));
process.chdir(scratch);
process.env.NODE_ENV = 'test';
const source = file => import(pathToFileURL(path.join(root, file)).href);
const { default: express } = await source('node_modules/express/index.js');
const { default: jwt } = await source('node_modules/jsonwebtoken/index.js');
const { db } = await source('server/db.ts');
const { config } = await source('server/config.ts');
const { saveDatabaseSync, initPersistence } = await source('server/persistence.ts');
const app = express();
app.use(express.json());
const routes = [
  ['academicRoutes', 'academicRouter'], ['studentRoutes', 'studentRouter'],
  ['importRoutes', 'importRouter'], ['brandingRoutes', 'brandingRouter'],
  ['sessionRoutes', 'sessionRouter'], ['presentationRoutes', 'presentationRouter'],
  ['publicRoutes', 'publicRouter']
];
for (const [file, name] of routes) app.use('/api', (await source(`server/routes/${file}.ts`))[name]);
app.use(express.static(path.join(root, 'dist')));
app.get('/{*path}', (_req, res) => res.sendFile(path.join(root, 'dist/index.html')));
db.users = [1, 2, 3].map(id => ({ id, username: `test${id}`, full_name: `Test ${id}`,
  role: id === 1 ? 'ADMIN' : 'LECTURER', active: true, must_change_password: false,
  auth_version: 0, password_hash: '', theme_color: '#0d9488' }));
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
async function request(user, method, url, body, status = 200) {
  const token = jwt.sign({ sub: String(user), ver: 0 }, config.secretKey);
  const response = await fetch(base + '/api' + url, { method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body) });
  assert.equal(response.status, status, `${method} ${url}`);
  return response.status === 204 ? null : response.json();
}
try {
  const loginSource = fs.readFileSync(path.join(root, 'src/pages/Login.tsx'), 'utf8');
  assert.doesNotMatch(loginSource, /fillCreds|Test Credentials|Διαπιστευτήρια Δοκιμών|lecturer123|admin \/ admin/);
  await request(2, 'PUT', '/branding', { enable_demo: false }, 403);
  await request(1, 'PUT', '/branding', { enable_demo: 'false' }, 422);
  await request(1, 'PUT', '/branding', { enable_demo: false });
  assert.equal(db.globalBranding.enable_sample_fixture_button, false);
  const counts = [db.periods.length, db.sessions.length];
  for (const user of [1, 2]) await request(user, 'POST', '/import/sample-fixture', {}, 403);
  await request(1, 'POST', '/admin/demo-session', {}, 403);
  assert.deepEqual([db.periods.length, db.sessions.length], counts);
  saveDatabaseSync(); db.globalBranding.enable_demo = true;
  assert.ok(initPersistence()); assert.equal(db.globalBranding.enable_demo, false);
  await request(1, 'PUT', '/branding', { enable_demo: true });
  await request(2, 'POST', '/import/sample-fixture', {});
  const group = db.groups[0];
  const payload = { group_id: group.id, csv_data: 'full_name,presentation_title\nImport Student,Topic' };
  const count = db.students.length;
  for (const endpoint of ['/import/students', '/import/students-csv']) {
    await request(3, 'POST', endpoint, payload, 403);
    assert.equal(db.students.length, count);
  }
  await request(2, 'POST', '/import/students-csv', payload);
  assert.equal(db.students.length, count + 1);
  await request(2, 'POST', '/import/hierarchy-csv', {
    csv: 'period,course,group,full_name,presentation_title\nImport Period,Course,Group,Student,Title'
  });
  const { localToday } = await source('src/utils/dates.ts');
  assert.equal(localToday(new Date(2026, 9, 18, 0, 30)), '2026-10-18');
  const sessionInput = { course_id: group.course_id, period_id: group.period_id, group_id: group.id };
  const before = db.sessions.length;
  for (const session_date of [undefined, '', '2026-02-30', '18/10/2026']) {
    await request(2, 'POST', '/sessions', { ...sessionInput, session_date }, 422);
    assert.equal(db.sessions.length, before);
  }
  const created = await request(2, 'POST', '/sessions', { ...sessionInput, session_date: '2026-11-23' }, 201);
  const stored = db.sessions.find(s => s.id === created.id);
  assert.equal(stored.session_date, '2026-11-23');
  assert.deepEqual(db.criteria.filter(c => c.session_id === stored.id).map(c => [c.name,c.weight]), [
    ['Τεκμηρίωση',40], ['Λογική Δομή',30], ['Παρουσίαση',30]
  ]);
  await request(2, 'PUT', `/sessions/${stored.id}`, { session_date: '2026-02-30' }, 422);
  assert.equal(stored.session_date, '2026-11-23');
  await request(2, 'PUT', `/sessions/${stored.id}`, { title: 'Updated title' });
  assert.equal(stored.session_date, '2026-11-23');
  db.criteria.push({id:db.nextCriterionId++,session_id:stored.id,name:'Κριτική σκέψη',weight:55,position:3});
  saveDatabaseSync(); initPersistence();
  assert.equal(db.sessions.find(s => s.id === created.id).session_date, '2026-11-23');
  assert.equal(db.criteria.find(c => c.name === 'Κριτική σκέψη').weight,55);
  console.log('PASS: date validation/persistence, local calendar default, new criteria and historical criteria preservation');
  await request(1, 'POST', '/admin/demo-session', {});
  const session = db.sessions.find(s => s.is_demo);
  assert.ok(session);
  await request(1, 'POST', `/sessions/${session.id}/complete`, {});
  assert.equal(session.results_revealed, false);
  assert.equal((await request(1, 'GET', `/public/sessions/${session.public_id}`)).results, null);
  await request(3, 'POST', `/sessions/${session.id}/reveal`, {}, 403);
  await request(1, 'POST', `/sessions/${session.id}/reveal`, {});
  assert.ok(Array.isArray((await request(1, 'GET', `/public/sessions/${session.public_id}`)).results));
  await request(1, 'POST', `/sessions/${session.id}/archive`, {});
  assert.equal(session.status, 'ARCHIVED');
  // Disabled demo mode must not prevent real student participation.
  const real = { ...session, id: db.nextSessionId++, public_id: 'real-test-session',
    status: 'ACTIVE', is_demo: false, results_revealed: false };
  db.sessions.push(real);
  await request(1, 'PUT', '/branding', { enable_demo: false });
  assert.ok((await request(2, 'POST', `/public/sessions/${real.public_id}/tokens`, {})).token);
  saveDatabaseSync();
  assert.equal(JSON.parse(fs.readFileSync('data/db.json', 'utf8')).globalBranding.enable_demo, false);
  console.log('PASS: login exclusion, demo toggle authorization/persistence, disabled insertion, enabled demo, CSV aliases/ownership, explicit results reveal, archive and real participation');
  if (process.env.SMOKE_BROWSER === '1') {
    console.log(`BROWSER_TEST_URL=${base}`);
    await new Promise(() => {});
  }
} catch (error) {
  console.error(error); process.exitCode = 1;
} finally {
  server.close();
  process.exit(process.exitCode || 0);
}
