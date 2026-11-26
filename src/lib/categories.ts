function parseIdList(fieldOptions: any[] | null | undefined, fieldKey: string): string[] {
  const opt = fieldOptions?.find((o) => o.fieldKey === fieldKey);
  if (!opt?.value) return [];
  try {
    const parsed = JSON.parse(opt.value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function getHiddenCategoryIds(fieldOptions: any[] | null | undefined): Set<string> {
  return new Set(parseIdList(fieldOptions, 'hidden_categories'));
}

/**
 * Normalizes category metadata (imageUrl, tags, visibility, order) from Category rows
 * and FieldOption fallbacks, returning categories sorted for display.
 */
export function processCategories(
  rawCategories: any[] | null | undefined,
  fieldOptions: any[] | null | undefined,
  options: { includeHidden?: boolean } = {}
) {
  const categoryOrder = parseIdList(fieldOptions, 'category_order');
  const hiddenSet = getHiddenCategoryIds(fieldOptions);

  const mapped = (rawCategories || [])
    .map((cat) => {
      const rawTags =
        cat.tags ||
        fieldOptions?.find((o) => o.fieldKey === `cat_tags_${cat.id}`)?.value ||
        '';
      const parsedTags = Array.isArray(rawTags)
        ? rawTags
        : typeof rawTags === 'string' && rawTags.trim()
          ? rawTags
              .split(',')
              .map((t: string) => t.trim())
              .filter(Boolean)
          : [];

      const isHidden = Boolean(cat.isHidden || hiddenSet.has(cat.id));

      return {
        ...cat,
        imageUrl:
          cat.imageUrl ||
          fieldOptions?.find((o) => o.fieldKey === `cat_img_${cat.id}`)?.value ||
          '',
        tags: parsedTags,
        isHidden,
      };
    })
    .sort((a, b) => {
      if (categoryOrder.length > 0) {
        const idxA = categoryOrder.indexOf(a.id);
        const idxB = categoryOrder.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
      }
      if (a.order !== undefined && b.order !== undefined) {
        return (a.order || 0) - (b.order || 0);
      }
      return 0;
    });

  return options.includeHidden ? mapped : mapped.filter((cat) => !cat.isHidden);
}
