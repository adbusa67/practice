"use client";

import { Form } from "./Form";
import * as React from "react";
import { cn } from "../lib";

export type TextFieldProps = React.ComponentProps<typeof Form.Field> & {
  name: string;
  controlProps?: React.ComponentProps<typeof Form.Control>;
};

export function TextField({
  name,
  controlProps = {},
  ...props
}: TextFieldProps) {
  return (
    <Form.Field name={name} {...props}>
      <Form.Control
        className={cn("w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent")}
        {...controlProps}
      />
    </Form.Field>
  );
}