interface LocalSeoPagePanelProps {
  formData: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
}

export function LocalSeoPagePanel({ formData, updateFormValue }: LocalSeoPagePanelProps) {
  const highlights = Array.isArray(formData?.highlights) ? formData.highlights : [];
  const faqItems = Array.isArray(formData?.faq) ? formData.faq : [];
  const relatedServiceSlugs = Array.isArray(formData?.relatedServiceSlugs)
    ? formData.relatedServiceSlugs
    : [];
  const relatedConditionSlugs = Array.isArray(formData?.relatedConditionSlugs)
    ? formData.relatedConditionSlugs
    : [];

  const updateStringArrayItem = (
    arrayPath: string[],
    index: number,
    value: string,
    fallbackArray: string[]
  ) => {
    const next = [...fallbackArray];
    next[index] = value;
    updateFormValue(arrayPath, next);
  };

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">SEO Page Basics</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Slug</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.slug || ''}
              onChange={(event) => updateFormValue(['slug'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Location ID</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.locationId || ''}
              onChange={(event) => updateFormValue(['locationId'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Page Type</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.pageType || ''}
              onChange={(event) => updateFormValue(['pageType'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Topic Type</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.topicType || ''}
              onChange={(event) => updateFormValue(['topicType'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Topic Slug</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.topicSlug || ''}
              onChange={(event) => updateFormValue(['topicSlug'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Topic Name (Keyword)</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.topicName || ''}
              onChange={(event) => updateFormValue(['topicName'], event.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">SEO Title</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.title || ''}
              onChange={(event) => updateFormValue(['title'], event.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">SEO Description</label>
            <textarea
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              rows={2}
              value={formData?.description || ''}
              onChange={(event) => updateFormValue(['description'], event.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Intro</label>
            <textarea
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              rows={3}
              value={formData?.intro || ''}
              onChange={(event) => updateFormValue(['intro'], event.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Treatment Summary</label>
            <textarea
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              rows={2}
              value={formData?.treatmentSummary || ''}
              onChange={(event) => updateFormValue(['treatmentSummary'], event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">Highlights</div>
          <button
            type="button"
            onClick={() => updateFormValue(['highlights'], [...highlights, ''])}
            className="px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
          >
            Add Highlight
          </button>
        </div>
        <div className="space-y-2">
          {highlights.map((item: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={item || ''}
                onChange={(event) =>
                  updateStringArrayItem(['highlights'], index, event.target.value, highlights)
                }
              />
              <button
                type="button"
                onClick={() => {
                  const next = [...highlights];
                  next.splice(index, 1);
                  updateFormValue(['highlights'], next);
                }}
                className="px-3 rounded-md border border-red-200 text-xs text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Location Info</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Location Name</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.location?.name || ''}
              onChange={(event) => updateFormValue(['location', 'name'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Clinic Name</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.location?.clinicName || ''}
              onChange={(event) => updateFormValue(['location', 'clinicName'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">City / State</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.location?.cityState || ''}
              onChange={(event) => updateFormValue(['location', 'cityState'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.location?.phone || ''}
              onChange={(event) => updateFormValue(['location', 'phone'], event.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Address</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.location?.address || ''}
              onChange={(event) => updateFormValue(['location', 'address'], event.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Map URL</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.location?.addressMapUrl || ''}
              onChange={(event) => updateFormValue(['location', 'addressMapUrl'], event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Related Slugs</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Related Services (one per line)</label>
            <textarea
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              rows={5}
              value={relatedServiceSlugs.join('\n')}
              onChange={(event) =>
                updateFormValue(
                  ['relatedServiceSlugs'],
                  event.target.value
                    .split('\n')
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Related Conditions (one per line)</label>
            <textarea
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              rows={5}
              value={relatedConditionSlugs.join('\n')}
              onChange={(event) =>
                updateFormValue(
                  ['relatedConditionSlugs'],
                  event.target.value
                    .split('\n')
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-gray-500 uppercase">FAQ</div>
          <button
            type="button"
            onClick={() =>
              updateFormValue(['faq'], [...faqItems, { question: '', answer: '' }])
            }
            className="px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
          >
            Add FAQ
          </button>
        </div>
        <div className="space-y-3">
          {faqItems.map((item: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="grid gap-2">
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Question"
                  value={item?.question || ''}
                  onChange={(event) =>
                    updateFormValue(['faq', String(index), 'question'], event.target.value)
                  }
                />
                <textarea
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Answer"
                  value={item?.answer || ''}
                  onChange={(event) =>
                    updateFormValue(['faq', String(index), 'answer'], event.target.value)
                  }
                />
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => {
                    const next = [...faqItems];
                    next.splice(index, 1);
                    updateFormValue(['faq'], next);
                  }}
                  className="px-3 py-1.5 rounded-md border border-red-200 text-xs text-red-600 hover:bg-red-50"
                >
                  Remove FAQ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">CTA</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Primary Text</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.cta?.primaryText || ''}
              onChange={(event) => updateFormValue(['cta', 'primaryText'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Primary Link</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.cta?.primaryLink || ''}
              onChange={(event) => updateFormValue(['cta', 'primaryLink'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Secondary Text</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.cta?.secondaryText || ''}
              onChange={(event) => updateFormValue(['cta', 'secondaryText'], event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Secondary Link</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData?.cta?.secondaryLink || ''}
              onChange={(event) => updateFormValue(['cta', 'secondaryLink'], event.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
