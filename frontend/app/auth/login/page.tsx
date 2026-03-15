'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthLoginRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/login'); }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-r-transparent"></div>
        </div>
    );
}
