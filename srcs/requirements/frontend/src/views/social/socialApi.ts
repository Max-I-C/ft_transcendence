/*
// -- socialApi.ts -- //
#######################################################################################
# The socialApi.ts it's here that we treat and send all the request to the backend.   #
#######################################################################################
*/

export async function apiGet(path: string, token?: string) {
    const res = await fetch(path, { headers: token ? { 'Authorization': `Bearer ${token}` } : undefined });
    if (!res.ok) throw new Error(`API GET ${path} failed (${res.status})`);
    return res.json();
}

export async function apiPost(path: string, body: any, token?: string) {
    const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify(body)
    });
    return res;
}