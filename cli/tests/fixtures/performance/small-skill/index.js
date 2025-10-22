// Small test skill - performance fixture
// This file is padded to approximately 100KB total bundle size

const data = Array(10).fill(0).map((_, i) => ({
  id: i,
  name: `Item ${i}`,
  description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  metadata: {
    created: new Date().toISOString(),
    modified: new Date().toISOString()
  }
}));

module.exports = {
  name: 'small-test-skill',
  version: '1.0.0',
  data
};
