/**
 * Node smoke test — uygulamanın kullandığı gerçek ToastQueue + legacy mapper.
 * Çalıştır: npm test
 */
const assert = require('assert');
const {
  createToastQueue,
} = require('../src/main/toast/ToastQueue');
const {
  mapLegacyToastConfig,
} = require('../src/main/toast/mapLegacyToastConfig');
const packageManifest = require('../package.json');

// --- tests ---
assert.strictEqual(
  packageManifest.files.some(path => path === 'examples' || path.startsWith('examples/')),
  false,
  'examples must stay out of the npm package',
);

const q = createToastQueue();
let s = q.enqueue({id: '1'}, {mode: 'stack', maxVisible: 2});
s = q.enqueue({id: '2'}, {mode: 'stack', maxVisible: 2});
s = q.enqueue({id: '3'}, {mode: 'stack', maxVisible: 2});
assert.strictEqual(s.visible.length, 2, 'stack maxVisible=2');
assert.strictEqual(s.pending.length, 1, 'overflow pending');

s = q.dismiss('1');
assert.strictEqual(s.visible.map(x => x.id).join(','), '2,3', 'promote after dismiss');

// Queue yeni kartı öne alır; stack grubu queue kapanınca geri gelir.
const q2 = createToastQueue();
q2.enqueue({id: 'a'}, {mode: 'stack', maxVisible: 3});
q2.enqueue({id: 'b'}, {mode: 'stack', maxVisible: 3});
s = q2.enqueue({id: 'legacy'}, {mode: 'queue'});
assert.strictEqual(s.visible.length, 1, 'queue interrupts to 1 visible');
assert.strictEqual(s.visible[0].id, 'legacy');
assert.strictEqual(s.pending.length, 2, 'previous parked in pending');
s = q2.dismiss('legacy');
assert.strictEqual(s.visible.map(x => x.id).join(','), 'a,b', 'stack resumes after queue');

// Art arda queue çağrıları hiçbir zaman aynı anda görünmez.
const q3 = createToastQueue();
q3.enqueue({id: 'queue-a'}, {mode: 'queue'});
q3.enqueue({id: 'queue-b'}, {mode: 'queue'});
s = q3.enqueue({id: 'queue-c'}, {mode: 'queue'});
assert.deepStrictEqual(s.visible.map(x => x.id), ['queue-c']);
s = q3.dismiss('queue-c');
assert.deepStrictEqual(s.visible.map(x => x.id), ['queue-b']);
s = q3.dismiss('queue-b');
assert.deepStrictEqual(s.visible.map(x => x.id), ['queue-a']);

// Aktif queue sırasında gelen stack kartı beklemeli.
const q4 = createToastQueue();
q4.enqueue({id: 'queue'}, {mode: 'queue'});
s = q4.enqueue({id: 'stack'}, {mode: 'stack', maxVisible: 3});
assert.deepStrictEqual(s.visible.map(x => x.id), ['queue']);
assert.deepStrictEqual(s.pending.map(x => x.id), ['stack']);

// Aynı id içerik olarak güncellenir, yeni kart oluşturmaz.
const q5 = createToastQueue();
q5.enqueue({id: 'same', message: 'old'}, {mode: 'stack'});
s = q5.enqueue({id: 'same', message: 'new'}, {mode: 'stack'});
assert.strictEqual(s.visible.length, 1);
assert.strictEqual(s.visible[0].message, 'new');

// clear görünür ve bekleyen tüm öğeleri döndürür.
const q6 = createToastQueue();
q6.enqueue({id: 'visible'}, {mode: 'stack', maxVisible: 1});
q6.enqueue({id: 'pending'}, {mode: 'stack', maxVisible: 1});
s = q6.clear();
assert.deepStrictEqual(s.removed.map(x => x.id), ['visible', 'pending']);
assert.strictEqual(s.visible.length, 0);
assert.strictEqual(s.pending.length, 0);

const legacy = mapLegacyToastConfig({
  id: 0,
  title: 'T',
  text: 'Hello',
  position: 'top',
  timing: 3000,
  backgroundColor: '#702c91',
});
assert.strictEqual(legacy.id, '0');
assert.strictEqual(legacy.position, 'top');
assert.strictEqual(legacy.message, 'Hello');
assert.strictEqual(legacy.mode, 'stack');
assert.strictEqual(legacy.duration, 3000);

console.log('OK — ToastQueue + legacy map smoke passed');
