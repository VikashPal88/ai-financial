import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mapParsedCategoryToId(parsedCategory, categories) {
  if (!parsedCategory) return null;
  // parsedCategory could be 'groceries' or 'rent' etc.
  const lower = parsedCategory.toLowerCase();
  // try direct name match
  const direct = categories.find(
    (c) => c.name.toLowerCase() === lower || c.name.toLowerCase().includes(lower)
  );
  if (direct) return direct.id;

  // fallback: try keyword match
  for (const cat of categories) {
    const nm = cat.name.toLowerCase();
    if (nm.includes(lower)) return cat.id;
  }

  return null;
}
