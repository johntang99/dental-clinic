import fs from 'fs/promises';
import path from 'path';

const SITE_ID = 'hu-orthodontics';
const LOCALE = 'zh';
const OUTPUT_DIR = path.join(process.cwd(), 'content', SITE_ID, LOCALE, 'local-seo');

const locations = [
  {
    id: 'flushing',
    name: '法拉盛',
    cityState: 'Flushing, NY 11354',
    clinicName: '法拉盛诊所（总部）',
    address: '38-08 Union Street, Suite 4B',
    phone: '(718) 353-0880',
    addressMapUrl: 'https://maps.google.com/?q=38-08+Union+St+Suite+4B+Flushing+NY+11354',
    mapsEmbedUrl:
      'https://maps.google.com/maps?q=Hu+Lin+Orthodontics+38-08+Union+St+Flushing+NY+11354&t=m&z=17&output=embed',
    phoneHref: 'tel:+17183530880',
  },
  {
    id: 'great-neck',
    name: '大颈',
    cityState: 'Great Neck, NY 11021',
    clinicName: '大颈诊所',
    address: '79 Cutter Mill Road',
    phone: '(516) 809-8686',
    addressMapUrl: 'https://maps.google.com/?q=79+Cutter+Mill+Rd+Great+Neck+NY+11021',
    mapsEmbedUrl:
      'https://maps.google.com/maps?q=HU+LIN+Great+Neck+Orthodontics+79+Cutter+Mill+Rd+Great+Neck+NY+11021&t=m&z=17&output=embed',
    phoneHref: 'tel:+15168098686',
  },
];

const services = [
  { slug: 'traditional-braces', name: '传统金属牙套' },
  { slug: 'ceramic-braces', name: '陶瓷牙套' },
  { slug: 'self-ligating-braces', name: '自锁牙套' },
  { slug: 'invisalign', name: '隐适美' },
  { slug: 'invisalign-teen', name: '隐适美青少年版' },
  { slug: 'early-orthodontics', name: '早期正畸' },
  { slug: 'teen-orthodontics', name: '青少年正畸' },
  { slug: 'adult-orthodontics', name: '成人正畸' },
  { slug: 'surgical-orthodontics', name: '正畸正颌手术' },
  { slug: 'palatal-expanders', name: '上颌扩弓器' },
  { slug: 'retainers', name: '保持器' },
  { slug: 'emergency-orthodontics', name: '正畸急诊' },
];

const serviceSeoCopy = {
  'traditional-braces': {
    titleTag: '中重度咬合不齐矫治',
    description:
      '适合中重度牙齿拥挤、深覆合与咬合不齐。ABO认证团队提供分阶段调弓与咬合精调方案。',
  },
  'ceramic-braces': {
    titleTag: '牙色托槽美观矫治',
    description:
      '兼顾美观与矫治力度，适合在意社交形象的青少年与成人患者，实现更隐蔽的固定矫治体验。',
  },
  'self-ligating-braces': {
    titleTag: '低摩擦高效率牙套方案',
    description:
      '自锁托槽减少摩擦与复诊负担，适合希望提升舒适度并稳定推进疗程的患者。',
  },
  invisalign: {
    titleTag: '透明矫正与咬合评估',
    description:
      '隐适美透明矫正适合成人与青少年，兼顾外观、清洁便利与咬合改善，支持数字化方案预览。',
  },
  'invisalign-teen': {
    titleTag: '青少年透明矫治',
    description:
      '针对青少年生长阶段设计，兼顾学习社交需求与咬合发育管理，支持佩戴依从性追踪。',
  },
  'early-orthodontics': {
    titleTag: '7-10岁早期干预',
    description:
      '儿童一期矫治重点解决颌骨发育与咬合风险，帮助降低后续治疗复杂度并预留牙列空间。',
  },
  'teen-orthodontics': {
    titleTag: '发育期系统矫正',
    description:
      '围绕青少年生长高峰制定矫治计划，兼顾牙列排齐、咬合稳定与长期保持管理。',
  },
  'adult-orthodontics': {
    titleTag: '上班族隐形与固定矫治',
    description:
      '成人正畸覆盖隐形与固定方案，重点改善拥挤、间隙与咬合功能，兼顾职业形象与生活节奏。',
  },
  'surgical-orthodontics': {
    titleTag: '正畸正颌联合评估',
    description:
      '针对骨性错颌、严重面型与功能问题，提供正畸与颌面外科联合路径评估与分期管理。',
  },
  'palatal-expanders': {
    titleTag: '儿童上颌扩弓管理',
    description:
      '针对上颌狭窄与交叉咬合进行扩弓干预，改善咬合空间与呼吸相关口颌发育条件。',
  },
  retainers: {
    titleTag: '矫正后稳定保持',
    description:
      '保持器阶段用于稳定矫治结果，降低复发风险，提供佩戴周期、复查节奏与维护指导。',
  },
  'emergency-orthodontics': {
    titleTag: '托槽脱落与弓丝扎嘴急诊',
    description:
      '针对托槽脱落、弓丝刺激、附件松脱等突发问题，提供快速处理与疗程衔接，减少治疗中断。',
  },
};

const serviceFaqTemplates = {
  'traditional-braces': [
    {
      question: '{locationName}传统金属牙套适合哪些情况？',
      answer:
        '传统金属牙套通常适合中重度拥挤、深覆合、错位明显或需要精细咬合调整的病例。是否适合仍需结合面型、牙周条件与咬合评估后确定。',
    },
    {
      question: '{locationName}传统牙套复诊频率一般是多久？',
      answer:
        '多数患者每4-8周复诊一次。胡林正畸中心会根据牙齿移动节奏和佩戴配合度，动态调整复诊间隔与调弓计划。',
    },
    {
      question: '{locationName}戴传统牙套会影响吃东西吗？',
      answer:
        '治疗初期建议以软食为主，避免过硬、过黏食物。适应后大多数患者可正常饮食，但仍要注意器械保护和口腔清洁。',
    },
  ],
  'ceramic-braces': [
    {
      question: '{locationName}陶瓷牙套和金属牙套效果有差别吗？',
      answer:
        '在大多数病例中，陶瓷牙套与金属牙套都可以达到稳定矫治效果。陶瓷牙套优势在于美观度更高，具体选择取决于咬合复杂度与美观需求。',
    },
    {
      question: '{locationName}陶瓷托槽容易染色吗？',
      answer:
        '托槽本身不易明显染色，但弹力圈等附件可能受饮食影响。按时复诊更换并做好清洁，可以保持较好的整体外观。',
    },
    {
      question: '{locationName}陶瓷牙套适合上班族吗？',
      answer:
        '适合。很多成人患者会优先考虑陶瓷牙套，因为在商务和社交场景中更隐蔽，同时保留固定矫治的控制力。',
    },
  ],
  'self-ligating-braces': [
    {
      question: '{locationName}自锁牙套与传统牙套有什么区别？',
      answer:
        '自锁牙套通过托槽结构减少弓丝摩擦，通常在舒适度、清洁便利性和复诊效率上更有优势，但是否适合仍需由医生评估。',
    },
    {
      question: '{locationName}自锁牙套能缩短治疗时间吗？',
      answer:
        '部分病例可在牙齿移动效率上获益，但疗程主要仍由病例复杂度、骨改建反应和患者配合度决定，不应只看托槽类型。',
    },
    {
      question: '{locationName}自锁牙套复诊会更轻松吗？',
      answer:
        '多数患者反馈调弓与复诊过程更顺畅。我们会结合您的阶段目标安排复诊计划，尽量兼顾效率与舒适度。',
    },
  ],
  invisalign: [
    {
      question: '{locationName}隐适美每天需要佩戴多久？',
      answer:
        '通常建议每天20-22小时，仅在进食和刷牙时取下。佩戴时长直接影响牙齿移动效率和疗程稳定性。',
    },
    {
      question: '{locationName}隐适美适合复杂咬合问题吗？',
      answer:
        '许多复杂问题可以通过隐适美联合附件与阶段计划完成，但极复杂病例可能更适合固定矫治或联合方案，需面诊后判断。',
    },
    {
      question: '{locationName}隐适美复诊频率是怎样的？',
      answer:
        '多数患者每6-8周复诊一次。复诊会检查贴合度、牙齿移动趋势以及下一阶段矫治器安排。',
    },
  ],
  'invisalign-teen': [
    {
      question: '{locationName}青少年做隐适美需要满足什么条件？',
      answer:
        '通常需要恒牙萌出进展达到一定阶段，并具备较好的佩戴配合度。初诊会先评估咬合、发育期和依从性。',
    },
    {
      question: '{locationName}青少年隐适美会影响上学和运动吗？',
      answer:
        '一般不会明显影响。隐适美可摘戴，日常学习、社交和运动更灵活，但必须保证每日佩戴时长。',
    },
    {
      question: '{locationName}家长如何判断孩子是否按要求佩戴？',
      answer:
        '我们会在复诊中追踪贴合和移动进度，并给出家庭协作建议。家长可结合复诊反馈与日常管理共同监督。',
    },
  ],
  'early-orthodontics': [
    {
      question: '{locationName}儿童早期正畸建议几岁初评？',
      answer:
        '通常建议7岁左右进行首次正畸评估，便于及早识别颌骨发育与牙列空间问题，抓住生长窗口进行干预。',
    },
    {
      question: '{locationName}一期干预的目标是什么？',
      answer:
        '目标是改善颌骨发育方向、缓解拥挤风险、优化咬合关系，并为二期全面矫治创造更稳定的基础。',
    },
    {
      question: '{locationName}做早期正畸后还需要二期治疗吗？',
      answer:
        '部分孩子后续仍需二期精细排齐。早期干预并非替代全部治疗，而是降低复杂度、提升长期稳定性的关键步骤。',
    },
  ],
  'teen-orthodontics': [
    {
      question: '{locationName}青少年正畸最佳时机是什么时候？',
      answer:
        '通常在恒牙基本萌出并处于生长高峰期时效果更理想。我们会根据发育阶段、咬合问题和生活节奏制定个性化时机。',
    },
    {
      question: '{locationName}青少年更适合牙套还是隐适美？',
      answer:
        '两种都可能适合。关键看病例复杂度和配合度。面诊后会给出兼顾效果、舒适和学习生活的方案建议。',
    },
    {
      question: '{locationName}青少年矫治如何降低复发风险？',
      answer:
        '核心是按计划完成治疗并严格执行保持器阶段。我们会提供保持期复查与家庭管理建议，提升长期稳定性。',
    },
  ],
  'adult-orthodontics': [
    {
      question: '{locationName}成人现在做正畸还来得及吗？',
      answer:
        '来得及。只要牙周和骨条件允许，成人同样可以获得稳定改善。治疗重点在于功能恢复与美观平衡。',
    },
    {
      question: '{locationName}成人正畸会影响工作形象吗？',
      answer:
        '可通过陶瓷牙套或隐形矫治等方案降低可见度。初诊会结合职业场景和社交需求进行方案匹配。',
    },
    {
      question: '{locationName}成人正畸疗程通常多长？',
      answer:
        '常见疗程约12-30个月，取决于咬合复杂度、牙周状态和配合度。医生会在初诊后提供阶段性时间预估。',
    },
  ],
  'surgical-orthodontics': [
    {
      question: '{locationName}什么情况需要正畸正颌联合治疗？',
      answer:
        '通常用于明显骨性错颌、功能受限或面型影响较大的病例。需由正畸与颌面外科协同评估后决定。',
    },
    {
      question: '{locationName}联合治疗流程是怎样的？',
      answer:
        '常见流程为术前正畸排齐、外科阶段、术后精细咬合调整，再进入保持阶段。每一步都有明确目标与时间节点。',
    },
    {
      question: '{locationName}联合治疗风险如何控制？',
      answer:
        '我们通过多学科会诊、影像分析与分期计划来控制风险，并在术前充分沟通预期效果与恢复管理。',
    },
  ],
  'palatal-expanders': [
    {
      question: '{locationName}扩弓器主要用于哪些儿童问题？',
      answer:
        '多用于上颌狭窄、后牙交叉咬合、牙列空间不足等情况，尤其适合处于生长期的儿童进行发育引导。',
    },
    {
      question: '{locationName}扩弓治疗会很不舒服吗？',
      answer:
        '初期可能有轻微胀感或发音适应期，多数孩子可在短时间内适应。我们会提供家庭操作和护理指导。',
    },
    {
      question: '{locationName}扩弓后是否一定还要戴牙套？',
      answer:
        '是否进入后续全面矫治取决于牙列与咬合演变。扩弓是发育期管理的一部分，不同孩子路径会不同。',
    },
  ],
  retainers: [
    {
      question: '{locationName}为什么矫正后一定要戴保持器？',
      answer:
        '牙齿在矫治后有回弹趋势，保持器用于稳定新位置，降低复发风险，是长期效果管理的关键阶段。',
    },
    {
      question: '{locationName}保持器要戴多久？',
      answer:
        '具体周期因人而异，通常先全时佩戴再过渡到夜间佩戴。我们会根据复查结果给出个体化安排。',
    },
    {
      question: '{locationName}保持器损坏或遗失怎么办？',
      answer:
        '建议尽快联系门诊重做，避免间隔过长导致牙齿位移。及时处理能显著降低返工风险。',
    },
  ],
  'emergency-orthodontics': [
    {
      question: '{locationName}哪些情况属于正畸急诊？',
      answer:
        '常见包括托槽脱落、弓丝扎嘴、附件松动、器械破损引发疼痛等。建议尽快联系门诊评估处理。',
    },
    {
      question: '{locationName}急诊当天能做哪些处理？',
      answer:
        '会先缓解不适并恢复装置基本功能，再评估是否需要后续复诊调整，尽量减少对整体疗程的影响。',
    },
    {
      question: '{locationName}急诊后会影响原本疗程吗？',
      answer:
        '多数情况可通过及时处理快速回到原计划。拖延处理更可能导致进度延后或额外复诊。',
    },
  ],
};

const conditions = [
  { slug: 'crowding', name: '牙齿拥挤' },
  { slug: 'deep-bite', name: '深覆合' },
  { slug: 'underbite', name: '地包天/反颌' },
  { slug: 'open-bite', name: '开咬' },
  { slug: 'crossbite', name: '交叉咬合' },
  { slug: 'spacing', name: '牙缝过大' },
  { slug: 'narrow-palate', name: '上颌狭窄' },
  { slug: 'early-intervention', name: '儿童早期干预' },
];

const conditionToServiceSlug = {
  crowding: 'traditional-braces',
  'deep-bite': 'traditional-braces',
  underbite: 'surgical-orthodontics',
  'open-bite': 'surgical-orthodontics',
  crossbite: 'palatal-expanders',
  spacing: 'invisalign',
  'narrow-palate': 'palatal-expanders',
  'early-intervention': 'early-orthodontics',
};

const priorityServiceSlugs = [
  'invisalign',
  'adult-orthodontics',
  'traditional-braces',
  'teen-orthodontics',
  'ceramic-braces',
  'early-orthodontics',
  'self-ligating-braces',
  'invisalign-teen',
  'surgical-orthodontics',
  'palatal-expanders',
  'retainers',
  'emergency-orthodontics',
];

const priorityConditionSlugs = ['crowding', 'deep-bite', 'underbite', 'crossbite'];
const allConditionSlugs = conditions.map((condition) => condition.slug);

const otherLocationId = (locationId) =>
  locationId === 'flushing' ? 'great-neck' : 'flushing';

const buildFaq = ({ locationName, topicName }) => [
  {
    question: `${locationName}${topicName}需要先预约初诊吗？`,
    answer: `建议先预约免费初诊。胡林医生团队会先做口腔与咬合评估，再给出分阶段治疗建议与时间预估。`,
  },
  {
    question: `${locationName}这项治疗是否支持分期付款？`,
    answer: `支持。我们提供灵活付款方案，并可协助核实保险福利，帮助您清晰了解自付费用。`,
  },
  {
    question: `${locationName}门诊可以讲中文吗？`,
    answer: `可以。胡林正畸中心提供中英双语服务，咨询、复诊与治疗说明都可用中文沟通。`,
  },
  {
    question: `多久能看到${topicName}的改善？`,
    answer: `每位患者起始条件不同，通常在前几个月可以看到牙齿排列变化。完整疗程会在初诊后给出个性化预计。`,
  },
];

function withLocationPlaceholder(text, locationName, serviceName) {
  return text
    .replace(/\{locationName\}/g, locationName)
    .replace(/\{serviceName\}/g, serviceName);
}

function buildServiceFaq(locationName, service) {
  const templates = serviceFaqTemplates[service.slug];
  if (!templates || templates.length === 0) {
    return buildFaq({ locationName, topicName: service.name });
  }

  return templates.map((item) => ({
    question: withLocationPlaceholder(item.question, locationName, service.name),
    answer: withLocationPlaceholder(item.answer, locationName, service.name),
  }));
}

function buildCoreLocationPage(location) {
  return {
    slug: `${location.id}-orthodontist`,
    pageType: 'core-location',
    locationId: location.id,
    topicType: 'core',
    topicSlug: 'orthodontist',
    topicName: `${location.name}正畸医生`,
    title: `${location.name}正畸医生｜ABO认证胡林正畸中心`,
    description: `${location.name}专业正畸门诊，提供隐适美、牙套、儿童正畸与成人正畸服务。中英双语，预约便捷。`,
    intro: `${location.name}门诊由三次获得ABO认证的胡林医生领衔。我们面向儿童、青少年和成人提供系统化正畸评估与治疗，帮助患者兼顾功能与美观。`,
    highlights: [
      'ABO三次认证正畸专家',
      '法拉盛与大颈双门诊联动',
      '隐适美与传统牙套均可评估',
      '支持保险核实与分期付款',
    ],
    treatmentSummary:
      '建议先进行完整咬合分析和影像评估，再确定治疗路径（隐适美、牙套、早期干预或正颌联合方案）。',
    relatedServiceSlugs: priorityServiceSlugs.map((slug) => `${location.id}-${slug}`),
    relatedConditionSlugs: priorityConditionSlugs.map((slug) => `${location.id}-${slug}`),
    siblingSlug: `${otherLocationId(location.id)}-orthodontist`,
    location,
    faq: buildFaq({ locationName: location.name, topicName: '正畸治疗' }),
    cta: {
      primaryText: '预约免费咨询',
      primaryLink: '/zh/book',
      secondaryText: location.phone,
      secondaryLink: location.phoneHref,
    },
  };
}

function buildServiceLocationPage(location, service) {
  const useServiceRichTemplate = priorityServiceSlugs.includes(service.slug);
  const copy = serviceSeoCopy[service.slug] || {
    titleTag: '专业正畸评估',
    description: `${service.name}专业评估与治疗方案，支持中英双语沟通与分期付款。`,
  };
  return {
    slug: `${location.id}-${service.slug}`,
    pageType: 'service-location',
    locationId: location.id,
    topicType: 'service',
    topicSlug: service.slug,
    topicName: service.name,
    useServiceRichTemplate,
    title: `${location.name}${service.name}｜${copy.titleTag}｜胡林正畸中心`,
    description: `${location.name}${copy.description}`,
    intro: `${location.name}门诊提供${service.name}评估与治疗。我们会根据牙齿排列、咬合关系与生活习惯制定个性化方案，兼顾治疗效率与舒适度。`,
    highlights: [
      `${location.name}门诊可预约初诊与复诊`,
      '个性化治疗计划与阶段目标',
      '治疗过程可视化追踪',
      '适合华人家庭的中英双语沟通',
    ],
    treatmentSummary:
      '先评估再治疗：明确适应症、疗程预估、复诊节奏与护理重点，帮助患者稳定推进矫正进度。',
    serviceDetailLink: `/zh/services/${service.slug}`,
    relatedServiceSlugs: priorityServiceSlugs
      .filter((slug) => slug !== service.slug)
      .map((slug) => `${location.id}-${slug}`),
    relatedConditionSlugs: priorityConditionSlugs.map((slug) => `${location.id}-${slug}`),
    siblingSlug: `${otherLocationId(location.id)}-${service.slug}`,
    location,
    faq: buildServiceFaq(location.name, service),
    cta: {
      primaryText: '预约该项目咨询',
      primaryLink: '/zh/book',
      secondaryText: location.phone,
      secondaryLink: location.phoneHref,
    },
  };
}

function buildConditionLocationPage(location, condition) {
  const recommendedServiceSlug = conditionToServiceSlug[condition.slug] || 'traditional-braces';
  const conditionHubSlug = `${location.id}-conditions`;
  return {
    slug: `${location.id}-${condition.slug}`,
    pageType: 'condition-location',
    locationId: location.id,
    topicType: 'condition',
    topicSlug: condition.slug,
    topicName: condition.name,
    title: `${location.name}${condition.name}矫正方案｜胡林正畸中心`,
    description: `${location.name}${condition.name}正畸评估与治疗建议，ABO认证团队为您定制功能与美观兼顾的方案。`,
    intro: `${condition.name}可能影响咬合功能、口腔清洁效率与面部协调。${location.name}门诊会先进行咬合分析，再制定分阶段矫正路径。`,
    highlights: [
      '先明确问题类型与严重程度',
      '给出对应治疗路径与风险说明',
      '提供复诊节奏与家庭护理建议',
      '支持跨门诊连续随访',
    ],
    treatmentSummary:
      '治疗方案会结合牙槽骨条件、年龄阶段和配合度综合制定，目标是稳定改善咬合与笑容协调性。',
    serviceDetailLink: `/zh/services/${recommendedServiceSlug}`,
    relatedServiceSlugs: priorityServiceSlugs.map((slug) => `${location.id}-${slug}`),
    relatedConditionSlugs: [
      conditionHubSlug,
      ...allConditionSlugs
        .filter((slug) => slug !== condition.slug)
        .map((slug) => `${location.id}-${slug}`),
    ],
    siblingSlug: `${otherLocationId(location.id)}-${condition.slug}`,
    location,
    faq: buildFaq({ locationName: location.name, topicName: condition.name }),
    cta: {
      primaryText: '预约问题评估',
      primaryLink: '/zh/book',
      secondaryText: location.phone,
      secondaryLink: location.phoneHref,
    },
  };
}

function buildConditionHubPage(location) {
  return {
    slug: `${location.id}-conditions`,
    pageType: 'resource-location',
    locationId: location.id,
    topicType: 'resource',
    topicSlug: 'conditions',
    topicName: `${location.name}正畸问题总览`,
    title: `${location.name}牙齿咬合问题总览｜胡林正畸中心`,
    description: `${location.name}常见正畸问题总览页面，集中查看拥挤、深覆合、地包天、开咬等8类问题与处理方向。`,
    intro: `本页面汇总${location.name}门诊最常见的8类牙齿与咬合问题。您可以先快速定位自身情况，再进入对应专题页面查看详细方案与预约建议。`,
    highlights: [
      '一次查看8类常见问题',
      '每类问题都有独立专题页',
      '可直接跳转对应门诊咨询',
      '中英双语团队提供评估支持',
    ],
    treatmentSummary:
      '先明确问题类型，再匹配服务路径（隐适美、固定矫治、早期干预或联合治疗），可显著提高方案决策效率。',
    relatedServiceSlugs: priorityServiceSlugs.map((slug) => `${location.id}-${slug}`),
    relatedConditionSlugs: allConditionSlugs.map((slug) => `${location.id}-${slug}`),
    siblingSlug: `${otherLocationId(location.id)}-conditions`,
    location,
    faq: [
      {
        question: `${location.name}如何判断自己属于哪类咬合问题？`,
        answer:
          '可先从本页面的8类问题入口对照症状，再预约面诊做咬合检查与影像评估，获取更准确的分型和治疗建议。',
      },
      {
        question: `${location.name}不同问题会对应不同治疗方式吗？`,
        answer:
          '会。不同问题在移动难度、疗程节奏和器械选择上差异较大，医生会根据功能目标与美观目标综合制定方案。',
      },
      {
        question: `${location.name}看完专题页后下一步该做什么？`,
        answer:
          '建议直接预约初诊，确认问题优先级、治疗路径和时间预估，再决定是否立即进入治疗计划。',
      },
    ],
    cta: {
      primaryText: '预约问题评估',
      primaryLink: '/zh/book',
      secondaryText: location.phone,
      secondaryLink: location.phoneHref,
    },
  };
}

function buildResourceLocationPages(location) {
  return [
    {
      slug: `${location.id}-orthodontics-cost`,
      pageType: 'resource-location',
      locationId: location.id,
      topicType: 'resource',
      topicSlug: 'orthodontics-cost',
      topicName: '正畸费用',
      title: `${location.name}正畸费用指南｜胡林正畸中心`,
      description: `${location.name}正畸费用结构说明，了解初诊、疗程、分期与保险核实流程。`,
      intro: `本页汇总${location.name}门诊常见正畸费用问题，包括评估流程、疗程变量、分期付款和保险协助。`,
      highlights: ['费用透明说明', '支持分期', '保险协助核实', '治疗方案按复杂度评估'],
      treatmentSummary:
        '建议在初诊后确认完整治疗计划，再结合预算与保险方案制定付款节奏。',
      relatedServiceSlugs: priorityServiceSlugs.map((slug) => `${location.id}-${slug}`),
      relatedConditionSlugs: priorityConditionSlugs.map((slug) => `${location.id}-${slug}`),
      siblingSlug: `${otherLocationId(location.id)}-orthodontics-cost`,
      location,
      faq: buildFaq({ locationName: location.name, topicName: '正畸费用' }),
      cta: {
        primaryText: '预约费用评估',
        primaryLink: '/zh/book',
        secondaryText: location.phone,
        secondaryLink: location.phoneHref,
      },
    },
    {
      slug: `${location.id}-orthodontics-insurance`,
      pageType: 'resource-location',
      locationId: location.id,
      topicType: 'resource',
      topicSlug: 'orthodontics-insurance',
      topicName: '正畸保险',
      title: `${location.name}正畸保险说明｜胡林正畸中心`,
      description: `${location.name}正畸保险常见问题、报销流程与福利核实步骤。`,
      intro: `我们可协助${location.name}患者在治疗前核对保险福利，帮助您提前了解覆盖范围与自付比例。`,
      highlights: ['治疗前核保', '清晰说明自付比例', '支持分期结合保险方案', '减少中途费用不确定性'],
      treatmentSummary:
        '不同保险计划对正畸覆盖差异较大，建议在制定方案前完成核保确认。',
      relatedServiceSlugs: priorityServiceSlugs.map((slug) => `${location.id}-${slug}`),
      relatedConditionSlugs: priorityConditionSlugs.map((slug) => `${location.id}-${slug}`),
      siblingSlug: `${otherLocationId(location.id)}-orthodontics-insurance`,
      location,
      faq: buildFaq({ locationName: location.name, topicName: '正畸保险' }),
      cta: {
        primaryText: '预约保险核实咨询',
        primaryLink: '/zh/book',
        secondaryText: location.phone,
        secondaryLink: location.phoneHref,
      },
    },
    {
      slug: `${location.id}-braces-vs-invisalign`,
      pageType: 'resource-location',
      locationId: location.id,
      topicType: 'resource',
      topicSlug: 'braces-vs-invisalign',
      topicName: '牙套与隐适美对比',
      title: `${location.name}牙套 vs 隐适美｜胡林正畸中心`,
      description: `${location.name}牙套与隐适美对比指南，帮助您结合咬合情况与生活方式选择合适方案。`,
      intro: `牙套和隐适美各有适应症。${location.name}门诊会根据牙齿移动难度、外观需求和配合度，给出更适合的方案建议。`,
      highlights: ['复杂病例可考虑牙套', '外观需求高可评估隐适美', '疗程与复诊节奏可对比', '以功能稳定为最终目标'],
      treatmentSummary:
        '不是单纯选“更美观”或“更传统”，关键是与咬合目标、时间安排和配合能力匹配。',
      relatedServiceSlugs: ['invisalign', 'traditional-braces', 'ceramic-braces', 'adult-orthodontics'].map(
        (slug) => `${location.id}-${slug}`
      ),
      relatedConditionSlugs: priorityConditionSlugs.map((slug) => `${location.id}-${slug}`),
      siblingSlug: `${otherLocationId(location.id)}-braces-vs-invisalign`,
      location,
      faq: buildFaq({ locationName: location.name, topicName: '牙套与隐适美对比' }),
      cta: {
        primaryText: '预约方案对比咨询',
        primaryLink: '/zh/book',
        secondaryText: location.phone,
        secondaryLink: location.phoneHref,
      },
    },
  ];
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const pages = [];

  for (const location of locations) {
    pages.push(buildCoreLocationPage(location));
    pages.push(buildConditionHubPage(location));

    for (const service of services) {
      pages.push(buildServiceLocationPage(location, service));
    }

    for (const condition of conditions) {
      pages.push(buildConditionLocationPage(location, condition));
    }

    pages.push(...buildResourceLocationPages(location));
  }

  pages.sort((a, b) => a.slug.localeCompare(b.slug));

  await Promise.all(
    pages.map(async (page) => {
      const filePath = path.join(OUTPUT_DIR, `${page.slug}.json`);
      await fs.writeFile(filePath, `${JSON.stringify(page, null, 2)}\n`, 'utf8');
    })
  );

  console.log(`Generated ${pages.length} local SEO pages at: ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error('Failed to generate local SEO pages:', error);
  process.exit(1);
});
