// ============================================
// GET  /api/history/[id] — 获取单条历史记录
// DELETE /api/history/[id] — 删除指定历史记录
// ============================================

import { NextResponse } from "next/server";
import { getRecord, deleteRecord } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await getRecord(id);

    if (!record) {
      return NextResponse.json(
        { error: "记录不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error("获取历史记录详情错误:", error);
    return NextResponse.json(
      { error: "获取记录详情失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteRecord(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "记录不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除历史记录错误:", error);
    return NextResponse.json(
      { error: "删除记录失败" },
      { status: 500 }
    );
  }
}
