interface JourneyPanelProps {
  journey: Record<string, any>;
  updateFormValue: (path: string[], value: any) => void;
}

export function JourneyPanel({ journey, updateFormValue }: JourneyPanelProps) {
  const variant = typeof journey?.variant === 'string' ? journey.variant : 'prose';
  const title = typeof journey?.title === 'string' ? journey.title : '';
  const story = typeof journey?.story === 'string' ? journey.story : '';

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
        My Story / Journey
      </div>
      <div className="mb-3">
        <label className="block text-xs text-gray-500">Variant</label>
        <select
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
          value={variant}
          onChange={(event) => updateFormValue(['journey', 'variant'], event.target.value)}
        >
          <option value="prose">Prose</option>
          <option value="card">Card</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="block text-xs text-gray-500">Title</label>
        <input
          className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          value={title}
          onChange={(event) => updateFormValue(['journey', 'title'], event.target.value)}
          placeholder="经历"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500">Story</label>
        <textarea
          className="mt-1 w-full min-h-[140px] rounded-md border border-gray-200 px-3 py-2 text-sm"
          value={story}
          onChange={(event) => updateFormValue(['journey', 'story'], event.target.value)}
          placeholder="输入 My Story / 经历 内容"
        />
      </div>
    </div>
  );
}
