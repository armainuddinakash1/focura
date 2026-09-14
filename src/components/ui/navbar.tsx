"use client"
import React from 'react'
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Show, UserButton } from "@clerk/nextjs";

function Navbar() {
  return (
      <header className="flex justify-between items-center p-4 gap-4 h-16">
          <Show when="signed-out">
              <Link href="/">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      ToDo App
                  </h1>
              </Link>
              <div>
                  <Link href="/sign-in">
                      <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/sign-up">
                      <Button>Sign Up</Button>
                  </Link>
              </div>
          </Show>
          <Show when="signed-in">
              <Link href="/dashboard">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      ToDo App
                  </h1>
              </Link>
              <UserButton />
          </Show>
      </header>
  );
}

export default Navbar