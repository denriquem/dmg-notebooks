import morgan from "morgan";
import chalk from "chalk";

const statusColor = (status: number) => {
    if (status >= 500) return chalk.red.bold(status); // Server errors
    if (status >= 400) return chalk.yellow.bold(status); // Client errors
    if (status >= 300) return chalk.cyan(status); // Redirections
    return chalk.green.bold(status); // Successes
};

export const httpLogger = morgan((tokens, req, res) => {
    const status = Number(tokens.status(req, res));
    const method = tokens.method(req, res);

    const coloredMethod =
        method === "GET" ? chalk.green(method) : chalk.yellow(method);

    return [
        chalk.gray(`[${new Date().toISOString()}]`),
        coloredMethod,
        chalk.white(tokens.url(req, res)),
        statusColor(status),
        chalk.gray(`${tokens["response-time"](req, res)} ms`),
        chalk.gray(`- ${tokens.res(req, res, "content-length") || 0} bytes`),
    ].join(" ");
});
