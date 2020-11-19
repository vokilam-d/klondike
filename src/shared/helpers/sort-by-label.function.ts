interface ValueWithLabel {
  label: string;
}

export function sortByLabel<T extends ValueWithLabel>(values: T[]): T[] {
  values.sort((a, b) => {
    let aLabel = a.label;
    let bLabel = b.label;
    if (aLabel.startsWith('№')) { aLabel = aLabel.slice(1); }
    if (bLabel.startsWith('№')) { bLabel = bLabel.slice(1); }

    const aParsed = parseInt(aLabel);
    const bParsed = parseInt(bLabel);
    if (Number.isNaN(aParsed) || Number.isNaN(bParsed)) {
      return a.label > b.label ? 1 : -1;
    }

    return aParsed - bParsed;
  });

  return values;
}
