/* Shared content store for Portfolio.dc.html, CV.dc.html and Admin.dc.html.
   Single source of truth: one localStorage record, seeded from defaults(). */
(function () {
  var KEY = 'mk.portfolio.v2';

  function defaults() {
    var R = function (o) {
      return Object.assign({ depth: 'extended', includeInCv: true, metrics: [], stack: [], bullets: [], caseStudy: { context: '', approach: '', impact: '' } }, o);
    };
    return {
      profile: {
        name: 'Miłosz Kramek', handle: 'milosz', title: 'Senior Full-Stack Engineer',
        tagline: 'Six years building web systems that stay up under real traffic — TypeScript and React on the front, Node.js, NestJS and Java behind it, AWS and containers underneath. I own features end to end, from the integration contract to the deploy.',
        summary: 'Senior Full-Stack Engineer with 6+ years of commercial experience building scalable web applications across startup and enterprise environments. Proven track record with JavaScript, TypeScript, React, Node.js and relational databases, with hands-on experience deploying on AWS using containerised infrastructure. Experienced in leading API integrations, owning full product lifecycles and collaborating cross-functionally in agile teams. Actively leverages AI-assisted development tooling (Claude Code, GitHub Copilot, Cursor) to accelerate delivery. Fluent in English (C1) and Polish (C2).',
        email: 'milosz.kramek@gmail.com', phone: '+48 797 849 798',
        location: 'Warsaw, Poland', linkedin: 'linkedin.com/in/m-kramek', github: '',
        availability: 'Open to senior full-stack roles — Warsaw or remote'
      },
      roles: [
        R({ id: 'r1', company: 'DAC.digital', title: 'Full-Stack Developer', start: 'Oct 2024', end: 'Present', kind: 'Contract · Remote', location: 'Remote', depth: 'advanced',
          oneLiner: 'Keep a global AI training portal used daily by 8,000+ customers fast, available and shipping.',
          metrics: [{ value: '8,000+', label: 'daily users' }, { value: '2', label: 'data stores (PostgreSQL + Neo4J)' }, { value: 'GraphQL + REST', label: 'integration surface' }],
          stack: ['React', 'Node.js', 'Python', 'PostgreSQL', 'Neo4J', 'GraphQL', 'AWS', 'Docker'],
          bullets: [
            'Maintained a high-availability, high-performance AI training portal used daily by 8,000+ customers worldwide.',
            'Architected and delivered end-to-end features across React frontends and Node.js/Python backends on AWS, backed by PostgreSQL and Neo4J.',
            'Owned the full lifecycle of third-party API integrations via GraphQL and REST, ensuring reliability for real-time data pipelines.',
            'Embedded AI-assisted tooling (Claude Code, GitHub Copilot, Cursor) into the engineering workflow, lifting delivery cadence and code quality.',
            'Partnered with product and design to prioritise and ship user-facing features in agile sprints.'
          ],
          caseStudy: {
            context: 'A worldwide AI training portal served 8,000+ customers a day. New third-party integrations kept landing while uptime expectations stayed absolute — every change had to be safe by default.',
            approach: 'Took features end to end: React frontends, Node.js and Python services, PostgreSQL and Neo4J behind them, all on containerised AWS. Standardised the GraphQL/REST integration layer so real-time pipelines had one predictable failure surface instead of one per vendor.',
            impact: 'Features land inside sprint boundaries without trading away availability, and AI-assisted tooling is now part of the team\'s normal loop rather than an experiment.'
          } }),
        R({ id: 'r2', company: 'Sublime Ventures', title: 'Full-Stack Developer', start: 'Mar 2024', end: 'Oct 2024', kind: 'Contract · Remote', location: 'Remote', depth: 'extended',
          oneLiner: 'Shipped full-stack product features and Web3 integrations in a high-growth startup.',
          metrics: [{ value: 'Web3', label: 'on-chain integrations' }, { value: 'End-to-end', label: 'feature ownership' }],
          stack: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Web3', 'REST'],
          bullets: [
            'Built and maintained full-stack features with React, Node.js and Express on PostgreSQL.',
            'Developed Web3 integrations and exposed the REST APIs consumed by frontend clients.',
            'Took features from design to production deployment in a fast-moving startup environment.'
          ] }),
        R({ id: 'r3', company: 'Gardner Denver', title: 'Frontend Developer', start: 'May 2023', end: 'Feb 2024', kind: 'Full-time · Hybrid', location: 'Warsaw, Poland', depth: 'extended',
          oneLiner: 'Built React UI inside a large-scale enterprise platform with a live content pipeline.',
          metrics: [{ value: 'Enterprise', label: 'scale application' }, { value: 'Oracle CM', label: 'content pipeline' }],
          stack: ['React', 'GraphQL', 'REST', 'Oracle Content Management'],
          bullets: [
            'Delivered React UI components within a large-scale enterprise application over GraphQL and REST APIs.',
            'Integrated Oracle Content Management to manage dynamic content across the platform.',
            'Contributed to cross-functional delivery in a structured agile environment.'
          ] }),
        R({ id: 'r4', company: 'Integrality', title: 'CEO & Lead Developer', start: 'Feb 2022', end: 'Dec 2023', kind: 'Own venture · Warsaw', location: 'Warsaw, Poland', depth: 'advanced',
          oneLiner: 'Founded a software agency and personally delivered client projects end to end.',
          metrics: [{ value: 'Agency', label: 'founded & led' }, { value: 'Full lifecycle', label: 'requirements → delivery' }],
          stack: ['React', 'Vue.js', 'Node.js', 'Laravel', 'PostgreSQL', 'MongoDB'],
          bullets: [
            'Founded and led a software development agency, personally delivering client projects across React, Vue.js, Node.js, Laravel, PostgreSQL and MongoDB.',
            'Ran the full project lifecycle: requirements, architecture, development, delivery and client communication.'
          ],
          caseStudy: {
            context: 'Clients arrived with a business problem, not a spec — and no one else to translate it into software.',
            approach: 'Scoped requirements directly with stakeholders, picked the stack per project instead of per habit, then built and shipped it: React or Vue on top, Node or Laravel underneath, PostgreSQL or MongoDB behind.',
            impact: 'Delivered client work solo or with small teams, and built the ownership reflex — commercial context first, code second — that still shapes how I work in product teams.'
          } }),
        R({ id: 'r5', company: 'World Wide Technology', title: 'Back-End Developer', start: 'Nov 2022', end: 'Dec 2022', kind: 'Contract · Warsaw', location: 'Warsaw, Poland', depth: 'simple',
          oneLiner: 'Built Java/Spring Boot microservices for a short-term enterprise engagement.',
          stack: ['Java', 'Spring Boot'], bullets: ['Developed Java/Spring Boot microservices as part of a short-term enterprise engagement.'] }),
        R({ id: 'r6', company: 'Tata Consultancy Services', title: 'Mid Java Developer', start: 'Feb 2022', end: 'Oct 2022', kind: 'Contract · Sweden', location: 'Sweden', depth: 'extended',
          oneLiner: 'Delivered Java backend services for an international enterprise client in a large distributed team.',
          metrics: [{ value: 'Distributed', label: 'international team' }],
          stack: ['Java', 'Spring Boot', 'SOA'],
          bullets: [
            'Delivered Java and Spring Boot backend services for an international enterprise client within a large distributed team.',
            'Deepened service-oriented architecture practice and cross-team collaboration in an agile setup.'
          ] }),
        R({ id: 'r7', company: 'ALGOTEQUE Services', title: 'Front-End Developer', start: 'Nov 2021', end: 'Feb 2022', kind: 'Contract · Warsaw', location: 'Warsaw, Poland', depth: 'simple',
          oneLiner: 'Developed React UI components for client projects in a fast-paced contracting environment.',
          stack: ['React'], bullets: ['Developed React-based UI components for client projects in a fast-paced contracting environment.'] }),
        R({ id: 'r8', company: 'Sollers Consulting', title: 'Developer', start: 'Aug 2021', end: 'Oct 2021', kind: 'Full-time · Warsaw', location: 'Warsaw, Poland', depth: 'simple',
          oneLiner: 'Contributed to Java backend development in a consulting-led project environment.',
          stack: ['Java'], bullets: ['Contributed to Java-based backend development in a consulting-led project environment.'] }),
        R({ id: 'r9', company: 'Plagiat.pl', title: 'Java Developer', start: 'May 2021', end: 'Jun 2021', kind: 'Full-time · Warsaw', location: 'Warsaw, Poland', depth: 'simple',
          oneLiner: 'Built full-stack features with Spring Boot and React/Vue on PostgreSQL and MySQL.',
          stack: ['Java', 'Spring Boot', 'React', 'Vue.js', 'PostgreSQL', 'MySQL'],
          bullets: ['Developed full-stack features with Java Spring Boot on the backend and React/Vue on the frontend, over PostgreSQL and MySQL.'] }),
        R({ id: 'r10', company: 'Whirly', title: 'Junior Java Developer', start: 'May 2019', end: 'Mar 2021', kind: 'Full-time · Warsaw', location: 'Warsaw, Poland', depth: 'extended',
          oneLiner: 'Two years of Java/Spring backend work — the foundation everything since is built on.',
          metrics: [{ value: '~2 yrs', label: 'Java/Spring foundation' }],
          stack: ['Java', 'Spring Boot', 'Testing'],
          bullets: [
            'Built Java and Spring Boot backend services across a nearly two-year engagement.',
            'Foundational experience in enterprise-grade delivery, testing and team collaboration.'
          ] })
      ],
      projects: [
        { id: 'p1', name: 'AI Training Portal', role: 'Full-stack engineer @ DAC.digital', year: '2024 — present', includeInCv: true,
          blurb: 'High-availability learning platform serving 8,000+ customers a day: React frontend, Node.js and Python services, PostgreSQL and Neo4J, containerised on AWS.',
          stack: ['React', 'Node.js', 'Python', 'PostgreSQL', 'Neo4J', 'AWS'], link: '' },
        { id: 'p2', name: 'Web3 Integration Layer', role: 'Full-stack engineer @ Sublime Ventures', year: '2024', includeInCv: true,
          blurb: 'REST surface over on-chain and third-party data, built so frontend clients could consume one stable contract instead of several volatile ones.',
          stack: ['Node.js', 'Express', 'Web3', 'PostgreSQL'], link: '' },
        { id: 'p3', name: 'Enterprise Content Platform UI', role: 'Frontend engineer @ Gardner Denver', year: '2023', includeInCv: false,
          blurb: 'React component work inside a large enterprise application, with Oracle Content Management driving dynamic content through GraphQL and REST.',
          stack: ['React', 'GraphQL', 'Oracle CM'], link: '' }
      ],
      skills: [
        { id: 's1', group: 'Languages', items: ['TypeScript', 'JavaScript (ES2022+)', 'Java', 'Python'] },
        { id: 's2', group: 'Frontend', items: ['React', 'Vue.js', 'HTML5', 'CSS3'] },
        { id: 's3', group: 'Backend', items: ['Node.js', 'NestJS', 'Express', 'Spring Boot', 'Laravel', 'REST', 'GraphQL', 'Web3'] },
        { id: 's4', group: 'Databases', items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Neo4J'] },
        { id: 's5', group: 'Cloud & DevOps', items: ['AWS', 'Docker', 'Kubernetes', 'bare-metal deploys'] },
        { id: 's6', group: 'AI tooling', items: ['Claude Code', 'GitHub Copilot', 'Cursor'] },
        { id: 's7', group: 'Practices', items: ['Agile/Scrum', 'API integration lifecycle', 'SOA', 'event-driven architecture', 'unit/integration/E2E testing'] }
      ],
      testimonials: [
        { id: 't1', quote: '[placeholder] Drop a real quote here from a lead, PM or client — two sentences on what you shipped and what it changed.', author: 'Name Surname', role: 'Engineering Manager, Company', includeInCv: false },
        { id: 't2', quote: '[placeholder] A second reference, ideally from a different context — agency client or product peer.', author: 'Name Surname', role: 'Founder, Company', includeInCv: false }
      ],
      strengths: [
        { id: 'k1', tag: 'SCALE & RELIABILITY', title: 'Systems that stay up', body: 'High-availability work with real users on it — 8,000+ daily on the current portal, PostgreSQL and Neo4J behind it, AWS and containers under it.' },
        { id: 'k2', tag: 'DELIVERY', title: 'Ships fast, on purpose', body: 'Six years of end-to-end feature ownership, with AI-assisted tooling wired into the daily loop. Cadence without regressions.' },
        { id: 'k3', tag: 'DEPTH', title: 'TypeScript deep, full stack wide', body: 'React and Node/NestJS as home turf; Java/Spring and Python when the problem calls for it. GraphQL, REST, Web3.' }
      ],
      education: { degree: 'Engineering Degree in Computer Science', detail: 'Technical High School no. 1, Warsaw, Poland · Software engineering & Java development focus' },
      languages: [{ name: 'Polish', level: 'Native (C2)' }, { name: 'English', level: 'Professional working proficiency (C1)' }],
      sections: [
        { id: 'hero', label: 'Intro', visible: true },
        { id: 'strengths', label: 'Strengths', visible: true },
        { id: 'experience', label: 'Experience', visible: true },
        { id: 'projects', label: 'Selected Work', visible: true },
        { id: 'skills', label: 'Stack', visible: true },
        { id: 'testimonials', label: 'References', visible: false },
        { id: 'contact', label: 'Contact', visible: true }
      ],
      theme: { mode: 'light', accent: 'teal', hero: 'monolith', timeline: 'rail', project: 'index', admin: 'split' },
      cv: { target: '', summary: '', includeSkills: true, includeProjects: true, includeTestimonials: false, includeEducation: true, includeLanguages: true }
    };
  }

  function load() {
    var base = defaults(), stored = null;
    try { var raw = localStorage.getItem(KEY); if (raw) stored = JSON.parse(raw); } catch (e) { stored = null; }
    if (!stored) return base;
    return Object.assign({}, base, stored, {
      profile: Object.assign({}, base.profile, stored.profile || {}),
      theme: Object.assign({}, base.theme, stored.theme || {}),
      cv: Object.assign({}, base.cv, stored.cv || {}),
      education: Object.assign({}, base.education, stored.education || {})
    });
  }

  function save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }

  var THEME = {
    mode: { label: 'MODE', options: [['light', 'LIGHT', 'Warm off-white paper, ink-black type — the default read.'], ['dark', 'DARK', 'Terminal read: near-black ground with a luminous accent.']] },
    accent: { label: 'ACCENT', options: [['teal', 'TEAL', 'Cool and technical; the default.'], ['amber', 'AMBER', 'Warmer, closer to an amber CRT.'], ['lime', 'LIME', 'Sharper, phosphor-green energy.'], ['violet', 'VIOLET', 'Quieter and more editorial.']] },
    hero: { label: 'INTRO TREATMENT', options: [['monolith', 'MONOLITH', 'Oversized name, tagline and a four-cell stat strip.'], ['terminal', 'TERMINAL', 'A shell window answering whoami, role, summary and status.'], ['ledger', 'DATA SHEET', 'Two columns: short pitch beside a key/value spec table.']] },
    timeline: { label: 'EXPERIENCE LAYOUT', options: [['rail', 'RAIL', 'Vertical rail with dates on the left; full detail inline.'], ['ledger', 'LEDGER', 'Dense clickable rows — detail expands only when opened.'], ['cards', 'CARDS', 'Compact grid, scannable at a glance; less detail per role.']] },
    project: { label: 'PROJECT CARDS', options: [['index', 'INDEX', 'Numbered index rows with stack listed on the right.'], ['window', 'WINDOW', 'Terminal-window cards in a responsive grid.'], ['plain', 'BLOCKS', 'Full-width blocks with a large project title.']] },
    admin: { label: 'ADMIN EDITOR', options: [['split', 'SPLIT', 'Entry editor opens beside the table.'], ['stacked', 'STACKED', 'Editor opens under the table at full width.']] }
  };

  function schema(entity) {
    switch (entity) {
      case 'roles': return [
        { key: 'company', label: 'COMPANY', type: 'text' },
        { key: 'title', label: 'ROLE TITLE', type: 'text' },
        { key: 'start', label: 'START', type: 'text', hint: 'e.g. Oct 2024' },
        { key: 'end', label: 'END', type: 'text', hint: 'e.g. Present' },
        { key: 'kind', label: 'ENGAGEMENT', type: 'text', hint: 'e.g. Contract · Remote' },
        { key: 'depth', label: 'DETAIL LEVEL', type: 'select', options: [['simple', 'SIMPLE'], ['extended', 'EXTENDED'], ['advanced', 'ADVANCED']], hint: 'simple = one-liner · extended = metrics, bullets, stack · advanced = + case study' },
        { key: 'oneLiner', label: 'ONE-LINER', type: 'area', rows: 2 },
        { key: 'bullets', label: 'BULLETS', type: 'lines', rows: 6, hint: 'One per line' },
        { key: 'metrics', label: 'METRICS', type: 'pairs', rows: 4, hint: 'One per line: value | label' },
        { key: 'stack', label: 'STACK', type: 'tags', rows: 2, hint: 'Comma separated' },
        { key: 'caseStudy.context', label: 'CASE — CONTEXT', type: 'area', rows: 3 },
        { key: 'caseStudy.approach', label: 'CASE — APPROACH', type: 'area', rows: 3 },
        { key: 'caseStudy.impact', label: 'CASE — IMPACT', type: 'area', rows: 3 },
        { key: 'includeInCv', label: 'CV', type: 'bool', boolLabel: 'Include in CV export' }
      ];
      case 'projects': return [
        { key: 'name', label: 'PROJECT', type: 'text' },
        { key: 'role', label: 'YOUR ROLE / CONTEXT', type: 'text' },
        { key: 'year', label: 'PERIOD', type: 'text' },
        { key: 'blurb', label: 'DESCRIPTION', type: 'area', rows: 4 },
        { key: 'stack', label: 'STACK', type: 'tags', rows: 2, hint: 'Comma separated' },
        { key: 'link', label: 'LINK', type: 'text', hint: 'Optional' },
        { key: 'includeInCv', label: 'CV', type: 'bool', boolLabel: 'Include in CV export' }
      ];
      case 'skills': return [
        { key: 'group', label: 'GROUP', type: 'text' },
        { key: 'items', label: 'SKILLS', type: 'tags', rows: 3, hint: 'Comma separated' }
      ];
      case 'testimonials': return [
        { key: 'quote', label: 'QUOTE', type: 'area', rows: 5 },
        { key: 'author', label: 'AUTHOR', type: 'text' },
        { key: 'role', label: 'AUTHOR ROLE', type: 'text' },
        { key: 'includeInCv', label: 'CV', type: 'bool', boolLabel: 'Include as reference in CV' }
      ];
      case 'strengths': return [
        { key: 'tag', label: 'TAG', type: 'text' },
        { key: 'title', label: 'TITLE', type: 'text' },
        { key: 'body', label: 'BODY', type: 'area', rows: 4 }
      ];
      default: return [];
    }
  }

  function get(obj, path) { return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj); }
  function set(obj, path, val) {
    var parts = path.split('.'), o = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (typeof o[parts[i]] !== 'object' || o[parts[i]] === null) o[parts[i]] = {};
      o = o[parts[i]];
    }
    o[parts[parts.length - 1]] = val;
  }
  function toRaw(f, obj) {
    var v = get(obj, f.key);
    if (f.type === 'lines') return (v || []).join('\n');
    if (f.type === 'tags') return (v || []).join(', ');
    if (f.type === 'pairs') return (v || []).map(function (m) { return m.value + ' | ' + m.label; }).join('\n');
    if (f.type === 'bool') return v ? '1' : '0';
    return v == null ? '' : String(v);
  }
  function fromRaw(f, s) {
    var str = s == null ? '' : String(s);
    if (f.type === 'lines') return str.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    if (f.type === 'tags') return str.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    if (f.type === 'pairs') return str.split('\n').map(function (x) { return x.trim(); }).filter(Boolean).map(function (line) {
      var i = line.indexOf('|');
      return i < 0 ? { value: line, label: '' } : { value: line.slice(0, i).trim(), label: line.slice(i + 1).trim() };
    });
    if (f.type === 'bool') return str === '1';
    return str;
  }

  window.PortfolioStore = { KEY: KEY, defaults: defaults, load: load, save: save, THEME: THEME, schema: schema, get: get, set: set, toRaw: toRaw, fromRaw: fromRaw };
})();
