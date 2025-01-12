export default {
    async fetch(request, env, ctx) {
        // 配置 CORS
        if (request.method === 'OPTIONS') {
            return handleOptions(request);
        }

        try {
            const cookie = env.COOKIE
            request.headers.set('cookie', cookie)
            const { pathname } = new URL(request.url);
            switch (pathname) {
                case pathname.endsWith('/eapi/book/search'):
                    assert(request.method === 'POST');
                    return handleSearch(request);
                case pathname.endsWith('/file'):
                    assert(request.method === 'GET');
                    return handleGetDownloadLink(request)
                default:
                    throw new HttpError("404 Not Found", 404);
            }
        } catch (err) {
            return errHandler(err);
        }
    }
};

const BASE_URL = "https://zh.z-lib.gs"

async function handleSearch(request) {
    const response = await fetch(`${BASE_URL}/eapi/book/search`, {
        method: 'POST',
        body: JSON.stringify({
            order: 'popular',
            ...request.body,
            limit: request.count || 20
        }),
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'user-agent': 'cli',
            'cookie': request.headers.get('cookie') || ''
        }
    })

    return new Response(body, fixCors(response));
}

async function handleGetDownloadLink(request) {
    const { pathname } = new URL(request.url);
    const response = await fetch(`${BASE_URL}/${pathname}`, {
        method: 'GET',
        headers: {
            'user-agent': 'cli',
            'cookie': request.headers.get('cookie') || ''
        }
    })

    return new Response(body, fixCors(response));
}

// 处理 CORS 预检请求
function handleOptions(request) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,HEAD,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Max-Age': '86400',
    };

    return new Response(null, {
        headers: corsHeaders,
    });
}

class HttpError extends Error {
    constructor(message, status) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
    }
}

const fixCors = ({ headers, status, statusText }) => {
    headers = new Headers(headers);
    headers.set("Access-Control-Allow-Origin", "*");
    return { headers, status, statusText };
};

const assert = (success) => {
    if (!success) {
        throw new HttpError("The specified HTTP method is not allowed for the requested resource", 400);
    }
};

const errHandler = (err) => {
    console.error(err);
    return new Response(err.message, fixCors({ status: err.status ? ? 500 }));
};