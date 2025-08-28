/*
// -- profileApi.ts -- //
#######################################################################################
# The profileApi.ts it's here that we treat and send all the request to the backend.  #
#######################################################################################
*/

export async function loadProfile(token?: string | null) {
    if (!token) token = localStorage.getItem('token') || undefined;
    if (!token) throw new Error('No token');

    const res = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
    return res.json();
}

export async function updateProfileApi(updatedProfile: any, token?: string | null) {
    if (!token) token = localStorage.getItem('token') || undefined;
    if (!token) throw new Error('No token');

    const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProfile)
    });
    return res;
}