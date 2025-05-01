export function buildNestedRows(flatRows, parentId = null) {
    return flatRows
      .filter((row) => row.parent_id === parentId)
      .map((row) => ({
        ...row,
        children: buildNestedRows(flatRows, row.id)
      }));
  }
  