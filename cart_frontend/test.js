const fetch = require('node-fetch');

(async () => {
  try {
    const submitRes = await fetch('http://localhost:3500/mobile/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'FakeItem 2\nAnotherFake 1\nMilk 1' })
    });
    console.log('Submit Res:', await submitRes.text());

    const statusRes = await fetch('http://localhost:3500/mobile/status');
    console.log('Status Res:', await statusRes.text());
  } catch (err) {
    console.error(err);
  }
})();
