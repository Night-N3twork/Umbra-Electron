import express from "express";
import http from "node:http";
import cors from "cors";
import path from "node:path";
import { hostname } from "node:os";
import chalk from "chalk";
import axios from "axios";
import { URL, parse } from 'url';
import contentType from 'content-type';


import { UmbraProxy } from "./src/umbra-proxy.js"

const server = http.createServer();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "/public")));
app.use(cors());

app.get("/", (req, res) => {
    res.sendFile(path.join(process.cwd(), "/public/index.html"));
});

UmbraProxy(app, axios, URL, contentType);

server.on("request", (req, res) => {
    app(req, res);
});

server.on("upgrade", (req, socket, head) => {
    socket.end();
});

server.on("listening", () => {
    const address = server.address();
    const theme = chalk.hex("#800080");
    const host = chalk.hex("0d52bd");
    console.log(chalk.bold(theme(`
██╗   ██╗███╗   ███╗██████╗ ██████╗  █████╗ 
██║   ██║████╗ ████║██╔══██╗██╔══██╗██╔══██╗
██║   ██║██╔████╔██║██████╔╝██████╔╝███████║
██║   ██║██║╚██╔╝██║██╔══██╗██╔══██╗██╔══██║
╚██████╔╝██║ ╚═╝ ██║██████╔╝██║  ██║██║  ██║
 ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
                                            `)));

    console.log(`  ${chalk.bold(host("Local System:"))}            http://${address.family === "IPv6" ? `[${address.address}]` : address.address}${address.port === 80 ? "" : ":" + chalk.bold(address.port)}`);

    console.log(`  ${chalk.bold(host("Local System:"))}            http://localhost${address.port === 8080 ? "" : ":" + chalk.bold(address.port)}`);

    try {
        console.log(`  ${chalk.bold(host("On Your Network:"))}  http://${hostname()}${address.port === 8080 ? "" : ":" + chalk.bold(address.port)}`);
    } catch (err) {
        // can't find LAN interface
    }

    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
        console.log(`  ${chalk.bold(host("Replit:"))}           https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
    }

    if (process.env.HOSTNAME && process.env.GITPOD_WORKSPACE_CLUSTER_HOST) {
        console.log(`  ${chalk.bold(host("Gitpod:"))}           https://${PORT}-${process.env.HOSTNAME}.${process.env.GITPOD_WORKSPACE_CLUSTER_HOST}`);
    }

    if (process.env.CODESPACE_NAME && process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN) {
        console.log(`  ${chalk.bold(host("Github Codespaces:"))}           https://${process.env.CODESPACE_NAME}-${address.port === 80 ? "" : address.port}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`);
    }
});

server.listen({ port: PORT });

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.setMaxListeners(0);

function shutdown() {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close(() => {
        console.log("HTTP server closed");
        process.exit(1);
    });
}
