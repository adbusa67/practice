import { Button, Form } from "@event-ease/ui";
import Link from "next/link";

export const Header = () => (
  <header
    className="w-full flex justify-between items-center border-b border-black p-4"
  >
    <nav className="flex items-center space-x-6">
      <Link href="/events" className="font-semibold">EventEase</Link>
      <Link href="/events" className="text-gray-600 hover:text-gray-900">Events</Link>
      <Link href="/registrations" className="text-gray-600 hover:text-gray-900">My Registrations</Link>
    </nav>
    <Form.Root action="/api/auth/signout" method="post">
      <Form.Submit asChild>
        <Button variant="text">
          Sign out
        </Button>
      </Form.Submit>
    </Form.Root>
  </header>
);
