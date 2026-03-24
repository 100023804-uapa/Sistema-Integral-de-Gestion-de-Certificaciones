import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { verifySessionCookie } from '@/lib/auth/session';

const f = createUploadthing();

const SESSION_COOKIE = "session";

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    imageUploader: f({ image: { maxFileSize: "4MB" } })
        // Set permissions and file types for this FileRoute
        .middleware(async ({ req }) => {
            // This code runs on your server before upload
            // If you throw, the user will not be able to upload
            // const user = await auth(req);
            // if (!user) throw new UploadThingError("Unauthorized");
            // return { userId: user.id };
            const cookieHeader = req.headers.get("cookie") ?? "";
            const sessionCookie = cookieHeader
                .split(";")
                .map((part) => part.trim())
                .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
                ?.split("=")
                ?.slice(1)
                ?.join("=");

            if (!sessionCookie) {
                throw new UploadThingError("Unauthorized");
            }

            try {
                const decoded = await verifySessionCookie(sessionCookie, true);
                return { userId: decoded.uid };
            } catch {
                throw new UploadThingError("Unauthorized");
            }
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // This code RUNS ON YOUR SERVER after upload
            console.log("Upload complete for userId:", metadata.userId);
            console.log("file url", file.url);
            // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
            return { uploadedBy: metadata.userId, url: file.url };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
