import ReactMarkdown from 'react-markdown';
import { toSlug, normalizeMarkdown } from '@/components/admin/utils/editorHelpers';

interface ServiceDetailPanelProps {
  formData: Record<string, any>;
  serviceCategoryOptions: Array<{ id: string; name: string }>;
  markdownPreview: Record<string, boolean>;
  toggleMarkdownPreview: (key: string) => void;
  updateValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
}

const HERO_VARIANTS = [
  { value: 'centered', label: 'Centered (gradient background)' },
  { value: 'split-photo-right', label: 'Split — Photo Right' },
  { value: 'split-photo-left', label: 'Split — Photo Left' },
  { value: 'photo-background', label: 'Full Photo Background' },
];

export function ServiceDetailPanel({
  formData,
  serviceCategoryOptions,
  markdownPreview,
  toggleMarkdownPreview,
  updateValue,
  openImagePicker,
}: ServiceDetailPanelProps) {
  const fullDescKey = 'serviceDetail-fullDescription';
  const whatToExpectKey = 'serviceDetail-whatToExpect';
  const benefits = Array.isArray(formData.benefits) ? formData.benefits : [];
  const faqItems = Array.isArray(formData.faq) ? formData.faq : [];

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Basic Info</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Slug</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              value={formData.slug || ''}
              onChange={(e) => updateValue(['slug'], toSlug(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Icon</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              value={formData.icon || ''}
              onChange={(e) => updateValue(['icon'], e.target.value)}
            />
          </div>
        </div>
        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">Title</label>
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={formData.title || ''}
            onChange={(e) => updateValue(['title'], e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">Subtitle</label>
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={formData.subtitle || ''}
            onChange={(e) => updateValue(['subtitle'], e.target.value)}
          />
        </div>
        {serviceCategoryOptions.length > 0 && (
          <div className="mb-2">
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            <select
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
              value={formData.category || ''}
              onChange={(e) => updateValue(['category'], e.target.value)}
            >
              <option value="">Select category</option>
              {serviceCategoryOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Price</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              value={formData.price || ''}
              onChange={(e) => updateValue(['price'], e.target.value || null)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Duration (min)</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              type="number"
              value={formData.durationMinutes || ''}
              onChange={(e) =>
                updateValue(['durationMinutes'], e.target.value ? parseInt(e.target.value, 10) : null)
              }
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(formData.featured)}
            onChange={(e) => updateValue(['featured'], e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-gray-700">Featured / Popular Service</span>
        </label>
      </div>

      {/* Hero & Image */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Hero & Image</div>
        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">Hero Variant</label>
          <select
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
            value={formData.heroVariant || 'centered'}
            onChange={(e) => updateValue(['heroVariant'], e.target.value)}
          >
            {HERO_VARIANTS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">Image</label>
          <div className="flex gap-2">
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData.image || ''}
              onChange={(e) => updateValue(['image'], e.target.value)}
            />
            <button
              type="button"
              onClick={() => openImagePicker(['image'])}
              className="px-3 rounded-md border border-gray-200 text-xs"
            >
              Choose
            </button>
          </div>
        </div>
        {formData.image && (
          <div className="mt-2">
            <img
              src={formData.image}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border border-gray-200"
            />
          </div>
        )}
      </div>

      {/* Short Description */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Descriptions</div>
        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">Short Description (for listing cards)</label>
          <textarea
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            rows={2}
            value={formData.shortDescription || ''}
            onChange={(e) => updateValue(['shortDescription'], e.target.value)}
          />
        </div>

        {/* Full Description */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs text-gray-500">Full Description (Markdown)</label>
            <button
              type="button"
              onClick={() => toggleMarkdownPreview(fullDescKey)}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              {markdownPreview[fullDescKey] ? 'Edit' : 'Preview'}
            </button>
          </div>
          {markdownPreview[fullDescKey] ? (
            <div className="prose prose-sm max-w-none rounded-md border border-gray-200 px-3 py-2">
              <ReactMarkdown
                components={{
                  ul: (props) => <ul className="list-disc pl-5" {...props} />,
                  ol: (props) => <ol className="list-decimal pl-5" {...props} />,
                }}
              >
                {normalizeMarkdown(String(formData.fullDescription || ''))}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              rows={8}
              value={formData.fullDescription || ''}
              onChange={(e) => updateValue(['fullDescription'], e.target.value)}
            />
          )}
        </div>
      </div>

      {/* What to Expect */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">What to Expect</div>
          <button
            type="button"
            onClick={() => toggleMarkdownPreview(whatToExpectKey)}
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            {markdownPreview[whatToExpectKey] ? 'Edit' : 'Preview'}
          </button>
        </div>
        {markdownPreview[whatToExpectKey] ? (
          <div className="prose prose-sm max-w-none rounded-md border border-gray-200 px-3 py-2">
            <ReactMarkdown
              components={{
                ul: (props) => <ul className="list-disc pl-5" {...props} />,
                ol: (props) => <ol className="list-decimal pl-5" {...props} />,
              }}
            >
              {normalizeMarkdown(String(formData.whatToExpect || ''))}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            rows={5}
            value={formData.whatToExpect || ''}
            onChange={(e) => updateValue(['whatToExpect'], e.target.value)}
          />
        )}
      </div>

      {/* Benefits */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Key Benefits ({benefits.length})
          </div>
          <button
            type="button"
            onClick={() => updateValue(['benefits'], [...benefits, ''])}
            className="text-xs text-primary hover:text-primary-dark"
          >
            + Add Benefit
          </button>
        </div>
        <div className="space-y-2">
          {benefits.map((benefit: string, idx: number) => (
            <div key={idx} className="flex gap-2 items-start">
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={benefit}
                onChange={(e) => {
                  const next = [...benefits];
                  next[idx] = e.target.value;
                  updateValue(['benefits'], next);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const next = benefits.filter((_: string, i: number) => i !== idx);
                  updateValue(['benefits'], next);
                }}
                className="text-xs text-red-600 hover:text-red-700 px-2 py-2"
              >
                Remove
              </button>
            </div>
          ))}
          {benefits.length === 0 && (
            <p className="text-xs text-gray-400">No benefits yet. Click &quot;+ Add Benefit&quot;.</p>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            FAQ ({faqItems.length})
          </div>
          <button
            type="button"
            onClick={() =>
              updateValue(['faq'], [...faqItems, { question: '', answer: '' }])
            }
            className="text-xs text-primary hover:text-primary-dark"
          >
            + Add Question
          </button>
        </div>
        <div className="space-y-4">
          {faqItems.map((item: any, idx: number) => (
            <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">Q{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = faqItems.filter((_: any, i: number) => i !== idx);
                    updateValue(['faq'], next);
                  }}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm mb-2"
                placeholder="Question"
                value={item.question || ''}
                onChange={(e) => {
                  const next = [...faqItems];
                  next[idx] = { ...next[idx], question: e.target.value };
                  updateValue(['faq'], next);
                }}
              />
              <textarea
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Answer"
                rows={3}
                value={item.answer || ''}
                onChange={(e) => {
                  const next = [...faqItems];
                  next[idx] = { ...next[idx], answer: e.target.value };
                  updateValue(['faq'], next);
                }}
              />
            </div>
          ))}
          {faqItems.length === 0 && (
            <p className="text-xs text-gray-400">No FAQ items. Click &quot;+ Add Question&quot;.</p>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
          Call to Action (per-service override)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">CTA Title</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              value={formData.cta?.title || ''}
              onChange={(e) => updateValue(['cta', 'title'], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">CTA Subtitle</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              value={formData.cta?.subtitle || ''}
              onChange={(e) => updateValue(['cta', 'subtitle'], e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Primary Button Text</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              value={formData.cta?.primaryCta?.text || ''}
              onChange={(e) => updateValue(['cta', 'primaryCta', 'text'], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Primary Button Link</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              value={formData.cta?.primaryCta?.link || ''}
              onChange={(e) => updateValue(['cta', 'primaryCta', 'link'], e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Secondary Button Text</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              value={formData.cta?.secondaryCta?.text || ''}
              onChange={(e) => updateValue(['cta', 'secondaryCta', 'text'], e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Secondary Button Link</label>
            <input
              className="rounded-md border border-gray-200 px-3 py-2 text-sm w-full"
              value={formData.cta?.secondaryCta?.link || ''}
              onChange={(e) => updateValue(['cta', 'secondaryCta', 'link'], e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
