'use server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { WORKOS_COOKIE_DOMAIN, WORKOS_COOKIE_NAME } from './env-variables.js';
import { getAuthorizationUrl } from './get-authorization-url.js';
import { refreshSession, terminateSession } from './session.js';
export async function getSignInUrl({ organizationId, loginHint, redirectUri, } = {}) {
    return getAuthorizationUrl({ organizationId, screenHint: 'sign-in', loginHint, redirectUri });
}
export async function getSignUpUrl({ organizationId, loginHint, redirectUri, } = {}) {
    return getAuthorizationUrl({ organizationId, screenHint: 'sign-up', loginHint, redirectUri });
}
export async function signOut({ returnTo } = {}) {
    const cookie = {
        name: WORKOS_COOKIE_NAME || 'wos-session',
    };
    if (WORKOS_COOKIE_DOMAIN)
        cookie.domain = WORKOS_COOKIE_DOMAIN;
    const nextCookies = await cookies();
    nextCookies.delete(cookie);
    await terminateSession({ returnTo });
}
export async function switchToOrganization(organizationId, options = {}) {
    var _a;
    const { returnTo, revalidationStrategy = 'path', revalidationTags = [] } = options;
    const headersList = await headers();
    let result;
    // istanbul ignore next
    const pathname = returnTo || headersList.get('x-url') || '/';
    try {
        result = await refreshSession({ organizationId, ensureSignedIn: true });
    }
    catch (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error) {
        const { cause } = error;
        /* istanbul ignore next */
        if ((_a = cause === null || cause === void 0 ? void 0 : cause.rawData) === null || _a === void 0 ? void 0 : _a.authkit_redirect_url) {
            redirect(cause.rawData.authkit_redirect_url);
        }
        else {
            if ((cause === null || cause === void 0 ? void 0 : cause.error) === 'sso_required' || (cause === null || cause === void 0 ? void 0 : cause.error) === 'mfa_enrollment') {
                const url = await getAuthorizationUrl({ organizationId });
                return redirect(url);
            }
            throw error;
        }
    }
    switch (revalidationStrategy) {
        case 'path':
            revalidatePath(pathname);
            break;
        case 'tag':
            for (const tag of revalidationTags) {
                revalidateTag(tag);
            }
            break;
    }
    if (revalidationStrategy !== 'none') {
        redirect(pathname);
    }
    return result;
}
//# sourceMappingURL=auth.js.map