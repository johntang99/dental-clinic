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
];

const priorityConditionSlugs = ['crowding', 'deep-bite', 'underbite', 'crossbite'];

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
  return {
    slug: `${location.id}-${service.slug}`,
    pageType: 'service-location',
    locationId: location.id,
    topicType: 'service',
    topicSlug: service.slug,
    topicName: service.name,
    title: `${location.name}${service.name}｜胡林正畸中心`,
    description: `${location.name}${service.name}专业评估与治疗方案，ABO认证正畸团队，支持中英双语沟通与分期付款。`,
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
    faq: buildFaq({ locationName: location.name, topicName: service.name }),
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
    relatedConditionSlugs: priorityConditionSlugs
      .filter((slug) => slug !== condition.slug)
      .map((slug) => `${location.id}-${slug}`),
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
