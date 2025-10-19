"use client";

import { signup, login } from "./actions";
import { Button, Form, TextField } from "@event-ease/ui";

export default function LoginPage() {
  return (
    <Form.Root className="flex flex-col items-center justify-center w-full min-h-dvh bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm flex flex-col items-center space-y-4 sm:space-y-6">
        {/* Calendar Icon */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="white" 
            className="w-5 h-5 sm:w-6 sm:h-6"
          >
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
          </svg>
        </div>
        
        {/* EventEase Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-600">
          EventEase
        </h1>
        
        {/* Form Fields */}
        <div className="w-full space-y-3 sm:space-y-4">
          <TextField
            controlProps={{
              placeholder: 'Email',
              required: true,
              type: 'email',
            }}
            name="email"
          />
          <TextField
            controlProps={{
              placeholder: 'Password',
              required: true,
              type: 'password',
            }}
            name="password"
          />
        </div>
        
        {/* Buttons */}
        <div className="w-full space-y-2 sm:space-y-3">
          <Form.Submit asChild>
            <Button
              formAction={login}
              variant="primary"
              className="w-full"
            >
              Log In
            </Button>
          </Form.Submit>
          <Form.Submit asChild>
            <Button
              formAction={signup}
              variant="secondary"
              className="w-full"
            >
              Sign Up
            </Button>
          </Form.Submit>
        </div>
      </div>
    </Form.Root>
  );
}
