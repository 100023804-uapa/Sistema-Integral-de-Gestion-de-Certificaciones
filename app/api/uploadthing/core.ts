import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { SESSION_COOKIE, verifySessionCookie } from "@/lib/auth/session";

const f = createUploadthing();

async function requireUploadUser(req: Request) {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const sessionCookie = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
        ?.split("=")
        .slice(1)
        .join("=");

    if (!sessionCookie) {
        throw new UploadThingError("Unauthorized");
    }

    try {
        const decoded = await verifySessionCookie(sessionCookie, true);
        return { userId: decoded.uid };
    } catch {
        throw new UploadThingError("Unauthorized");
    }
}

export const ourFileRouter = {
    imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(async ({ req }) => requireUploadUser(req))
        .onUploadComplete(async ({ file }) => {
            console.log("Upload complete for imageUploader:", file.url);
            return { url: file.url, name: file.name };
        }),

    mediaUpload: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(async ({ req }) => requireUploadUser(req))
        .onUploadComplete(async ({ file }) => {
            console.log("Upload complete for mediaUpload:", file.url);
            return { url: file.url, name: file.name };
        }),

    signatureUpload: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
        .middleware(async ({ req }) => requireUploadUser(req))
        .onUploadComplete(async ({ file }) => {
            console.log("Upload complete for signatureUpload:", file.url);
            return { url: file.url };
        }),

    fontUpload: f({ blob: { maxFileSize: "8MB", maxFileCount: 1 } })
        .middleware(async ({ req }) => requireUploadUser(req))
        .onUploadComplete(async ({ file }) => {
            console.log("Upload complete for fontUpload:", file.url);
            return { url: file.url, name: file.name, key: file.key, type: file.type };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
