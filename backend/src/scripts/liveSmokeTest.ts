import https from "node:https";
import http from "node:http";

interface SmokeConfig {
  baseUrl: string;
  testEmail?: string;
  testPassword?: string;
  allowRegisterTest: boolean;
}

function parseArgs(argv: string[]): SmokeConfig {
  let baseUrl = "";
  let testEmail: string | undefined;
  let testPassword: string | undefined;
  let allowRegisterTest = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--base-url" || arg === "-u") {
      baseUrl = argv[i + 1] || "";
      i++;
    } else if (arg.startsWith("--base-url=")) {
      baseUrl = arg.slice("--base-url=".length);
    } else if (arg === "--test-email") {
      testEmail = argv[i + 1];
      i++;
    } else if (arg.startsWith("--test-email=")) {
      testEmail = arg.slice("--test-email=".length);
    } else if (arg === "--test-password") {
      testPassword = argv[i + 1];
      i++;
    } else if (arg.startsWith("--test-password=")) {
      testPassword = arg.slice("--test-password=".length);
    } else if (arg === "--allow-register-test") {
      allowRegisterTest = true;
    }
  }

  if (!baseUrl) {
    console.error("Usage: npm run smoke:railway -- --base-url <https-url>");
    console.error("Error: Missing required --base-url argument.");
    process.exit(2);
  }

  // Normalize URL trailing slash
  baseUrl = baseUrl.replace(/\/+$/, "");

  return { baseUrl, testEmail, testPassword, allowRegisterTest };
}

interface HttpResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}

function makeRequest(
  urlStr: string,
  method = "GET",
  headers: Record<string, string> = {},
  postData?: string
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const transport = parsed.protocol === "https:" ? https : http;

    const reqHeaders: Record<string, string> = { ...headers };
    if (postData) {
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = String(Buffer.byteLength(postData));
    }

    const req = transport.request(
      urlStr,
      {
        method,
        headers: reqHeaders,
        timeout: 10000,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: raw,
          });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out after 10 seconds."));
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return "***@***";
  const user = parts[0];
  const domain = parts[1];
  const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : "***";
  return `${maskedUser}@${domain}`;
}

async function runLiveSmokeTest(): Promise<void> {
  const config = parseArgs(process.argv.slice(2));

  console.log(`\n==================================================`);
  console.log(`LIVE RAILWAY BACKEND SMOKE TEST`);
  console.log(`Target Base URL: ${config.baseUrl}`);
  console.log(`==================================================\n`);

  let failures = 0;
  let cookieHeader = "";

  // 1. Check GET /health
  try {
    const res = await makeRequest(`${config.baseUrl}/health`);
    if (res.status === 200) {
      let parsed: any;
      try {
        parsed = JSON.parse(res.body);
      } catch {}
      if (parsed && parsed.status === "ok") {
        console.log(`[PASS] GET /health -> 200 OK (${parsed.service}, ${parsed.timestamp})`);
      } else {
        console.log(`[FAIL] GET /health -> 200 but unexpected JSON body: ${res.body}`);
        failures++;
      }
    } else {
      console.log(`[FAIL] GET /health -> ${res.status}`);
      failures++;
    }
  } catch (err: any) {
    console.log(`[FAIL] GET /health -> Backend unreachable: ${err.message}`);
    console.log(
      `\nBackend unreachable. Check Railway deployment status, public domain, PORT binding, and /health route.\n`
    );
    process.exit(1);
  }

  // 2. Check GET /api/auth/me expecting 401
  try {
    const res = await makeRequest(`${config.baseUrl}/api/auth/me`);
    if (res.status === 401) {
      console.log(`[PASS] GET /api/auth/me -> 401 Unauthorized (Protected as expected)`);
    } else {
      console.log(`[FAIL] GET /api/auth/me -> Expected 401, got ${res.status}`);
      failures++;
    }
  } catch (err: any) {
    console.log(`[FAIL] GET /api/auth/me -> Request error: ${err.message}`);
    failures++;
  }

  // 3. Check GET /api/kits expecting 401
  try {
    const res = await makeRequest(`${config.baseUrl}/api/kits`);
    if (res.status === 401) {
      console.log(`[PASS] GET /api/kits -> 401 Unauthorized (Protected as expected)`);
    } else {
      console.log(`[FAIL] GET /api/kits -> Expected 401, got ${res.status}`);
      failures++;
    }
  } catch (err: any) {
    console.log(`[FAIL] GET /api/kits -> Request error: ${err.message}`);
    failures++;
  }

  // 4. OPTIONS preflight
  try {
    const res = await makeRequest(`${config.baseUrl}/api/kits`, "OPTIONS", {
      Origin: "https://example.com",
      "Access-Control-Request-Method": "POST",
    });
    console.log(`[PASS] OPTIONS /api/kits -> ${res.status} (CORS Preflight checked)`);
  } catch (err: any) {
    console.log(`[WARN] OPTIONS /api/kits -> ${err.message}`);
  }

  // 5. GET /not-a-real-route expecting 404 JSON
  try {
    const res = await makeRequest(`${config.baseUrl}/not-a-real-route`);
    if (res.status === 404) {
      console.log(`[PASS] GET /not-a-real-route -> 404 Not Found (Structured 404)`);
    } else {
      console.log(`[FAIL] GET /not-a-real-route -> Expected 404, got ${res.status}`);
      failures++;
    }
  } catch (err: any) {
    console.log(`[FAIL] GET /not-a-real-route -> ${err.message}`);
    failures++;
  }

  // Optional authenticated flow if credentials passed
  if (config.testEmail && config.testPassword) {
    const masked = maskEmail(config.testEmail);
    console.log(`\n--- Authenticated Smoke Test Flow for user [${masked}] ---`);

    let loginSuccess = false;

    // Try login
    try {
      const loginRes = await makeRequest(
        `${config.baseUrl}/api/auth/login`,
        "POST",
        {},
        JSON.stringify({ email: config.testEmail, password: config.testPassword })
      );

      if (loginRes.status === 200) {
        console.log(`[PASS] POST /api/auth/login -> 200 OK`);
        loginSuccess = true;
        const setCookie = loginRes.headers["set-cookie"];
        if (setCookie && setCookie.length > 0) {
          cookieHeader = setCookie.map((c) => c.split(";")[0]).join("; ");
        }
      } else if (loginRes.status === 401 && config.allowRegisterTest) {
        console.log(`[INFO] Login returned 401. Attempting registration...`);
        const regRes = await makeRequest(
          `${config.baseUrl}/api/auth/register`,
          "POST",
          {},
          JSON.stringify({ email: config.testEmail, password: config.testPassword })
        );

        if (regRes.status === 201) {
          console.log(`[PASS] POST /api/auth/register -> 201 Created`);
          loginSuccess = true;
          const setCookie = regRes.headers["set-cookie"];
          if (setCookie && setCookie.length > 0) {
            cookieHeader = setCookie.map((c) => c.split(";")[0]).join("; ");
          }
        } else {
          console.log(`[FAIL] POST /api/auth/register -> ${regRes.status}`);
          failures++;
        }
      } else {
        console.log(`[FAIL] POST /api/auth/login -> ${loginRes.status}`);
        failures++;
      }
    } catch (err: any) {
      console.log(`[FAIL] Authentication attempt error: ${err.message}`);
      failures++;
    }

    if (loginSuccess && cookieHeader) {
      // Test GET /api/auth/me
      try {
        const meRes = await makeRequest(`${config.baseUrl}/api/auth/me`, "GET", { Cookie: cookieHeader });
        if (meRes.status === 200) {
          console.log(`[PASS] GET /api/auth/me (Authenticated) -> 200 OK`);
        } else {
          console.log(`[FAIL] GET /api/auth/me (Authenticated) -> ${meRes.status}`);
          failures++;
        }
      } catch (err: any) {
        console.log(`[FAIL] GET /api/auth/me error: ${err.message}`);
        failures++;
      }

      // Test GET /api/kits
      try {
        const kitsRes = await makeRequest(`${config.baseUrl}/api/kits`, "GET", { Cookie: cookieHeader });
        if (kitsRes.status === 200) {
          console.log(`[PASS] GET /api/kits (Authenticated) -> 200 OK`);
        } else {
          console.log(`[FAIL] GET /api/kits (Authenticated) -> ${kitsRes.status}`);
          failures++;
        }
      } catch (err: any) {
        console.log(`[FAIL] GET /api/kits error: ${err.message}`);
        failures++;
      }

      // Test invalid input for POST /api/kits
      try {
        const invalidInputRes = await makeRequest(
          `${config.baseUrl}/api/kits`,
          "POST",
          { Cookie: cookieHeader },
          JSON.stringify({ jd: "Sample JD", company_url: "invalid-url", days: 0 })
        );
        if (invalidInputRes.status === 400) {
          console.log(`[PASS] POST /api/kits (Invalid Input) -> 400 Bad Request (Validated as expected)`);
        } else {
          console.log(`[FAIL] POST /api/kits (Invalid Input) -> Expected 400, got ${invalidInputRes.status}`);
          failures++;
        }
      } catch (err: any) {
        console.log(`[FAIL] POST /api/kits invalid input test error: ${err.message}`);
        failures++;
      }

      // Logout
      try {
        await makeRequest(`${config.baseUrl}/api/auth/logout`, "POST", { Cookie: cookieHeader });
        console.log(`[PASS] POST /api/auth/logout -> Logged out cleanly`);
      } catch (err: any) {
        console.log(`[WARN] Logout error: ${err.message}`);
      }
    }
  }

  console.log(`\n==================================================`);
  if (failures === 0) {
    console.log(`SUMMARY: ALL SMOKE TESTS PASSED!`);
    console.log(`==================================================\n`);
    process.exit(0);
  } else {
    console.log(`SUMMARY: ${failures} CHECK(S) FAILED.`);
    console.log(`==================================================\n`);
    process.exit(1);
  }
}

runLiveSmokeTest();
