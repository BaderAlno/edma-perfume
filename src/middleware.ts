import { createServerClient } from '@supabase/ssr';
import { NextResponse }        from 'next/server';
import type { NextRequest }    from 'next/server';
import type { Database }       from '@/lib/database.types';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        res.cookies.set(name, value, options);
                    });
                },
            },
        },
    );

    // Validate with Auth server and refresh session cookie.
    const { data: { user } } = await supabase.auth.getUser();

    const { pathname } = req.nextUrl;
    const isLoginPage  = pathname === '/admin/login';
    const isAdminRoute = pathname.startsWith('/admin');

    // Unauthenticated user hitting a protected /admin/* route → login
    if (isAdminRoute && !isLoginPage && !user) {
        const url = req.nextUrl.clone();
        url.pathname = '/admin/login';
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
    }

    // Already authenticated user loading the login page → dashboard
    if (isLoginPage && user) {
        const url = req.nextUrl.clone();
        url.pathname = '/admin/dashboard';
        return NextResponse.redirect(url);
    }

    return res;
}

export const config = {
    matcher: ['/admin/:path*'],
};
