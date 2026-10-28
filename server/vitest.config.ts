import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        include: ["test/**/*.test.ts"],
        setupFiles: ["./test/prisma-mock.ts"],
        env: {
            NODE_ENV: "test",
            JWT_SECRET: "test-secret",
            ANTHROPIC_API_KEY: "test-anthropic-key",
            // Rate limiting gets its own test file with an explicit low limit;
            // everywhere else it should stay out of the way.
            RATE_LIMIT_MAX: "100000",
            AI_RATE_LIMIT_MAX: "100000",
        },
    },
});
