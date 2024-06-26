import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const url = 'http://localhost:8080'
const jsonHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
}

function hashPassword(password: string) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    return (
        Crypto
            .digest(Crypto.CryptoDigestAlgorithm.SHA256, passwordBuffer)
            .then((hashBuffer) =>
                Array.from(new Uint8Array(hashBuffer))
                    .map((byte) => byte.toString(16).padStart(2, "0"))
                    .join("")
            )
    );
}

export async function logIn(username: string, password: string): Promise<void> {
    var hashed = await hashPassword(password)

    return fetch(`${url}/auth/login`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
            username: username.toLowerCase(),
            password: hashed
        }),
    })
        .then(async (response) => {
            if (response.ok) {
                return response.json()
            }

            const text = await response.text();
            throw new Error(`fetch error /auth/login - ${response.status}: ${text}`);
        })
        .then(async json => {
            await SecureStore.setItemAsync('accessToken', json.access_token)
            await SecureStore.setItemAsync('refreshToken', json.refresh_token)
        })
}

export async function register(firstName: string, lastName: string, username: string, password: string): Promise<void> {
    var hashed = await hashPassword(password)

    return fetch(`${url}/auth/register`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
            first_name: firstName.toLowerCase(),
            last_name: lastName.toLowerCase(),
            username: username.toLowerCase(),
            password: hashed
        }),
    })
        .then(async (response) => {
            if (response.ok) {
                return response.json()
            }

            const text = await response.text();
            throw new Error(`fetch error /auth/register - ${response.status}: ${text}`);
        })
        .then(async json => {
            await SecureStore.setItemAsync('accessToken', json.access_token)
            await SecureStore.setItemAsync('refreshToken', json.refresh_token)
        })
}

export async function checkAuth(): Promise<boolean> {
    var accessToken = await SecureStore.getItemAsync('accessToken')

    if (accessToken == null) {
        return false
    }

    return fetch(`${url}/auth/verify`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    }).then((response) => response.ok).catch(() => false)
}

export async function logOut() {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
}