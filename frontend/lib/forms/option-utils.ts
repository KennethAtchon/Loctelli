import type { FormFieldOption } from "./types";

export function isImageOption(option: FormFieldOption): option is { value: string; imageUrl: string; altText?: string } {
  return typeof option === "object" && option !== null && "value" in option && "imageUrl" in option;
}

export function getOptionValue(option: FormFieldOption): string {
  return typeof option === "string" ? option : option.value;
}

export function getOptionLabel(option: FormFieldOption): string {
  return typeof option === "string" ? option : option.value;
}

export function getOptionAlt(option: FormFieldOption): string {
  if (typeof option === "string") return option;
  return option.altText?.trim() || option.value;
}

export function getOptionImageUrl(option: FormFieldOption): string | undefined {
  return typeof option === "object" && option !== null && "imageUrl" in option
    ? (option as { imageUrl: string }).imageUrl
    : undefined;
}

/** Returns option values for validation / logic (e.g. field.options -> string[]). */
export function getOptionValues(options: FormFieldOption[] | undefined): string[] {
  if (!options?.length) return [];
  return options.map(getOptionValue);
}
