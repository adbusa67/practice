"use client";

import { Form } from "./Form";
import * as React from "react";
import { cn } from "../lib";
import { Search } from "lucide-react";

export type SearchTextFieldProps = React.ComponentProps<typeof Form.Root> & {
  name: string;
  controlProps?: React.ComponentProps<typeof Form.Control>;
};

export function SearchTextField({
  name,
  controlProps = {
    placeholder: 'Search',
    type: 'search',
  },
  ...props
}: SearchTextFieldProps) {
  return (
    <Form.Root {...props}>
      <Form.Field className="relative" name={name}>
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Form.Control
          className={cn("bg-white border border-gray-300 rounded-md py-3 pr-3 pl-11 text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent")}
          {...controlProps}
        />
      </Form.Field>
    </Form.Root>
  );
}