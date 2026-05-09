import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const agentId = formData.get("agentId") as string;
    const sessionId = formData.get("sessionId") as string;
    const message = formData.get("message") as string;
    const files = formData.getAll("files") as File[];

    if (!agentId || !sessionId) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // Process uploaded files
    const uploadedFiles: { name: string; size: number; type: string }[] = [];

    for (const file of files) {
      // Here you would typically save the file to disk or cloud storage
      // For now, we'll just acknowledge the upload
      uploadedFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // TODO: Save file to appropriate storage
      // const buffer = await file.arrayBuffer();
      // await saveFile(agentId, sessionId, file.name, buffer);
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: "文件上传成功",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "文件上传失败" }, { status: 500 });
  }
}
