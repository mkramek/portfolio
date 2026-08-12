import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";

export function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <BaseCheckbox.Root
      checked={checked}
      onCheckedChange={(next) => onChange(next)}
      className="group grid size-[15px] shrink-0 cursor-pointer place-items-center border border-line text-[9px] font-bold leading-none outline-none data-checked:bg-ac"
    >
      <BaseCheckbox.Indicator className="text-acfg">✓</BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
