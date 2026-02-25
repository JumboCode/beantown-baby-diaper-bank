import { NextResponse } from "next/server";
import { processDistributionUpload } from "@/lib/server/distribution-upload";

type UploadRequestBody = {
  csv: string;
  selectedDate: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UploadRequestBody;

    if (!body?.csv || !body?.selectedDate) {
      return NextResponse.json(
        { error: "csv and selectedDate are required." },
        { status: 400 },
      );
    }

    const result = await processDistributionUpload({
      csv: body.csv,
      selectedDate: body.selectedDate,
    });

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to process uploaded distribution data.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
