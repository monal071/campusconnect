import { createUploadthing } from "uploadthing/next-legacy";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";

const f = createUploadthing();

const auth = async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  return session ? { id: session.user?.email || session.user?.id } : null;
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  resourceUploader: f({
    pdf: { maxFileSize: "4MB" },
    text: { maxFileSize: "4MB" },
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    blob: { maxFileSize: "4MB" }, // For other document types like docx
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req, res }) => {
      // This code runs on your server before upload
      const user = await auth(req, res);

      // If you throw, the user will not be able to upload
      if (!user) throw new Error("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      
      // We can also return data to the client if needed
      return { uploadedBy: metadata.userId, url: file.url };
    }),
    
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
    .middleware(async ({ req, res }) => {
      const user = await auth(req, res);
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
};
