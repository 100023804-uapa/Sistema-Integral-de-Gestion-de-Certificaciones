import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for our app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    mediaUpload: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete for mediaUpload:", file.url);
            return { url: file.url, name: file.name };
        }),

    signatureUpload: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete for signatureUpload:", file.url);
            return { url: file.url };
        }),

    fontUpload: f({ blob: { maxFileSize: "8MB", maxFileCount: 1 } })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete for fontUpload:", file.url);
            return { url: file.url, name: file.name, key: file.key, type: file.type };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
