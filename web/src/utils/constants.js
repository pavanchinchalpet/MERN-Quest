export const PRACTICE_CATEGORIES = [
  { id: 'all', name: 'All Practice', icon: 'Target' },
  { id: 'dsa', name: 'DSA', icon: 'Layers', subcategories: ['Arrays', 'Strings', 'HashMap', 'Trees', 'Graphs', 'DP'] },
  { id: 'react', name: 'React', icon: 'Atom', subcategories: ['Hooks', 'State Management', 'Components', 'Performance', 'Interview Questions'] },
  { id: 'sql', name: 'SQL', icon: 'Database', subcategories: ['Joins', 'Aggregation', 'Query Optimization', 'Indexes'] },
  { id: 'python', name: 'Python', icon: 'Code', subcategories: ['Basics', 'Data Structures', 'Algorithms', 'Functions'] },
  { id: 'java', name: 'Java', icon: 'Terminal', subcategories: ['OOPs', 'Collections', 'Multithreading', 'Basics'] },
];

export const ASSESSMENT_ICON_MAP = {
  react: 'Atom',
  javascript: 'FileCode',
  js: 'FileCode',
  node: 'Server',
  sql: 'Database',
  python: 'Code',
  git: 'GitBranch',
};
