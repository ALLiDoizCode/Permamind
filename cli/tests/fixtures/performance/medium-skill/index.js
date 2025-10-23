// Medium test skill - performance fixture
// This file is padded to approximately 1MB total bundle size

const generateLargeData = (count) => {
  return Array(count).fill(0).map((_, i) => ({
    id: i,
    name: `Item ${i}`,
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10),
    content: 'Detailed content information. '.repeat(50),
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      tags: ['tag1', 'tag2', 'tag3'],
      attributes: {
        color: 'blue',
        size: 'medium',
        weight: Math.random() * 100
      }
    }
  }));
};

module.exports = {
  name: 'medium-test-skill',
  version: '1.0.0',
  data: generateLargeData(100)
};
