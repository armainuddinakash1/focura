'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CheckCircle, Zap, Shield } from 'lucide-react';

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && userId) {
      router.push('/dashboard');
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Organize Your Tasks
            <br />
            <span className="text-blue-600 dark:text-blue-400">Effortlessly</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            A modern, fast, and secure todo application to help you stay productive and keep track of what matters most.
          </p>
          <a
            href="/sign-up"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            Start Free Today
          </a>
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8">
            <CheckCircle className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Easy Management
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create, edit, and delete todos with just a few clicks. Stay in control of your tasks.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8">
            <Zap className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Lightning Fast
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Built with Next.js and modern technologies for blazing-fast performance.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8">
            <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Secure & Private
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your data is protected with enterprise-grade security and Clerk authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
