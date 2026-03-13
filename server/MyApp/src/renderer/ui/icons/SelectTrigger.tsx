import * as Select from "@radix-ui/react-select"; // правильный импорт
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import cn from "classnames"; // если у тебя есть helper, оставляем

export function SelectValueDemo() {
  return (
    <Select.Root>
      <Select.Trigger
        className={cn(
          "inline-flex items-center justify-between rounded-md border px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-offset-2"
        )}
        aria-label="Food"
      >
        <Select.Value placeholder="Выбери что-то" />
        <Select.Icon className="ml-2">
          <ChevronDown />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="overflow-hidden rounded-md border bg-white shadow-lg">
          <Select.ScrollUpButton className="flex items-center justify-center p-1">
            <ChevronUp />
          </Select.ScrollUpButton>

          <Select.Viewport className="p-2">
            <Select.Item
              value="apple"
              className="relative flex cursor-pointer select-none items-center rounded px-6 py-2 text-sm hover:bg-gray-100"
            >
              <Select.ItemText>Яблоко</Select.ItemText>
              <Select.ItemIndicator className="absolute left-2">
                <Check />
              </Select.ItemIndicator>
            </Select.Item>

            <Select.Item
              value="banana"
              className="relative flex cursor-pointer select-none items-center rounded px-6 py-2 text-sm hover:bg-gray-100"
            >
              <Select.ItemText>Банан</Select.ItemText>
              <Select.ItemIndicator className="absolute left-2">
                <Check />
              </Select.ItemIndicator>
            </Select.Item>
          </Select.Viewport>

          <Select.ScrollDownButton className="flex items-center justify-center p-1">
            <ChevronDown />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
