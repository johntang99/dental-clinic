import ReactMarkdown from 'react-markdown';
import { normalizeMarkdown, toSlug } from '@/components/admin/utils/editorHelpers';

interface ServiceCategoryItemPanelProps {
  category: any;
  index: number;
  markdownPreview: Record<string, boolean>;
  toggleMarkdownPreview: (key: string) => void;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
}

export function ServiceCategoryItemPanel({
  category,
  index,
  markdownPreview,
  toggleMarkdownPreview,
  updateFormValue,
  openImagePicker,
}: ServiceCategoryItemPanelProps) {
  const markdownPreviewKey = `service-category-${index}-description`;

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
        {category?.name || `Category ${index + 1}`}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        <input
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Category Name"
          value={category?.name || ''}
          onChange={(event) =>
            updateFormValue(['categories', String(index), 'name'], event.target.value)
          }
        />
        <input
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Category ID (slug)"
          value={category?.id || ''}
          onChange={(event) =>
            updateFormValue(['categories', String(index), 'id'], toSlug(event.target.value))
          }
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        <input
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Icon (e.g., shield-check)"
          value={category?.icon || ''}
          onChange={(event) =>
            updateFormValue(['categories', String(index), 'icon'], event.target.value)
          }
        />
        <input
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Subtitle"
          value={category?.subtitle || ''}
          onChange={(event) =>
            updateFormValue(['categories', String(index), 'subtitle'], event.target.value)
          }
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 mb-2">
        <input
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Image"
          value={category?.image || ''}
          onChange={(event) =>
            updateFormValue(['categories', String(index), 'image'], event.target.value)
          }
        />
        <button
          type="button"
          onClick={() => openImagePicker(['categories', String(index), 'image'])}
          className="px-3 rounded-md border border-gray-200 text-xs"
        >
          Choose
        </button>
      </div>
      <input
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm mb-2"
        type="number"
        placeholder="Order"
        value={category?.order ?? ''}
        onChange={(event) =>
          updateFormValue(
            ['categories', String(index), 'order'],
            event.target.value === '' ? '' : Number(event.target.value)
          )
        }
      />
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">Description (Markdown)</span>
        <button
          type="button"
          onClick={() => toggleMarkdownPreview(markdownPreviewKey)}
          className="text-xs text-gray-600 hover:text-gray-900"
        >
          {markdownPreview[markdownPreviewKey] ? 'Edit' : 'Preview'}
        </button>
      </div>
      {markdownPreview[markdownPreviewKey] ? (
        <div className="prose prose-sm max-w-none rounded-md border border-gray-200 px-3 py-2">
          <ReactMarkdown
            components={{
              ul: (props) => <ul className="list-disc pl-5" {...props} />,
              ol: (props) => <ol className="list-decimal pl-5" {...props} />,
            }}
          >
            {normalizeMarkdown(String(category?.description || ''))}
          </ReactMarkdown>
        </div>
      ) : (
        <textarea
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="Description (Markdown supported)"
          value={category?.description || ''}
          onChange={(event) =>
            updateFormValue(['categories', String(index), 'description'], event.target.value)
          }
        />
      )}
    </div>
  );
}
