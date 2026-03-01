interface ContentFileRef {
  id: string;
  path: string;
}

interface ServicesModuleListProps {
  servicesPageFile: ContentFileRef | null;
  servicesLayoutFile: ContentFileRef | null;
  isServicesPageSettingsSelected: boolean;
  isServicesLayoutFileActive: boolean;
  isServicesPageFileActive: boolean;
  isServiceDetailFileActive: boolean;
  activeServiceIndex: number;
  activeServiceCategoryIndex: number;
  serviceItems: any[];
  serviceCategories: any[];
  setActiveFile: (file: ContentFileRef | null) => void;
  setActiveServiceIndex: (index: number) => void;
  setActiveServiceCategoryIndex: (index: number) => void;
  addServicesListItem: () => void;
  deleteSelectedService: () => void;
  addServiceCategory: () => void;
  removeServiceCategory: (index: number) => void;
  onServiceClick?: (serviceId: string, index: number) => void;
  setStatus: (status: string) => void;
}

export function ServicesModuleList({
  servicesPageFile,
  servicesLayoutFile,
  isServicesPageSettingsSelected,
  isServicesLayoutFileActive,
  isServicesPageFileActive,
  isServiceDetailFileActive,
  activeServiceIndex,
  activeServiceCategoryIndex,
  serviceItems,
  serviceCategories,
  setActiveFile,
  setActiveServiceIndex,
  setActiveServiceCategoryIndex,
  addServicesListItem,
  deleteSelectedService,
  addServiceCategory,
  removeServiceCategory,
  onServiceClick,
  setStatus,
}: ServicesModuleListProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (servicesPageFile) setActiveFile(servicesPageFile);
          setActiveServiceIndex(-1);
          setActiveServiceCategoryIndex(-1);
        }}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
          isServicesPageSettingsSelected
            ? 'bg-[var(--primary)] text-white'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <div className="font-medium">Page Settings</div>
        <div className="text-xs opacity-70">hero / overview / faq / cta</div>
      </button>
      {servicesLayoutFile && (
        <button
          type="button"
          onClick={() => {
            setActiveFile(servicesLayoutFile);
            setActiveServiceIndex(-1);
            setActiveServiceCategoryIndex(-1);
          }}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            isServicesLayoutFileActive ? 'bg-[var(--primary)] text-white' : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <div className="font-medium">Layout</div>
          <div className="text-xs opacity-70">section order</div>
        </button>
      )}

      <div className="pt-1 text-[11px] font-semibold text-gray-500 uppercase">Categories</div>
      <button
        type="button"
        onClick={addServiceCategory}
        disabled={!isServicesPageFileActive}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Add Category
      </button>
      <button
        type="button"
        disabled={!isServicesPageFileActive || activeServiceCategoryIndex < 0}
        onClick={() => {
          if (!isServicesPageFileActive || activeServiceCategoryIndex < 0) return;
          const currentCategory = serviceCategories[activeServiceCategoryIndex];
          const categoryName =
            currentCategory?.name ||
            currentCategory?.id ||
            `Category ${activeServiceCategoryIndex + 1}`;
          const confirmed = window.confirm(
            `Delete "${categoryName}"? Services in this category will be unassigned.`
          );
          if (!confirmed) return;
          removeServiceCategory(activeServiceCategoryIndex);
        }}
        className="w-full px-3 py-2 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Delete Selected Category
      </button>
      {serviceCategories.map((category: any, index: number) => (
        <button
          key={`${category?.id || 'category'}-${index}`}
          type="button"
          onClick={() => {
            if (servicesPageFile) setActiveFile(servicesPageFile);
            setActiveServiceCategoryIndex(index);
            setActiveServiceIndex(-1);
          }}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            isServicesPageFileActive && activeServiceCategoryIndex === index
              ? 'bg-[var(--primary)] text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <div className="font-medium">{category?.name || `Category ${index + 1}`}</div>
          <div className="text-xs opacity-70">{category?.id || `#${index + 1}`}</div>
        </button>
      ))}

      <div className="pt-2 text-[11px] font-semibold text-gray-500 uppercase">Services</div>
      <button
        type="button"
        onClick={addServicesListItem}
        disabled={!isServicesPageFileActive}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Add Service
      </button>
      <button
        type="button"
        disabled={activeServiceIndex < 0 && !isServiceDetailFileActive}
        onClick={deleteSelectedService}
        className="w-full px-3 py-2 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Delete Selected Service
      </button>
      {serviceItems.map((service: any, index: number) => {
        const isActive =
          (isServiceDetailFileActive && activeServiceIndex === index) ||
          (isServicesPageFileActive && activeServiceIndex === index);
        return (
          <button
            key={`${service?.id || 'service'}-${index}`}
            type="button"
            onClick={() => {
              if (onServiceClick && service?.id) {
                onServiceClick(service.id, index);
              } else {
                if (servicesPageFile) setActiveFile(servicesPageFile);
                setActiveServiceIndex(index);
                setActiveServiceCategoryIndex(-1);
              }
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
              isActive
                ? 'bg-[var(--primary)] text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="font-medium">{service?.title || `Service ${index + 1}`}</div>
            <div className="text-xs opacity-70">{service?.id || `#${index + 1}`}</div>
          </button>
        );
      })}
      {serviceItems.length === 0 && (
        <div className="text-sm text-gray-500">
          {isServicesPageFileActive
            ? 'No services yet. Click Add Service.'
            : 'Open Page Settings to edit service content.'}
        </div>
      )}
    </>
  );
}
